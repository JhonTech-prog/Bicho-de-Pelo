import { SignedXml } from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { loadCertificate } from './certificateService';

function ensureIdAttribute(xml: string, tagName: string, id: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const nodes = doc.getElementsByTagName(tagName);

  if (!nodes.length) {
    throw new Error(`Nó ${tagName} não encontrado para assinatura.`);
  }

  const node = nodes[0];
  if (!node.getAttribute('Id')) {
    node.setAttribute('Id', id);
  }

  return new XMLSerializer().serializeToString(doc);
}

export async function signXmlNode(xml: string, tagName = 'infNFe', id = 'NFe') {
  const certificate = await loadCertificate();
  const xmlWithId = ensureIdAttribute(xml, tagName, id);
  const signer = new SignedXml({
    privateKey: certificate.privateKeyPem,
    publicCert: certificate.certificatePem,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    getKeyInfoContent: () => `<X509Data><X509Certificate>${certificate.certificateBody}</X509Certificate></X509Data>`,
  });

  signer.addReference({
    xpath: `//*[@Id="${id}"]`,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });

  const locationReference = xmlWithId.includes('<infNFeSupl>')
    ? '//*[local-name(.)="infNFeSupl"]'
    : `//*[@Id="${id}"]`;

  signer.computeSignature(xmlWithId, {
    location: { reference: locationReference, action: 'after' },
  });

  return signer.getSignedXml();
}
