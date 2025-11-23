// server.ts

import express from 'express'; 
import type { Request, Response } from 'express';
import multer from 'multer'; 
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// --- DEFINIÇÃO DE __dirname E __filename PARA ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- FIM DA DEFINIÇÃO ---


// IMPORTAÇÕES LOCAIS
import { preparePdf, applySignatureToPdf, addAuditCertificate } from './pdfService.ts'; // NOVO: addAuditCertificate
import { sendSignatureInvite } from './emailService.ts'; 
import { createAuditEntry, initializeDatabase, getAuditEntry, markAsSigned, getAllAuditEntriesByPath } from './dbService.ts'; // NOVO: getAllAuditEntriesByPath

const app = express();
const port = 3000;

app.use(express.json());

// --- Configuração do Multer (O mesmo) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads'); 
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos!')); 
        }
    }
});

// Habilita servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Rota de Teste Simples ---
app.get('/', (_req, res) => { return res.send('Servidor de Assinaturas está ativo e aguardando uploads!'); });

// --- Rota de Upload (POST /upload) ---
app.post('/upload', upload.single('documento'), async (req: Request, res: Response) => {
    // ... (Lógica de upload omitida por brevidade, mas é a mesma) ...
});


// --- Rota 1: Exibir a Página de Assinatura (GET /sign/:token) ---
app.get('/sign/:token', async (req: Request, res: Response) => {
    // ... (Lógica de validação omitida, é a mesma) ...

    // 2. Enviar a página HTML para desenhar a assinatura (Frontend com Visualizador de PDF)
    // ... (O código HTML é o mesmo) ...
});

// --- Rota 2: Processar e Aplicar a Assinatura (POST /process-sign/:token) ---
app.post('/process-sign/:token', async (req: Request, res: Response) => {
    const token = req.params.token;
    const { signatureImageBase64 } = req.body;

    // 1. Validação (DB)
    const auditEntry = await getAuditEntry(token);
    if (!auditEntry || auditEntry.status !== 'PENDENTE') {
        return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }

    const { document_path, signer_name } = auditEntry;
    
    const signerIndex = signer_name.split(' ')[1]; 
    const pdfFieldName = `Assinatura_Pessoa_${signerIndex}`; 
    
    // 2. Aplicação da Assinatura no PDF
    try {
        await applySignatureToPdf(document_path, pdfFieldName, signatureImageBase64);
        
        // 3. Atualizar o status no DB para ASSINADO
        await markAsSigned(token);

        // 4. NOVO: Reconstroi o PDF com o certificado de auditoria
        const auditEntries = await getAllAuditEntriesByPath(document_path);
        await addAuditCertificate(document_path, auditEntries);


        console.log(`✅ Assinatura de ${signer_name} concluída!`);

        return res.status(200).json({ 
            message: 'Assinatura aplicada com sucesso! Documento atualizado.',
            signer: signer_name 
        });

    } catch (error) {
        console.error('Erro ao processar e aplicar a assinatura:', error);
        return res.status(500).json({ message: 'Erro interno ao aplicar assinatura.' });
    }
});


// --- Inicialização do Servidor ---
(async () => {
    try {
        await initializeDatabase();
        
        app.listen(port, () => {
            console.log(`✅ Servidor rodando em http://localhost:${port}`);
        });
    } catch (err) {
        console.error("❌ ERRO FATAL: Não foi possível iniciar o banco de dados.", err);
        process.exit(1); 
    }
})();