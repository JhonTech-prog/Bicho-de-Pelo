import express from 'express';
import cors from 'cors';
import multer from 'multer';
import type { File as MulterFile } from 'multer';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { config } from './config';
import { emitNfce } from './nfceService';
import { readRecords } from './storage';
import { getFiscalConfig, saveCertificate, saveFiscalConfig } from './fiscalConfigService';
import { checkSefazStatus } from './sefazService';

const app = express();
type CertificateUploadRequest = express.Request & { file?: MulterFile };
const uploadDir = path.resolve(config.dataDir, 'uploads');
await mkdir(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().match(/\.(pfx|p12)$/)) {
      cb(new Error('Envie um certificado A1 nos formatos .pfx ou .p12.'));
      return;
    }

    cb(null, true);
  },
});

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem nao permitida pelo CORS.'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'bicho-de-pelo-backend',
    message: 'Backend local ativo. Use o front em http://localhost:3000 ou os endpoints /api.',
    endpoints: [
      'GET /api/health',
      'GET /api/config/fiscal',
      'PUT /api/config/fiscal',
      'POST /api/config/certificate',
      'GET /api/sefaz/status',
      'GET /api/nfce',
      'POST /api/nfce/emit',
      'GET /api/nfce/:number/xml',
    ],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bicho-de-pelo-backend', environment: config.nfce.environment });
});

app.get('/api/config/fiscal', async (_req, res, next) => {
  try {
    res.json(await getFiscalConfig());
  } catch (error) {
    next(error);
  }
});

app.put('/api/config/fiscal', async (req, res, next) => {
  try {
    res.json(await saveFiscalConfig(req.body));
  } catch (error) {
    next(error);
  }
});

app.post('/api/config/certificate', upload.single('certificate'), async (req: CertificateUploadRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo do certificado não enviado.' });
      return;
    }

    const fiscalConfig = await saveCertificate(req.file, String(req.body.password || ''));
    res.status(201).json(fiscalConfig);
  } catch (error) {
    next(error);
  }
});

app.get('/api/sefaz/status', async (_req, res, next) => {
  try {
    res.json(await checkSefazStatus());
  } catch (error) {
    next(error);
  }
});

app.get('/api/nfce', async (_req, res, next) => {
  try {
    const records = await readRecords();
    res.json(records);
  } catch (error) {
    next(error);
  }
});

app.get('/api/nfce/:number/xml', async (req, res, next) => {
  try {
    const records = await readRecords();
    const record = records.find((item) => item.number === Number(req.params.number));

    if (!record) {
      res.status(404).json({ error: 'NFC-e não encontrada.' });
      return;
    }

    res.type('application/xml').send(record.signedXml || record.xml);
  } catch (error) {
    next(error);
  }
});

app.post('/api/nfce/emit', async (req, res, next) => {
  try {
    const record = await emitNfce(req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: error.message || 'Erro inesperado.' });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Backend local rodando em http://0.0.0.0:${config.port}`);
});
