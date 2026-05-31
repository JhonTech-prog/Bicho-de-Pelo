import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { NfceRecord } from './types';

const recordsPath = path.resolve(config.dataDir, 'nfce-records.json');

export async function ensureStorage() {
  await mkdir(path.resolve(config.dataDir), { recursive: true });
}

export async function readRecords(): Promise<NfceRecord[]> {
  await ensureStorage();

  try {
    const raw = await readFile(recordsPath, 'utf8');
    return JSON.parse(raw) as NfceRecord[];
  } catch {
    return [];
  }
}

export async function saveRecord(record: NfceRecord) {
  const records = await readRecords();
  records.unshift(record);
  await writeFile(recordsPath, JSON.stringify(records, null, 2), 'utf8');
}

export async function writeXml(record: NfceRecord) {
  await ensureStorage();
  const xmlPath = path.resolve(config.dataDir, `nfce-${record.number}.xml`);
  await writeFile(xmlPath, record.xml, 'utf8');

  if (record.signedXml) {
    const signedXmlPath = path.resolve(config.dataDir, `nfce-${record.number}-signed.xml`);
    await writeFile(signedXmlPath, record.signedXml, 'utf8');
  }
}
