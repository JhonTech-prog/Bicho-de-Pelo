import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { FiscalConfig } from './types';
import type { File as MulterFile } from 'multer';
import { parseCertificate } from './certificateService';

const privateDir = path.resolve(config.dataDir, 'private');
const configPath = path.resolve(config.dataDir, 'fiscal-config.json');
const secretPath = path.resolve(privateDir, 'fiscal-secret.json');
const certificatePath = path.resolve(privateDir, 'certificate.pfx');

const defaultFiscalConfig: FiscalConfig = {
  companyName: config.company.name,
  cnpj: config.company.cnpj,
  stateRegistration: config.company.stateRegistration,
  cityCode: config.company.cityCode,
  cityName: config.company.cityName,
  state: config.company.state,
  taxRegime: config.nfce.taxRegime as FiscalConfig['taxRegime'],
  csc: config.nfce.csc,
  cscId: config.nfce.cscId,
  nfceSerie: config.nfce.serie,
  nextNfceNumber: config.nfce.nextNumber,
  environment: config.nfce.environment as FiscalConfig['environment'],
};

async function ensureConfigStorage() {
  await mkdir(path.resolve(config.dataDir), { recursive: true });
  await mkdir(privateDir, { recursive: true });
}

export async function getFiscalConfig(): Promise<FiscalConfig> {
  await ensureConfigStorage();

  try {
    const raw = await readFile(configPath, 'utf8');
    return { ...defaultFiscalConfig, ...JSON.parse(raw) };
  } catch {
    return defaultFiscalConfig;
  }
}

export async function saveFiscalConfig(input: FiscalConfig): Promise<FiscalConfig> {
  await ensureConfigStorage();

  const current = await getFiscalConfig();
  const next: FiscalConfig = {
    ...current,
    ...input,
    nfceSerie: Number(input.nfceSerie || 1),
    nextNfceNumber: Number(input.nextNfceNumber || 1),
  };

  await writeFile(configPath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export async function saveCertificate(file: MulterFile, password: string) {
  await ensureConfigStorage();

  const pfxBuffer = await readFile(file.path);
  const certificate = parseCertificate(pfxBuffer, password);

  await copyFile(file.path, certificatePath);
  await writeFile(secretPath, JSON.stringify({ certificatePassword: password }, null, 2), 'utf8');

  const current = await getFiscalConfig();
  return saveFiscalConfig({
    ...current,
    certificate: {
      fileName: file.originalname,
      uploadedAt: new Date().toISOString(),
      hasPassword: Boolean(password),
      ...certificate.metadata,
    },
  });
}
