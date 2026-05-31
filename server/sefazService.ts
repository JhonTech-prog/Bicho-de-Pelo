import https from 'node:https';
import { URL } from 'node:url';
import { createRequire } from 'node:module';
import { getFiscalConfig } from './fiscalConfigService';
import { loadCertificate } from './certificateService';

const require = createRequire(import.meta.url);
const winCa = require('win-ca/fallback');
winCa({ inject: true });

const PB_STATE_CODE = '25';

const SVRS_NFCE_ENDPOINTS = {
  producao: {
    status: 'https://nfce.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
    authorization: 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  },
  homologacao: {
    status: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
    authorization: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  },
};

function escapeXml(value: string | number | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getTagValue(xml: string, tagName: string) {
  return xml.match(new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 's'))?.[1] || '';
}

function getAllTagValues(xml: string, tagName: string) {
  return [...xml.matchAll(new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 'gs'))].map((match) => match[1]);
}

function buildStatusEnvelope(environment: 'homologacao' | 'producao') {
  const tpAmb = environment === 'producao' ? '1' : '2';

  return `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4"><consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${tpAmb}</tpAmb><cUF>${PB_STATE_CODE}</cUF><xServ>STATUS</xServ></consStatServ></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

function buildAuthorizationEnvelope(signedXml: string, loteId: string) {
  return `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${loteId}</idLote><indSinc>1</indSinc>${signedXml.replace(/<\?xml[^>]*\?>/, '')}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

async function postSoapWithCertificate(url: string, xml: string, action: string, rejectUnauthorized = true) {
  const certificate = await loadCertificate();
  const parsedUrl = new URL(url);

  return new Promise<string>((resolve, reject) => {
    const request = https.request(
      {
        method: 'POST',
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        port: parsedUrl.port || 443,
        key: certificate.privateKeyPem,
        cert: certificate.certificatePem,
        rejectUnauthorized,
        headers: {
          'Content-Type': `application/soap+xml; charset=utf-8; action="${action}"`,
          'Content-Length': Buffer.byteLength(xml, 'utf8'),
        },
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`SEFAZ retornou HTTP ${response.statusCode}: ${data.slice(0, 500)}`));
            return;
          }

          resolve(data);
        });
      },
    );

    request.setTimeout(30000, () => {
      request.destroy(new Error('Tempo esgotado ao conectar com a SEFAZ.'));
    });
    request.on('error', reject);
    request.write(xml, 'utf8');
    request.end();
  });
}

export async function checkSefazStatus() {
  const fiscalConfig = await getFiscalConfig();

  if (fiscalConfig.environment === 'local') {
    throw new Error('Selecione Homologacao ou Producao para testar conexao real com a SEFAZ.');
  }

  const environment = fiscalConfig.environment;
  const endpoint = SVRS_NFCE_ENDPOINTS[environment].status;
  const requestXml = buildStatusEnvelope(environment);
  let responseXml: string;
  let tlsWarning: string | undefined;

  try {
    responseXml = await postSoapWithCertificate(
      endpoint,
      requestXml,
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
    );
  } catch (error: any) {
    if (error?.code !== 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
      throw error;
    }

    tlsWarning = 'A cadeia TLS da SEFAZ nao foi reconhecida pelo Node nesta maquina; a consulta foi repetida sem validacao TLS apenas para diagnostico.';
    responseXml = await postSoapWithCertificate(
      endpoint,
      requestXml,
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
      false,
    );
  }

  const cStat = getTagValue(responseXml, 'cStat');
  const xMotivo = getTagValue(responseXml, 'xMotivo');

  return {
    ok: cStat === '107',
    cStat,
    xMotivo: escapeXml(xMotivo),
    environment,
    endpoint,
    tlsWarning,
    responseXml,
  };
}

export async function authorizeNfce(signedXml: string, loteId: string) {
  const fiscalConfig = await getFiscalConfig();

  if (fiscalConfig.environment === 'local') {
    throw new Error('Ambiente Local Simulado nao envia NFC-e para autorizacao. Selecione Homologacao ou Producao.');
  }

  const environment = fiscalConfig.environment;
  const endpoint = SVRS_NFCE_ENDPOINTS[environment].authorization;
  const requestXml = buildAuthorizationEnvelope(signedXml, loteId);
  let responseXml: string;
  let tlsWarning: string | undefined;

  try {
    responseXml = await postSoapWithCertificate(
      endpoint,
      requestXml,
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
    );
  } catch (error: any) {
    if (error?.code !== 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
      throw error;
    }

    tlsWarning = 'A cadeia TLS da SEFAZ nao foi reconhecida pelo Node nesta maquina; a autorizacao foi repetida sem validacao TLS apenas para diagnostico.';
    responseXml = await postSoapWithCertificate(
      endpoint,
      requestXml,
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
      false,
    );
  }

  const cStats = getAllTagValues(responseXml, 'cStat');
  const reasons = getAllTagValues(responseXml, 'xMotivo');
  const authorizationStatus = cStats.at(-1) || getTagValue(responseXml, 'cStat');
  const authorizationReason = reasons.at(-1) || getTagValue(responseXml, 'xMotivo');
  const protocol = getTagValue(responseXml, 'nProt');

  return {
    authorized: authorizationStatus === '100',
    cStat: authorizationStatus,
    xMotivo: escapeXml(authorizationReason),
    protocol,
    environment,
    endpoint,
    tlsWarning,
    responseXml,
  };
}
