import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 🚨 CHIVATO DE DIAGNÓSTICO: Esto nos dirá si Node está leyendo tu .env 🚨
console.log("📡 Estado del Email:", process.env.EMAIL_USER ? `✅ Conectado a: ${process.env.EMAIL_USER}` : "❌ ¡Node no encuentra el correo en el .env!");

// Configuración ROBUSTA para Gmail (Usando el host y puerto directos)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true obliga a usar una conexión blindada (SSL/TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const enviarCorreo = async (destinatario: string, asunto: string, mensajeHtml: string) => {
    try {
        const mailOptions = {
            from: `"Comité CIEI - UNA Puno" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: asunto,
            html: mensajeHtml
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAILER] 📧 ÉXITO: Correo enviado a ${destinatario} (ID: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error('[MAILER] ❌ Error CRÍTICO al enviar el correo:', error);
        return false;
    }
};