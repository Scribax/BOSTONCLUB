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
      from: `"Boston Club" <${process.env.SMTP_USER}>`,
      to,
      subject: '🥂 Bienvenido a Boston Club - Verifica tu cuenta',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #000000; margin: 0; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222222;">
            <!-- Premium Gold Header Bar -->
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, #8A6D3B 0%, #D4AF37 50%, #8A6D3B 100%);"></td>
            </tr>
            
            <tr>
              <td style="padding: 50px 40px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <h1 style="color: #D4AF37; font-size: 28px; font-weight: 900; letter-spacing: 8px; margin: 0; text-transform: uppercase; font-style: italic;">BOSTON CLUB</h1>
                </div>

                <!-- Welcome Text -->
                <h2 style="color: #ffffff; font-size: 24px; font-weight: 300; margin: 0 0 16px 0; text-align: center;">Bienvenido a la exclusividad.</h2>
                <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6; margin: 0 0 40px 0; text-align: center;">
                  Estás a punto de ingresar al club más exclusivo. Utiliza el siguiente código de seguridad para verificar tu identidad y habilitar tu membresía oficial.
                </p>

                <!-- Code Display -->
                <div style="background-color: #111111; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 40px;">
                  <p style="color: #D4AF37; font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 12px 0;">Tu código de acceso</p>
                  <div style="color: #ffffff; font-size: 42px; font-weight: 400; letter-spacing: 16px; font-family: monospace; margin-left: 16px;">${code}</div>
                </div>

                <!-- Warning Text -->
                <p style="color: #666666; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                  Este código de un solo uso expirará en 24 horas.<br>Si no solicitaste este registro, puedes ignorar este correo de forma segura.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #050505; padding: 30px 40px; text-align: center; border-top: 1px solid #1a1a1a;">
                <p style="color: #444444; font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
                  © ${new Date().getFullYear()} BOSTON CLUB SOCIAL
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
      from: `"Boston Club Security" <${process.env.SMTP_USER}>`,
      to,
      subject: '🛡️ Recuperación de Acceso - Boston Club',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #000000; margin: 0; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222222;">
            <!-- Premium Red Header Bar -->
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, #8A1A1A 0%, #FF3B30 50%, #8A1A1A 100%);"></td>
            </tr>
            
            <tr>
              <td style="padding: 50px 40px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <h1 style="color: #FF3B30; font-size: 28px; font-weight: 900; letter-spacing: 8px; margin: 0; text-transform: uppercase; font-style: italic;">BOSTON CLUB</h1>
                </div>

                <!-- Action Text -->
                <h2 style="color: #ffffff; font-size: 24px; font-weight: 300; margin: 0 0 16px 0; text-align: center;">Recuperación de cuenta.</h2>
                <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6; margin: 0 0 40px 0; text-align: center;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Ingresa el siguiente código de seguridad en la aplicación para crear una nueva contraseña.
                </p>

                <!-- Code Display -->
                <div style="background-color: #110505; border: 1px solid rgba(255, 59, 48, 0.3); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 40px;">
                  <p style="color: #FF3B30; font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 12px 0;">Código de Recuperación</p>
                  <div style="color: #ffffff; font-size: 42px; font-weight: 400; letter-spacing: 16px; font-family: monospace; margin-left: 16px;">${code}</div>
                </div>

                <!-- Warning Text -->
                <p style="color: #666666; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                  Este código expirará en 24 horas por tu seguridad.<br>Si no solicitaste este cambio, por favor ignora este correo.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #050505; padding: 30px 40px; text-align: center; border-top: 1px solid #1a1a1a;">
                <p style="color: #444444; font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
                  © ${new Date().getFullYear()} BOSTON CLUB SOCIAL
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Email] Recuperación enviada a ${to}`);
  } catch (err) {
    console.error('[Email Error]', err);
  }
};
