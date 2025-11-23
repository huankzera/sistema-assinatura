// emailService.ts

import * as nodemailer from 'nodemailer';

// --- CONFIGURAÇÃO SMTP DO GMAIL (CREDENCIAIS DO USUÁRIO) ---
// O host, porta e secure são padrões para o Gmail
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, 
    secure: true, 
    auth: {
        // Seu email real será o REMETENTE
        user: "exemplo@gmail.com", 
        // Senha de Aplicativo (App Password) gerada pelo Google. 
        // Atenção: Não use sua senha normal aqui.
        pass: "senhasenhasenhasenha" 
    }
});

/**
 * Envia um convite de assinatura por e-mail.
 * @param recipientEmail O e-mail do destinatário.
 * @param signerName O nome da pessoa que deve assinar.
 * @param signatureLink O link de assinatura único.
 * @returns true se o e-mail foi enviado com sucesso, false caso contrário.
 */
export async function sendSignatureInvite(recipientEmail: string, signerName: string, signatureLink: string): Promise<boolean> {
    
    const mailOptions = {
        // O remetente será o seu email real configurado acima
        from: `"Matheus Vallandro" <exemplo@gmail.com>`, 
        to: recipientEmail,
        subject: `Ação Necessária: Assinatura do Documento - ${signerName}`,
        html: `
            <p>Olá, <strong>${signerName}</strong>,</p>
            <p>Você foi convidado a assinar um documento importante.</p>
            <p>Clique no link abaixo para acessar o documento e completar sua assinatura:</p>
            <p><a href="${signatureLink}"><strong>CLIQUE AQUI PARA ASSINAR O DOCUMENTO</strong></a></p>
            <br>
            <p>Obrigado,</p>
            <p>Sistema de Assinatura Digital</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ E-mail enviado para ${recipientEmail}. URL de Preview (se for Ethereal): ${nodemailer.getTestMessageUrl(info)}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail para ${recipientEmail}:`, error);
        return false;
    }
}