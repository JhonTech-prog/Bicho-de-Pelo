import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(serverDir, '..');

dotenv.config({ path: path.resolve(projectDir, '.env') });
dotenv.config({ path: path.resolve(serverDir, '.env') });

const isElectron = Boolean(process.versions.electron);
const electronUserData = process.env.ELECTRON_USER_DATA || '';

function splitCsv(value: string | undefined) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.BACKEND_PORT || 3333),
  dataDir: process.env.DATA_DIR || (isElectron && electronUserData ? path.resolve(electronUserData, 'data') : 'data'),
  staticDir: process.env.STATIC_DIR || (isElectron ? path.resolve(process.resourcesPath, 'dist') : 'dist'),
  allowedOrigins: splitCsv(process.env.ALLOWED_ORIGINS),
  company: {
    name: process.env.COMPANY_NAME || '',
    cnpj: process.env.COMPANY_CNPJ || '',
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
