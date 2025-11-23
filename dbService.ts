// dbService.ts

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const DB_PATH = './signatures.db'; 
let db: Database; // Variável para armazenar a conexão com o banco de dados

// Tipos para garantir a segurança do TypeScript
export interface AuditEntry {
    token: string;
    document_path: string;
    signer_name: string;
    signer_email: string;
    status: 'PENDENTE' | 'ASSINADO' | 'REJEITADO';
    created_at: string;
    signed_at: string | null;
}

/**
 * Abre a conexão com o banco de dados e cria a tabela se ela não existir.
 */
export async function initializeDatabase() {
    // Usa sqlite3 para o driver, e open para a interface assíncrona
    db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_trail (
            token TEXT PRIMARY KEY,
            document_path TEXT NOT NULL,
            signer_name TEXT NOT NULL,
            signer_email TEXT NOT NULL,
            status TEXT NOT NULL, 
            created_at TEXT NOT NULL,
            signed_at TEXT 
        );
    `);
    console.log('💾 Banco de dados SQLite inicializado e tabela audit_trail verificada.');
}

/**
 * Salva a informação inicial de um signatário no DB e retorna o token único.
 */
export async function createAuditEntry(documentPath: string, signer: { name: string, email: string }): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    await db.run(
        `INSERT INTO audit_trail 
         (token, document_path, signer_name, signer_email, status, created_at, signed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [token, documentPath, signer.name, signer.email, 'PENDENTE', now, null]
    );

    return token;
}

/**
 * Busca uma entrada de auditoria pelo token.
 */
export async function getAuditEntry(token: string): Promise<AuditEntry | undefined> {
    // Note o uso de db.get<AuditEntry> para tipagem segura
    return db.get<AuditEntry>('SELECT * FROM audit_trail WHERE token = ?', [token]); 
}

/**
 * Atualiza o status de um documento para ASSINADO.
 */
export async function markAsSigned(token: string) {
    const now = new Date().toISOString();
    await db.run(
        'UPDATE audit_trail SET status = ?, signed_at = ? WHERE token = ?',
        ['ASSINADO', now, token]
    );
}

/**
 * 🆕 Busca todas as entradas de auditoria para um PDF específico.
 * CORRIGIDO: Retornando Promise<AuditEntry[]>
 */
export async function getAllAuditEntriesByPath(documentPath: string): Promise<AuditEntry[]> {
    // db.all<AuditEntry[]> é a forma correta de tipar o retorno de múltiplos resultados
    return db.all<AuditEntry[]>('SELECT * FROM audit_trail WHERE document_path = ? ORDER BY created_at ASC', [documentPath]);
}