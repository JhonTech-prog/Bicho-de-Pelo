import crypto from 'node:crypto';
import { config } from './config';
import { saveRecord, writeXml, readRecords } from './storage';
import { EmitNfceRequest, NfceRecord, NfceRecordDraft } from './types';
import { hasCertificate } from './certificateService';
import { signXmlNode } from './xmlSigner';
import { getFiscalConfig } from './fiscalConfigService';
import { authorizeNfce } from './sefazService';

type NfceBuildDraft = NfceRecordDraft & { fiscalConfig: Awaited<ReturnType<typeof getFiscalConfig>> };

function assertValidSale(payload: EmitNfceRequest) {
  if (!payload.items?.length) {
    throw new Error('A venda precisa ter pelo menos um item.');
  }

  if (!Number.isFinite(payload.total) || payload.total <= 0) {
    throw new Error('Total da venda invalido.');
  }

  if (!Number.isFinite(payload.amountReceived) || payload.amountReceived < payload.total) {
    throw new Error('Valor recebido menor que o total.');
  }
}

function onlyDigits(value: string | number | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}

function escapeXml(value: string | number | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function calculateNfeCheckDigit(base: string) {
  const sum = base
    .split('')
    .reverse()
    .reduce((total, digit, index) => total + Number(digit) * ((index % 8) + 2), 0);
  const remainder = sum % 11;
  const digit = 11 - remainder;
  return digit >= 10 ? '0' : String(digit);
}

function buildAccessKey(stateCode: string, issueDate: Date, cnpj: string, serie: number, number: number) {
  const aamm = `${String(issueDate.getFullYear()).slice(2)}${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
  const model = '65';
  const emissionType = '1';
  const randomCode = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  const base = `${stateCode}${aamm}${onlyDigits(cnpj).padStart(14, '0')}${model}${String(serie).padStart(3, '0')}${String(number).padStart(9, '0')}${emissionType}${randomCode}`;
  return `${base}${calculateNfeCheckDigit(base)}`;
}

function formatNfeDateTime(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const offsetRestMinutes = String(absoluteOffset % 60).padStart(2, '0');

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}${sign}${offsetHours}:${offsetRestMinutes}`;
}

function buildQrCodeUrl(accessKey: string, cscId: string, csc: string, environment: 'local' | 'homologacao' | 'producao') {
  const tpAmb = environment === 'producao' ? '1' : '2';
  const tokenId = String(Number(onlyDigits(cscId)) || cscId);
  const params = `${accessKey}|2|${tpAmb}|${tokenId}`;
  const hash = crypto.createHash('sha1').update(`${params}${csc}`, 'utf8').digest('hex').toUpperCase();

  return `http://www.sefaz.pb.gov.br/nfce?p=${params}|${hash}`;
}

function buildNfceSupplement(accessKey: string, qrCodeUrl: string) {
  return `<infNFeSupl><qrCode>${escapeXml(qrCodeUrl)}</qrCode><urlChave>www.sefaz.pb.gov.br/nfce</urlChave></infNFeSupl>`;
}

function buildNfceXml(record: NfceBuildDraft) {
  const fiscalConfig = record.fiscalConfig;
  const issueDate = record.issueDate;

  const itemsXml = record.payload.items.map((item, index) => {
    const itemNumber = index + 1;
    const quantity = item.quantity.toFixed(4);
    const unitValue = item.product.price.toFixed(2);
    const total = item.total.toFixed(2);
    const ncm = onlyDigits(item.product.ncm) || '33079000';
    const cfop = onlyDigits(item.product.cfop) || '5102';
    const unit = escapeXml(item.product.unit || 'UN');

    return `<det nItem="${itemNumber}"><prod><cProd>${escapeXml(item.product.id)}</cProd><cEAN>SEM GTIN</cEAN><xProd>${escapeXml(item.product.name)}</xProd><NCM>${ncm}</NCM><CFOP>${cfop}</CFOP><uCom>${unit}</uCom><qCom>${quantity}</qCom><vUnCom>${unitValue}</vUnCom><vProd>${total}</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>${unit}</uTrib><qTrib>${quantity}</qTrib><vUnTrib>${unitValue}</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS><PIS><PISOutr><CST>99</CST><vBC>0.00</vBC><pPIS>0.0000</pPIS><vPIS>0.00</vPIS></PISOutr></PIS><COFINS><COFINSOutr><CST>99</CST><vBC>0.00</vBC><pCOFINS>0.0000</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS></imposto></det>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe${record.accessKey}" versao="4.00"><ide><cUF>25</cUF><cNF>${record.accessKey.slice(-9, -1)}</cNF><natOp>VENDA</natOp><mod>65</mod><serie>${record.serie}</serie><nNF>${record.number}</nNF><dhEmi>${issueDate}</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>${escapeXml(fiscalConfig.cityCode)}</cMunFG><tpImp>4</tpImp><tpEmis>1</tpEmis><cDV>${record.accessKey.slice(-1)}</cDV><tpAmb>${fiscalConfig.environment === 'producao' ? '1' : '2'}</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>BichoDePelo-1.0</verProc></ide><emit><CNPJ>${escapeXml(onlyDigits(fiscalConfig.cnpj))}</CNPJ><xNome>${escapeXml(fiscalConfig.companyName)}</xNome><enderEmit><xLgr>Vigario Calixto</xLgr><nro>1218</nro><xBairro>Catole</xBairro><cMun>${escapeXml(fiscalConfig.cityCode)}</cMun><xMun>${escapeXml(fiscalConfig.cityName)}</xMun><UF>${escapeXml(fiscalConfig.state)}</UF><CEP>58410340</CEP></enderEmit><IE>${escapeXml(onlyDigits(fiscalConfig.stateRegistration))}</IE><CRT>${fiscalConfig.taxRegime === 'simples' ? '1' : '3'}</CRT></emit>${itemsXml}<total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>${record.payload.total.toFixed(2)}</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>${record.payload.total.toFixed(2)}</vNF></ICMSTot></total><transp><modFrete>9</modFrete></transp><pag><detPag><tPag>01</tPag><vPag>${record.payload.amountReceived.toFixed(2)}</vPag></detPag></pag><infAdic><infCpl>NFC-e enviada para autorizacao pela SVRS.</infCpl></infAdic></infNFe>${buildNfceSupplement(record.accessKey, record.qrCodeUrl)}</NFe>`;
}

export async function emitNfce(payload: EmitNfceRequest): Promise<NfceRecord> {
  assertValidSale(payload);

  const fiscalConfig = await getFiscalConfig();
  const records = await readRecords();
  const nextNumber = Math.max(
    Number(fiscalConfig.nextNfceNumber || 1),
    records.reduce((max, record) => Math.max(max, record.number + 1), 1),
  );
  const issueDateObj = new Date();
  const issueDate = formatNfeDateTime(issueDateObj);
  const serie = Number(fiscalConfig.nfceSerie || config.nfce.serie || 1);
  const accessKey = buildAccessKey('25', issueDateObj, fiscalConfig.cnpj, serie, nextNumber);
  const qrCodeUrl = buildQrCodeUrl(accessKey, fiscalConfig.cscId, fiscalConfig.csc, fiscalConfig.environment);

  const baseRecord: NfceBuildDraft = {
    id: crypto.randomUUID(),
    number: nextNumber,
    serie,
    issueDate,
    status: fiscalConfig.environment === 'local' ? 'SIMULADA' : 'ERRO',
    protocol: fiscalConfig.environment === 'local' ? `LOCAL-${Date.now()}` : 'AGUARDANDO-SEFAZ',
    accessKey,
    signatureStatus: 'NOT_CONFIGURED',
    danfeUrl: `http://localhost:${config.port}/api/nfce/${nextNumber}/xml`,
    qrCodeUrl,
    payload,
    fiscalConfig,
  };

  const { fiscalConfig: _fiscalConfig, ...recordBase } = baseRecord;
  const record: NfceRecord = {
    ...recordBase,
    xml: buildNfceXml(baseRecord),
  };

  if (await hasCertificate()) {
    try {
      record.signedXml = await signXmlNode(record.xml, 'infNFe', `NFe${record.accessKey}`);
      record.signatureStatus = 'SIGNED';
    } catch (error: any) {
      record.signatureStatus = 'ERROR';
      record.signatureError = error.message || 'Erro ao assinar XML.';
    }
  }

  if (fiscalConfig.environment !== 'local') {
    if (!record.signedXml || record.signatureStatus !== 'SIGNED') {
      throw new Error(record.signatureError || 'NFC-e precisa estar assinada antes do envio para a SEFAZ.');
    }

    const authorization = await authorizeNfce(record.signedXml, String(record.number).padStart(15, '0'));
    record.authorizationStatus = authorization.cStat;
    record.authorizationReason = authorization.xMotivo;
    record.authorizationResponseXml = authorization.responseXml;

    if (!authorization.authorized) {
      record.status = 'ERRO';
      record.protocol = `SEFAZ-${authorization.cStat || 'ERRO'}`;
      await saveRecord(record);
      await writeXml(record);
      throw new Error(`SEFAZ rejeitou a NFC-e (${authorization.cStat}): ${authorization.xMotivo}`);
    }

    record.status = 'AUTORIZADA';
    record.protocol = authorization.protocol;
  }

  await saveRecord(record);
  await writeXml(record);

  return record;
}
