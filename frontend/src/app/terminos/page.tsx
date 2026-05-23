export const metadata = {
  title: 'Términos y Condiciones — Boston Club',
  description: 'Términos y condiciones de uso de la aplicación My Boston Club.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-boston-gold font-bold text-sm uppercase tracking-widest mb-3">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-boston-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-12 text-center">
          <p className="text-boston-gold text-xs uppercase tracking-[0.3em] font-bold mb-3">Boston Club</p>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Terms &amp; Conditions</h1>
          <p className="text-white/30 text-xs">Effective as of 2026-05-23</p>
        </div>

        <div className="glass-panel rounded-2xl p-8">

          <Section title="Agreement">
            <p>These terms and conditions apply to the My Boston Club app (hereby referred to as &ldquo;Application&rdquo;) for mobile devices, created by Franco Demartos (hereby referred to as &ldquo;Service Provider&rdquo;) as a Free service.</p>
            <p>Upon downloading or utilizing the Application, you are automatically agreeing to the following terms.</p>
          </Section>

          <Section title="Intellectual Property">
            <p>Unauthorized copying or modification of the Application, or our trademarks, is strictly prohibited. All trademarks, copyrights, database rights, and other intellectual property rights related to the Application remain the property of the Service Provider.</p>
          </Section>

          <Section title="Service & Security">
            <p>The Application stores and processes personal data you have provided. It is your responsibility to maintain the security of your phone. The Service Provider strongly advises against jailbreaking or rooting your phone, as such actions could compromise security and may result in the Application not functioning correctly.</p>
            <p>Third-party services used by the Application have their own Terms and Conditions:</p>
            <ul className="list-disc list-inside">
              <li><a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-boston-gold hover:underline">Google Play Services</a></li>
            </ul>
          </Section>

          <Section title="Connectivity & Responsibility">
            <p>Some functions require an active internet connection. The Service Provider cannot be held responsible if the Application does not function at full capacity due to lack of Wi-Fi or exhausted data allowance.</p>
            <p>If using the application outside a Wi-Fi area, your mobile network provider&apos;s terms apply. You accept responsibility for any data charges, including roaming charges.</p>
          </Section>

          <Section title="Updates & Termination">
            <p>The Service Provider may update the application at any point. You agree to always accept updates when offered. The Service Provider may also cease providing the application and terminate its use at any time without notice. Upon termination, you must cease using the application and delete it from your device.</p>
          </Section>

          <Section title="Changes to These Terms">
            <p>The Service Provider may periodically update these Terms and Conditions. You are advised to review this page regularly for any changes.</p>
          </Section>

          <Section title="Contact Us">
            <p>If you have any questions about these Terms and Conditions, please contact us at: <a href="mailto:bostonamericanapp@gmail.com" className="text-boston-gold hover:underline">bostonamericanapp@gmail.com</a></p>
          </Section>

        </div>
      </div>
    </main>
  );
}
