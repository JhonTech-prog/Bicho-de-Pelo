export interface ProductInput {
  id: string;
  name: string;
  price: number;
  ncm?: string;
  cfop?: string;
  unit?: string;
}

export interface SaleItemInput {
  product: ProductInput;
  quantity: number;
  total: number;
}

export interface EmitNfceRequest {
  items: SaleItemInput[];
  total: number;
  amountReceived: number;
  customer?: {
    name?: string;
    document?: string;
    email?: string;
  };
}

export interface NfceRecord {
  id: string;
  number: number;
  serie: number;
  issueDate: string;
  status: 'AUTORIZADA' | 'SIMULADA' | 'ERRO';
  protocol: string;
  accessKey: string;
  xml: string;
  signedXml?: string;
  signatureStatus: 'NOT_CONFIGURED' | 'SIGNED' | 'ERROR';
  signatureError?: string;
  authorizationStatus?: string;
  authorizationReason?: string;
  authorizationResponseXml?: string;
  danfeUrl: string;
  qrCodeUrl: string;
  payload: EmitNfceRequest;
}

export type NfceRecordDraft = Omit<NfceRecord, 'xml' | 'signedXml' | 'signatureError'>;

export interface FiscalConfig {
  companyName: string;
  cnpj: string;
  stateRegistration: string;
  cityCode: string;
  cityName: string;
  state: string;
  taxRegime: 'simples' | 'normal';
  csc: string;
  cscId: string;
  nfceSerie: number;
  nextNfceNumber: number;
  environment: 'local' | 'homologacao' | 'producao';
  certificate?: {
    fileName: string;
    uploadedAt: string;
    hasPassword: boolean;
    subjectName?: string;
    issuerName?: string;
    serialNumber?: string;
    validFrom?: string;
    validTo?: string;
  };
}
