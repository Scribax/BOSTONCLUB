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
    console.log(`\n[SECURITY] Código de Verificación para ${to}: ${code}\n`);
    await transporter.sendMail({
      from: `"Boston Club VIP" <${process.env.SMTP_USER}>`,
      to,
      subject: '✨ Verifica tu cuenta - Boston Club VIP',
      html: `
        <div style="background-color: #050505; padding: 50px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: #111111; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 30px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- Logo Header -->
            <div style="margin-bottom: 30px;">
              <h1 style="color: #D4AF37; font-size: 24px; font-weight: 900; letter-spacing: 5px; margin: 0; text-transform: uppercase; font-style: italic;">BOSTON CLUB</h1>
              <div style="height: 1px; width: 100px; background: linear-gradient(to right, transparent, #D4AF37, transparent); margin: 10px auto;"></div>
            </div>

            <h2 style="font-size: 18px; font-weight: 400; color: #ffffff; margin-bottom: 10px;">¡Bienvenido a la Experiencia VIP!</h2>
            <p style="font-size: 14px; color: #888888; line-height: 1.6; margin-bottom: 30px; padding: 0 20px;">
              Estás a un solo paso de acceder a beneficios exclusivos, eventos premium y recompensas únicas.
            </p>

            <!-- Code Box -->
            <div style="background-color: #000000; border: 1px solid #D4AF37; border-radius: 20px; padding: 30px; margin-bottom: 30px;">
              <span style="font-size: 10px; color: #D4AF37; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">Código de Seguridad</span>
              <div style="font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; margin-top: 10px; font-family: monospace;">${code}</div>
            </div>

            <p style="font-size: 12px; color: #555555; margin-bottom: 0;">Este código expirará en 24 horas por motivos de seguridad.</p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px;">
            <p style="font-size: 10px; color: #444444; letter-spacing: 2px; text-transform: uppercase;">© 2026 Boston Club Social • Premium Membership</p>
          </div>
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
    console.log(`\n[SECURITY] Código de Recuperación para ${to}: ${code}\n`);
    await transporter.sendMail({
      from: `"Boston Club VIP" <${process.env.SMTP_USER}>`,
      to,
      subject: '🛡️ Recuperar tu cuenta - Boston Club VIP',
      html: `
        <div style="background-color: #050505; padding: 50px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: #111111; border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 30px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- Danger Header -->
            <div style="margin-bottom: 30px;">
              <h1 style="color: #ff4d4d; font-size: 24px; font-weight: 900; letter-spacing: 5px; margin: 0; text-transform: uppercase; font-style: italic;">BOSTON CLUB</h1>
              <div style="height: 1px; width: 100px; background: linear-gradient(to right, transparent, #ff4d4d, transparent); margin: 10px auto;"></div>
            </div>

            <h2 style="font-size: 18px; font-weight: 400; color: #ffffff; margin-bottom: 10px;">Recuperación de Acceso</h2>
            <p style="font-size: 14px; color: #888888; line-height: 1.6; margin-bottom: 30px; padding: 0 20px;">
              Has solicitado restablecer tu contraseña. Utiliza el siguiente código para validar tu identidad.
            </p>

            <!-- Code Box -->
            <div style="background-color: #1a0000; border: 1px solid #ff4d4d; border-radius: 20px; padding: 30px; margin-bottom: 30px;">
              <span style="font-size: 10px; color: #ff4d4d; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">Código de Recuperación</span>
              <div style="font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; margin-top: 10px; font-family: monospace;">${code}</div>
            </div>

            <p style="font-size: 12px; color: #555555; margin-bottom: 0;">Si no solicitaste este cambio, te recomendamos asegurar tu cuenta.</p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px;">
            <p style="font-size: 10px; color: #444444; letter-spacing: 2px; text-transform: uppercase;">© 2026 Boston Club Social • Security Service</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Recuperación enviada a ${to}`);
  } catch (err) {
    console.error('[Email Error]', err);
  }
};
