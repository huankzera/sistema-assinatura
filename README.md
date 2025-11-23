# sistema-assinatura by: Huank
# 🖋️ Sistema de Assinatura Digital de Documentos PDF

Este projeto implementa um **fluxo de trabalho completo** para recebimento, notificação e coleta de múltiplas assinaturas em documentos PDF, utilizando um backend robusto em Node.js e TypeScript.

O sistema atende aos seguintes requisitos principais:
1.  **Assinaturas Múltiplas:** Permite a coleta de assinaturas de 4 ou mais signatários.
2.  **Rastreamento em Tempo Real:** Status de cada signatário é monitorado no banco de dados.
3.  **Validade Documental:** O PDF finalizado inclui um **Certificado de Auditoria** como última página, comprovando quem assinou e quando.
4.  **UX Limpa:** Os campos de assinatura são aplicados no PDF e **automaticamente removidos** (não ficam como retângulos brancos).

---

## ⚙️ Tecnologias Principais

| Tecnologia | Função no Projeto |
| :--- | :--- |
| **Node.js / Express / TypeScript** | Servidor Backend e Roteamento. |
| **Git / GitHub** | Controle de Versão. |
| **PDF-Lib** | Criação de campos invisíveis, aplicação da imagem da assinatura e geração da página de certificado. |
| **SQLite** | Trilha de Auditoria (Armazena tokens, status PENDENTE/ASSINADO e caminhos dos arquivos). |
| **Nodemailer** | Envio de convites de assinatura por e-mail (usando credenciais seguras do Gmail/App Password). |

---

## 🛠️ Configuração Inicial

### 1. Requisitos

* **Node.js** (versão LTS).
* **Git** (instalado e configurado).
* Conta no **Gmail** com **Senha de Aplicativo (App Password)** gerada para o envio de e-mails.

### 2. Instalação de Dependências

Na raiz do projeto, instale todos os pacotes necessários:

```bash
npm install express multer pdf-lib sqlite sqlite3 nodemailer
npm install -D @types/node @types/express @types/multer @types/sqlite3 typescript ts-node



