import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import forge from 'node-forge';
import { config } from './config';

const privateDir = path.resolve(config.dataDir, 'private');
const certificatePath = path.resolve(privateDir, 'certificate.pfx');
const secretPath = path.resolve(privateDir, 'fiscal-secret.json');

export interface CertificateMetadata {
  subjectName: string;
  issuerName: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
}

export interface LoadedCertificate {
  privateKeyPem: string;
  certificatePem: string;
  certificateBody: string;
  metadata: CertificateMetadata;
}

export interface CertificateAuthMaterial {
  pfxBuffer: Buffer;
  certificatePassword: string;
}

export async function hasCertificate() {
  try {
    await access(certificatePath);
    await access(secretPath);
    return true;
  } catch {
    return false;
  }
}

export async function loadCertificate(): Promise<LoadedCertificate> {
  const { pfxBuffer, certificatePassword } = await loadCertificateAuthMaterial();
  return parseCertificate(pfxBuffer, certificatePassword);
}

export async function loadCertificateAuthMaterial(): Promise<CertificateAuthMaterial> {
  const [pfxBuffer, secretRaw] = await Promise.all([
    readFile(certificatePath),
    readFile(secretPath, 'utf8'),
  ]);

  const { certificatePassword } = JSON.parse(secretRaw) as { certificatePassword: string };
  return { pfxBuffer, certificatePassword };
}

function formatAttributes(attributes: forge.pki.CertificateField[]) {
  return attributes
    .map((attribute) => `${attribute.shortName || attribute.name}=${attribute.value}`)
    .join(', ');
}

function publicKeyMatchesPrivateKey(cert: forge.pki.Certificate, privateKey: forge.pki.PrivateKey) {
  const md = forge.md.sha256.create();
  md.update('bicho-de-pelo-certificate-validation', 'utf8');
  const signature = privateKey.sign(md);

  return cert.publicKey.verify(md.digest().bytes(), signature);
}

export function parseCertificate(pfxBuffer: Buffer, certificatePassword: string): LoadedCertificate {
  let p12: forge.pkcs12.Pkcs12Pfx;

  try {
    const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certificatePassword);
  } catch {
    throw new Error('Certificado A1 invalido ou senha incorreta.');
  }

  const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
    forge.pki.oids.pkcs8ShroudedKeyBag
  ]?.[0] || p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0];

  const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Error('Nao foi possivel extrair chave privada/certificado do arquivo A1.');
  }

  if (!publicKeyMatchesPrivateKey(certBag.cert, keyBag.key)) {
    throw new Error('A chave privada nao corresponde ao certificado digital informado.');
  }

  const now = new Date();
  if (now < certBag.cert.validity.notBefore) {
    throw new Error(`Certificado digital ainda nao e valido. Inicio da validade: ${certBag.cert.validity.notBefore.toLocaleDateString('pt-BR')}.`);
  }

  if (now > certBag.cert.validity.notAfter) {
    throw new Error(`Certificado digital vencido em ${certBag.cert.validity.notAfter.toLocaleDateString('pt-BR')}.`);
  }

  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
  const certificatePem = forge.pki.certificateToPem(certBag.cert);
  const certificateBody = certificatePem
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\s/g, '');

  return {
    privateKeyPem,
    certificatePem,
    certificateBody,
    metadata: {
      subjectName: formatAttributes(certBag.cert.subject.attributes),
      issuerName: formatAttributes(certBag.cert.issuer.attributes),
      serialNumber: certBag.cert.serialNumber,
      validFrom: certBag.cert.validity.notBefore.toISOString(),
      validTo: certBag.cert.validity.notAfter.toISOString(),
    },
  };
}
