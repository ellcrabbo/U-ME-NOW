import { DocLayout, TemplateNotice, H2 } from '../components/DocLayout'
import { SUPPORT_EMAIL } from '../lib/supabase'

export function Terms() {
  return (
    <DocLayout title="Terms of Service">
      <TemplateNotice />
      <p>Welcome to U, ME, NOW. By creating an account you agree to these Terms.</p>
      <H2>1. Eligibility</H2>
      <p>You must be at least 18 years old and legally able to enter this agreement. Accounts found to belong to minors are removed immediately.</p>
      <H2>2. Acceptable use</H2>
      <p>U, ME, NOW is for mainstream adult dating and social discovery. It is not for commercial solicitation, sexual services, escorting, explicit content, pornography, or transactions between users. Such activity is prohibited and may be reported to authorities.</p>
      <H2>3. Your content</H2>
      <p>You are responsible for your profile, photos, and messages. Upload only real photos of yourself that you have the right to share. No explicit imagery.</p>
      <H2>4. Safety and conduct</H2>
      <p>Treat others with respect. Harassment, hate, threats, scams, and impersonation lead to suspension or ban.</p>
      <H2>5. Suspension and termination</H2>
      <p>We may suspend or terminate accounts that violate these Terms or our Community Guidelines.</p>
      <H2>6. Disclaimers</H2>
      <p>We do not conduct background checks. Always meet safely and use your judgement. The service is provided "as is".</p>
      <H2>7. Contact</H2>
      <p>Questions about these Terms: {SUPPORT_EMAIL}.</p>
    </DocLayout>
  )
}

export function Privacy() {
  return (
    <DocLayout title="Privacy Policy">
      <TemplateNotice />
      <p>Your privacy matters. This policy explains what we collect and how we protect it.</p>
      <H2>What we collect</H2>
      <p>Account email, your date of birth (kept private), display name, public age, city, broad area (kept private), bio, intents, photos, likes, matches, and messages.</p>
      <H2>What is public</H2>
      <p>Other users can see your display name, age, city ("Jakarta"), bio, intents, photos, and activity status. They never see your date of birth, your broad area, exact location, coordinates, address, or distance.</p>
      <H2>Location</H2>
      <p>We do not use device GPS. Your broad area is only used privately to decide whether another member is in your area, shown only as a "Nearby" label.</p>
      <H2>Storage and security</H2>
      <p>Data is stored in Supabase with row-level security. Photos live in a private storage bucket accessed through short-lived signed links.</p>
      <H2>Your controls</H2>
      <p>You can edit your profile, turn discovery off, block users, and permanently delete your account and data at any time from Settings.</p>
      <H2>Contact</H2>
      <p>Privacy questions: {SUPPORT_EMAIL}.</p>
    </DocLayout>
  )
}

export function Guidelines() {
  return (
    <DocLayout title="Community Guidelines">
      <TemplateNotice />
      <p>U, ME, NOW works because people feel safe and respected. Follow these rules.</p>
      <H2>Be real</H2>
      <p>Use your own recent photos and honest information. No impersonation or fake profiles.</p>
      <H2>Be respectful</H2>
      <p>No harassment, hate speech, threats, or discrimination.</p>
      <H2>Keep it appropriate</H2>
      <p>No explicit or pornographic content, no nudity, no sexual services or solicitation, no transactions between users.</p>
      <H2>Adults only</H2>
      <p>Everyone here is 18+. Report anyone who appears to be a minor immediately.</p>
      <H2>Consequences</H2>
      <p>Breaking these guidelines can lead to content removal, suspension, or a permanent ban.</p>
    </DocLayout>
  )
}

export function Contact() {
  return (
    <DocLayout title="Contact">
      <TemplateNotice />
      <p>We're here to help with safety concerns, account issues, and questions.</p>
      <H2>Support</H2>
      <p>
        Email us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal underline" data-testid="contact-email">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <H2>Urgent safety</H2>
      <p>If you are in immediate danger, contact local emergency services first. Then report the user in the app so our moderators can act.</p>
    </DocLayout>
  )
}
