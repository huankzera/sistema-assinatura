// pdfService.ts

import * as PDFLib from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// Lista das 4 assinaturas que precisamos
export const SIGNERS = [
    'Assinatura_Pessoa_1',
    'Assinatura_Pessoa_2',
    'Assinatura_Pessoa_3',
    'Assinatura_Pessoa_4'
];

/**
 * Carrega um PDF, adiciona os 4 campos de assinatura (placeholders) e salva o novo PDF.
 */
export async function preparePdf(inputPath: string): Promise<string> {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes); 
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    const fieldWidth = 150;
    const fieldHeight = 50;
    
    const fieldPositions = [
        { name: SIGNERS[0], x: 50, y: height - 100 },
        { name: SIGNERS[1], x: width - 200, y: height - 100 },
        { name: SIGNERS[2], x: 50, y: height - 200 },
        { name: SIGNERS[3], x: width - 200, y: height - 200 }
    ];

    for (const pos of fieldPositions) {
        const signatureField = form.createTextField(pos.name);
        
        // CORREÇÃO UX DEFINITIVA: Remove toda a aparência do campo.
        signatureField.addToPage(firstPage, {
            x: pos.x,
            y: pos.y,
            width: fieldWidth,
            height: fieldHeight,
            borderWidth: 0, // ZERA A BORDA
            borderColor: PDFLib.rgb(1, 1, 1), 
            backgroundColor: PDFLib.rgb(1, 1, 1), 
        });
        
        signatureField.setText(''); // Remove o texto placeholder
    }

    // Define o caminho de saída e salva o PDF
    const dirName = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${baseName}_preparado.pdf`;
    const outputPath = path.join(dirName, outputFileName);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    fs.unlinkSync(inputPath);

    return outputPath;
}

// -------------------------------------------------------------------
// FUNÇÕES DE ASSINATURA E AUDITORIA
// -------------------------------------------------------------------

/**
 * Adiciona uma página final de certificado de auditoria ao PDF.
 * CORRIGIDO: Retirada a desestruturação de array na criação da página.
 */
export async function addAuditCertificate(pdfPath: string, auditEntries: any[]) {
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    
    // CORREÇÃO TS(2488): Captura o objeto Page diretamente
    const page = pdfDoc.addPage();
    const { width } = page.getSize();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    
    page.drawText('Certificado de Assinatura Digital', { x: 50, y: page.getHeight() - 50, size: 24, font: helvetica });
    page.drawText('--- Este documento foi assinado eletronicamente ---', { x: 50, y: page.getHeight() - 80, size: 12, font: helvetica });

    let yOffset = page.getHeight() - 120;
    
    auditEntries.forEach(entry => {
        const statusText = entry.signed_at ? `ASSINADO em: ${new Date(entry.signed_at).toLocaleString()}` : `PENDENTE`;
        const color = entry.signed_at ? PDFLib.rgb(0, 0.5, 0) : PDFLib.rgb(0.5, 0.5, 0.5);

        page.drawText(`Signatário: ${entry.signer_name} (${entry.signer_email})`, { x: 50, y: yOffset, size: 12, font: helvetica });
        yOffset -= 15;
        page.drawText(`Status: ${statusText}`, { x: 50, y: yOffset, size: 12, font: helvetica, color: color });
        yOffset -= 30;
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
}

/**
 * Aplica uma imagem de assinatura no campo de formulário especificado do PDF.
 */
export async function applySignatureToPdf(pdfPath: string, fieldName: string, signatureImageBase64: string): Promise<void> {
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    const base64Data = signatureImageBase64.replace(/^data:image\/png;base64,/, "");
    const imageBytes = Buffer.from(base64Data, 'base64');
    const pngImage = await pdfDoc.embedPng(imageBytes);
    
    const field = form.getTextField(fieldName);
    const widgets = field.acroField.getWidgets();
    
    if (widgets.length === 0) {
        throw new Error(`Campo de assinatura '${fieldName}' não encontrado no PDF.`);
    }

    const widget = widgets[0] as any; 
    const rect = widget.getRectangle();

    // Localização da página (Corrigido para usar o índice 0)
    const pageIndex = 0; 
    
    if (pageIndex >= pdfDoc.getPages().length) {
        throw new Error("Erro de programação: Índice de página fora dos limites.");
    }
    
    const page = pdfDoc.getPages()[pageIndex];

    // 1. Desenha a imagem da assinatura no local do campo
    page.drawImage(pngImage, {
        x: rect.x + 2, 
        y: rect.y + 2,
        width: rect.width - 4, 
        height: rect.height - 4,
    });
    
    // 2. REMOÇÃO FINAL: Remove o campo de formulário após desenhar a imagem.
    form.removeField(field);

    // 3. Salva o PDF, sobrescrevendo o arquivo existente
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
}