export const metadata = {
  title: 'Política de Privacidad — Boston Club',
  description: 'Política de privacidad de la aplicación My Boston Club.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-boston-gold font-bold text-sm uppercase tracking-widest mb-3">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-boston-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-boston-gold text-xs uppercase tracking-[0.3em] font-bold mb-3">Boston Club</p>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-white/30 text-xs">Effective as of 2026-05-23</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 space-y-8">

          <Section title="About this Policy">
            <p>This privacy policy applies to the My Boston Club app (hereby referred to as &ldquo;Application&rdquo;) for mobile devices that was created by Franco Demartos (hereby referred to as &ldquo;Service Provider&rdquo;) as a Free service. This service is intended for use &ldquo;AS IS&rdquo;.</p>
          </Section>

          <Section title="Information Collection and Use">
            <p>The Application collects information when you download and use it. This information may include:</p>
            <ul className="list-disc list-inside space-y-1 text-white/50">
              <li>Your device&apos;s Internet Protocol address (e.g. IP address)</li>
              <li>The pages of the Application that you visit, the time and date of your visit</li>
              <li>The time spent on the Application</li>
              <li>The operating system you use on your mobile device</li>
            </ul>
            <p>The Application does not gather precise information about the location of your mobile device.</p>
            <p>The Application does not use Artificial Intelligence (AI) technologies to process your data.</p>
            <p>For a better experience, the Service Provider may require you to provide personally identifiable information, including but not limited to: Email, First name, Last name, National ID (DNI), Phone number, Date of birth, Profile picture.</p>
          </Section>

          <Section title="Third Party Access">
            <p>Only aggregated, anonymized data is periodically transmitted to external services. The Application utilizes third-party services that have their own Privacy Policy:</p>
            <ul className="list-disc list-inside">
              <li><a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-boston-gold hover:underline">Google Play Services</a></li>
            </ul>
          </Section>

          <Section title="Opt-Out Rights">
            <p>You can stop all collection of information by the Application by uninstalling it using the standard uninstall processes available on your mobile device or via the application marketplace.</p>
          </Section>

          <Section title="Data Retention Policy">
            <p>The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. To request deletion of your data, contact bostonamericanapp@gmail.com.</p>
          </Section>

          <Section title="Children">
            <p>The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13. If you believe your child has provided personal information, contact bostonamericanapp@gmail.com immediately.</p>
          </Section>

          <Section title="Security">
            <p>The Service Provider provides physical, electronic, and procedural safeguards to protect the information it processes and maintains.</p>
          </Section>

          <Section title="Changes">
            <p>This Privacy Policy may be updated from time to time. You are advised to review this page regularly. Continued use of the Application is deemed approval of all changes.</p>
          </Section>

          <Section title="Your Consent">
            <p>By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy.</p>
          </Section>

          <Section title="Contact Us">
            <p>If you have any questions regarding privacy, please contact us at: <a href="mailto:bostonamericanapp@gmail.com" className="text-boston-gold hover:underline">bostonamericanapp@gmail.com</a></p>
          </Section>

        </div>
      </div>
    </main>
  );
}
