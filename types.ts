
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EMITIR = 'EMITIR',
  CERTIFICADO = 'CERTIFICADO',
  HISTORICO = 'HISTORICO',
  CONFIGURACOES = 'CONFIGURACOES'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  ncm: string;
  unit: string;
}

export interface SaleItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Coupon {
  id: string;
  number: number;
  serie: number;
  date: string;
  items: SaleItem[];
  total: number;
  status: 'AUTORIZADA' | 'CANCELADA' | 'ERRO';
  protocol?: string;
  xmlUrl?: string;
  qrCode?: string;
}

export interface CompanyInfo {
  name: string;
  fantasyName: string;
  cnpj: string;
  ie: string;
  address: string;
  csc: string;
  cscId: string;
  environment: 'homologacao' | 'producao';
}

export interface CertificateData {
  fileName: string;
  expiryDate: string;
  subject: string;
  isLoaded: boolean;
}
