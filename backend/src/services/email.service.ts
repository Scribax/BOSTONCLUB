import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  try {
    await transporter.sendMail({
      from: `"Boston Club VIP" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verifica tu cuenta - Boston Club',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #D4AF37; text-align: center;">¡Bienvenido a Boston Club!</h2>
          <p>Para empezar a disfrutar de tus beneficios VIP, por favor ingresa el siguiente código en la aplicación:</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #333;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Este código expirará en 24 horas.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
        </div>
      `,
    });
    console.log(`[Email] Verificación enviada a ${to}`);
  } catch (err) {
    console.error('[Email Error]', err);
  }
};

export const sendPasswordResetEmail = async (to: string, code: string) => {
  try {
    await transporter.sendMail({
      from: `"Boston Club VIP" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Recuperar Contraseña - Boston Club',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #D4AF37; text-align: center;">Recuperación de Cuenta</h2>
          <p>Has solicitado restablecer tu contraseña. Ingresa el siguiente código de seguridad en la aplicación para continuar:</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #d9534f;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Este código expirará en 1 hora por seguridad.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no solicitaste este cambio, te recomendamos cambiar tu contraseña actual.</p>
        </div>
      `,
    });
    console.log(`[Email] Recuperación enviada a ${to}`);
  } catch (err) {
    console.error('[Email Error]', err);
  }
};
