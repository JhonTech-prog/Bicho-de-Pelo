import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.BACKEND_PORT || 3333),
  dataDir: process.env.DATA_DIR || 'data',
  company: {
    name: process.env.COMPANY_NAME || 'BICHO DE PELO',
    cnpj: process.env.COMPANY_CNPJ || '26614661000109',
    stateRegistration: process.env.COMPANY_IE || '',
    cityCode: process.env.COMPANY_CITY_CODE || '2504009',
    cityName: process.env.COMPANY_CITY_NAME || 'Campina Grande',
    state: process.env.COMPANY_STATE || 'PB',
  },
  nfce: {
    environment: process.env.NFCE_ENV || 'local',
    taxRegime: process.env.COMPANY_TAX_REGIME || 'simples',
    csc: process.env.NFCE_CSC || '',
    cscId: process.env.NFCE_CSC_ID || '',
    serie: Number(process.env.NFCE_SERIE || 1),
    nextNumber: Number(process.env.NFCE_NEXT_NUMBER || 1),
  },
};
