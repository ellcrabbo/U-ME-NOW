import { DocLayout, H2 } from '../components/DocLayout'
import { SUPPORT_EMAIL } from '../lib/supabase'

const UPDATED = '2 September 2026'

function Updated() {
  return <p className="text-xs text-warm-faint">Last updated: {UPDATED}</p>
}

export function Terms() {
  return (
    <DocLayout title="Terms of Service">
      <Updated />
      <p>These Terms govern your use of U, ME, NOW., an adults-only online dating and social-discovery service operated for users in Jakarta, Indonesia.</p>

      <H2>1. Eligibility</H2>
      <p>You must be at least 18 years old to create or use an account. You must provide information that is accurate and not misleading. We may require age assurance or other verification and may refuse or restrict access where we cannot establish eligibility.</p>

      <H2>2. The service</H2>
      <p>U, ME, NOW. provides profile discovery, matching and user-to-user communication. We do not guarantee that you will receive matches, messages, dates, relationships or any particular outcome. We do not perform criminal background checks unless expressly stated for a particular service.</p>

      <H2>3. Your account</H2>
      <p>You are responsible for keeping your account credentials secure and for activity carried out through your account. You must not sell, transfer, lend or share your account. Tell us promptly if you believe your account has been compromised.</p>

      <H2>4. User content</H2>
      <p>You remain responsible for the content you submit, including photographs, profile information and messages. You must have the necessary rights and permissions to submit that content. You grant us a limited, non-exclusive licence to host, reproduce, display and process it as necessary to operate, secure and moderate the service.</p>

      <H2>5. Prohibited conduct</H2>
      <p>You must comply with our Community Guidelines and Acceptable Use Policy. Prohibited conduct includes harassment, threats, stalking, hate-based abuse, impersonation, scams, fraud, non-consensual intimate imagery, sexual exploitation, prostitution or sexual-service solicitation, trafficking, child sexual exploitation, doxxing, illegal activity and attempts to evade moderation or compromise the service.</p>

      <H2>6. Safety and moderation</H2>
      <p>We use reporting, blocking, moderation and other proportionate measures to reduce illegal and harmful activity. We may remove content, limit functionality, suspend or terminate an account where we reasonably believe this is necessary to enforce these Terms, protect users, prevent fraud or comply with law. Where required by applicable law, we may preserve or disclose information to competent authorities.</p>

      <H2>7. Reporting and complaints</H2>
      <p>You can report profiles, photographs and messages through the service. You can also contact {SUPPORT_EMAIL}. We will review reports using procedures appropriate to their seriousness and may take action without disclosing confidential information about another user.</p>

      <H2>8. Paid services</H2>
      <p>Paid plans and their prices, billing intervals and renewal terms are shown before purchase. Pro is billed every 14 days where offered as a recurring plan. Other recurring plans renew at the interval shown at checkout. Lifetime is a one-off purchase and does not automatically renew.</p>
      <p>Recurring subscriptions continue until cancelled. Cancellation stops future renewal but, unless applicable law requires otherwise, does not automatically refund the unused part of a current billing period. Nothing in these Terms limits statutory consumer rights.</p>

      <H2>9. Digital services and consumer rights</H2>
      <p>Where UK consumer law applies, you retain all mandatory rights relating to digital services, digital content, cancellation, refunds and services supplied with reasonable care and skill. Nothing in these Terms excludes or restricts liability or rights that cannot lawfully be excluded or restricted.</p>

      <H2>10. Availability and changes</H2>
      <p>We may update, suspend or discontinue features where reasonably necessary for security, legal compliance, maintenance or development. We will not use this clause to remove statutory rights.</p>

      <H2>11. Liability</H2>
      <p>To the extent permitted by law, we are not responsible for the independent conduct of users or for events occurring outside our reasonable control. We do not exclude liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot legally be excluded.</p>

      <H2>12. Governing law and contact</H2>
      <p>These Terms are intended to operate under the laws applicable to the service and the user, including mandatory consumer protections. Nothing here deprives a consumer of protections that cannot lawfully be excluded.</p>
      <p>Legal and support enquiries: {SUPPORT_EMAIL}.</p>
    </DocLayout>
  )
}

export function Privacy() {
  return (
    <DocLayout title="Privacy Policy">
      <Updated />
      <p>This Privacy Policy explains how U, ME, NOW. collects, uses, stores and protects personal data when providing the service in Jakarta, Indonesia. It is intended to address the requirements applicable to our UK business and Indonesian users, including the UK GDPR where applicable and Indonesia's Personal Data Protection Law (Law No. 27 of 2022).</p>

      <H2>1. Data we process</H2>
      <p>Depending on how you use the service, this may include account email, display name, date of birth, age, city, broad area, profile text, intentions, photographs, likes, matches, messages, reports, moderation records, device and security information, and payment/subscription information.</p>
      <p>Some information used in dating profiles can reveal or allow us to infer sensitive characteristics, including sexual orientation or information concerning sex life. We only process sensitive data where we have an appropriate legal basis and any additional condition required by applicable data-protection law.</p>

      <H2>2. How we use data</H2>
      <p>We use personal data to create and maintain accounts, provide discovery and matching, facilitate communication, process payments, prevent fraud and abuse, moderate content, secure the service, respond to reports, comply with legal obligations, and provide support.</p>

      <H2>3. Legal bases</H2>
      <p>Depending on the processing and applicable law, our legal bases may include performance of a contract, compliance with a legal obligation, legitimate interests balanced against your rights, and valid consent. Where consent is required, we obtain it in a clear and recorded manner and do not treat unnecessary consent as a condition of using core services.</p>

      <H2>4. What other users can see</H2>
      <p>Other users may see the profile information you choose to make discoverable, such as your display name, age, city, bio, intentions, photographs and relevant activity information. Your date of birth, exact location, coordinates, address and private broad-area data are not displayed to other users.</p>

      <H2>5. Location</H2>
      <p>The launch service does not use device GPS for discovery. Broad-area information is used only for relevant nearby functionality and is not displayed as an exact location.</p>

      <H2>6. Messages, reports and safety data</H2>
      <p>Messages and reports may be processed for service delivery, moderation, fraud prevention, safety and legal compliance. We may preserve or disclose relevant information where required by law or where legally permitted and necessary to protect users or other people.</p>

      <H2>7. Children</H2>
      <p>U, ME, NOW. is strictly 18+. We do not knowingly permit children to create accounts or use the service. If we discover an account belonging to a person under 18, we will restrict or remove the account and handle associated personal data in accordance with applicable law.</p>

      <H2>8. Sharing</H2>
      <p>We may share data with service providers acting on our instructions, such as hosting, authentication, storage, email, payments, security and support providers. We may also disclose information to professional advisers, regulators, courts or law-enforcement authorities where legally required or permitted.</p>

      <H2>9. International processing</H2>
      <p>Our infrastructure and service providers may process data outside Indonesia or the United Kingdom. We use appropriate contractual, technical or other safeguards required by applicable law for restricted international transfers. The actual locations and providers used by the production service should be kept current in our internal processing records and vendor register.</p>

      <H2>10. Retention</H2>
      <p>We retain personal data only for as long as reasonably necessary for the purposes described here, including legal, accounting, security, fraud-prevention and dispute-resolution requirements. Deleted accounts are removed or anonymised through our account-deletion process, subject to data that must be retained by law or for legitimate safety/legal purposes.</p>

      <H2>11. Your rights</H2>
      <p>Depending on applicable law, you may have rights to access, correct, update, delete, restrict or object to processing, withdraw consent, and receive a copy of certain personal data. Indonesian law also provides specific rights concerning personal-data processing. Contact {SUPPORT_EMAIL} to exercise a right or ask a privacy question.</p>

      <H2>12. Security and incidents</H2>
      <p>We use access controls, row-level database security, private photo storage and other technical and organisational safeguards appropriate to the service. If a personal-data breach occurs, we will assess and notify affected parties and authorities within the timeframes required by applicable law.</p>

      <H2>13. Complaints</H2>
      <p>If you are in the UK, you may complain to the Information Commissioner's Office where UK data-protection law applies. Users in Indonesia may also use the complaint and dispute mechanisms available under Indonesian law.</p>

      <H2>14. Contact</H2>
      <p>Privacy enquiries and data-rights requests: {SUPPORT_EMAIL}.</p>
    </DocLayout>
  )
}

export function Guidelines() {
  return (
    <DocLayout title="Community Guidelines">
      <Updated />
      <p>U, ME, NOW. is an adults-only dating service. These Guidelines set the minimum standards for profiles, photographs, messages and behaviour.</p>

      <H2>Be genuine</H2>
      <p>Use your own identity and recent photographs. Do not impersonate another person, create deceptive profiles or misrepresent material facts to obtain money, access or trust.</p>

      <H2>Respect boundaries</H2>
      <p>A match or message is not consent to continued contact, a date, physical contact, sexual activity or anything else. Respect a person's decision to stop communicating.</p>

      <H2>No harassment or abuse</H2>
      <p>No stalking, threats, intimidation, bullying, coercive control, repeated unwanted contact or abusive behaviour.</p>

      <H2>No hate or discrimination</H2>
      <p>Do not target people with abusive or threatening content based on protected characteristics or other personal attributes.</p>

      <H2>No sexual exploitation</H2>
      <p>No prostitution or sexual-service solicitation, trafficking, sexual exploitation, coercive sexual behaviour, or content involving the sexual exploitation of minors.</p>

      <H2>No intimate-image abuse</H2>
      <p>Do not share, threaten to share, request for abusive purposes, or distribute intimate images without the person's consent. Do not use sexual images to blackmail, extort or intimidate another person.</p>

      <H2>No scams or financial manipulation</H2>
      <p>Do not use romantic or emotional relationships to obtain money, cryptocurrency, loans, gifts, investments, financial credentials or other benefits through deception or manipulation.</p>

      <H2>Protect privacy</H2>
      <p>Do not publish or distribute another person's private information, including addresses, phone numbers, financial details or private correspondence, without a lawful basis or permission.</p>

      <H2>Adults only</H2>
      <p>Every user must be 18 or older. If you believe an account belongs to a minor, report it immediately and do not attempt to contact or investigate the person yourself.</p>

      <H2>Enforcement</H2>
      <p>We may remove content, limit functionality, suspend or permanently ban accounts. Serious or potentially criminal conduct may be referred to competent authorities where required or legally permitted.</p>
    </DocLayout>
  )
}

export function AcceptableUse() {
  return (
    <DocLayout title="Acceptable Use Policy">
      <Updated />
      <p>This Policy forms part of the Terms of Service and applies to every use of U, ME, NOW.</p>
      <H2>Prohibited uses</H2>
      <p>You must not use the service to commit, facilitate or encourage illegal activity; fraud; scams; impersonation; harassment; stalking; threats; hate-based abuse; sexual exploitation; prostitution solicitation; trafficking; non-consensual intimate imagery; child sexual exploitation or abuse; doxxing; extortion; money laundering; account takeover; malicious automation; scraping that circumvents technical controls; or attempts to interfere with service security.</p>
      <H2>Content restrictions</H2>
      <p>Do not upload pornography, explicit sexual material, nudity, exploitative sexual content, or material that depicts or sexualises minors. Do not use the service to arrange paid sexual services or transactions between users.</p>
      <H2>Enforcement</H2>
      <p>We may remove content and take proportionate account action. We may preserve relevant records and cooperate with lawful requests from authorities. We may act immediately where there is a serious safety risk.</p>
      <H2>Reporting</H2>
      <p>Report suspected violations in-app or contact {SUPPORT_EMAIL}. False or deliberately abusive reports may themselves breach this Policy.</p>
    </DocLayout>
  )
}

export function Reporting() {
  return (
    <DocLayout title="Reporting & Complaints">
      <Updated />
      <p>U, ME, NOW. provides in-app reporting for profiles, photographs and messages. Reports are reviewed using procedures proportionate to the seriousness and urgency of the issue.</p>
      <H2>How to report</H2>
      <p>Use the report function on the relevant profile, photo or message. Include enough information for us to identify the issue. For urgent safety concerns, contact {SUPPORT_EMAIL} as well.</p>
      <H2>What happens next</H2>
      <p>We assess the report, may restrict content or accounts while investigating, and may take action including removal, warnings, temporary suspension or permanent removal. We may refer matters to law enforcement where required or legally permitted.</p>
      <H2>Complaints about our decisions</H2>
      <p>If you believe we have made an error in moderation, contact {SUPPORT_EMAIL} with the relevant account information and reason for your complaint. We will review the decision where appropriate.</p>
      <H2>Emergency situations</H2>
      <p>If you are in immediate danger, contact local emergency services first. Do not rely on U, ME, NOW. as an emergency-response service.</p>
    </DocLayout>
  )
}

export function LawEnforcement() {
  return (
    <DocLayout title="Law Enforcement & Legal Requests">
      <Updated />
      <p>U, ME, NOW. cooperates with valid legal requests from competent authorities, subject to applicable law and data-protection requirements.</p>
      <H2>Requests</H2>
      <p>Requests should identify the requesting authority, legal basis, relevant account or identifier, information sought and any applicable deadline. We may require requests to be authenticated through an appropriate official channel.</p>
      <H2>Disclosure</H2>
      <p>We may disclose information where required by law, valid judicial or regulatory process, or where legally permitted and necessary to address an emergency involving an imminent risk of serious harm.</p>
      <H2>Minimisation</H2>
      <p>Where lawful and practicable, we assess requests for validity and scope and seek to limit disclosure to information reasonably required for the stated legal purpose.</p>
      <H2>Child safety</H2>
      <p>We treat suspected child sexual exploitation and abuse as a critical safety matter. Where a reporting duty applies, we report detected and unreported CSEA content through the applicable reporting channel and preserve information as required by law.</p>
      <H2>Contact</H2>
      <p>Law-enforcement and legal requests: {SUPPORT_EMAIL}. Emergency requests should clearly identify the immediate risk and the information required to address it.</p>
    </DocLayout>
  )
}

export function Refunds() {
  return (
    <DocLayout title="Payments, Cancellation & Refunds">
      <Updated />
      <p>Paid U-ME-NOW+ plans are optional. Prices, billing periods and renewal terms are shown before purchase.</p>
      <H2>Recurring plans</H2>
      <p>Pro renews every 14 days at the price shown at checkout. Other recurring plans renew at the interval and price shown at checkout. You can cancel recurring plans through the available billing-management tools or by contacting support.</p>
      <H2>Lifetime</H2>
      <p>Lifetime is a one-off purchase and does not automatically renew. “Lifetime” means the duration for which the applicable U-ME-NOW+ service is offered and supported; it is not a guarantee that the service will operate indefinitely.</p>
      <H2>Cancellation</H2>
      <p>Cancellation normally stops future renewals while allowing access through the current paid period where the plan provides that entitlement. Statutory cancellation and refund rights are not affected.</p>
      <H2>Cooling-off and digital services</H2>
      <p>Where a statutory cooling-off right applies, we will provide the information and cancellation mechanism required by law. If you expressly request immediate supply of digital content or services during a cancellation period, the consequences required by applicable law may apply.</p>
      <H2>Refunds</H2>
      <p>Nothing in this Policy excludes mandatory refunds or remedies. If you believe you are entitled to a refund, contact {SUPPORT_EMAIL} with your account email, purchase date and reason.</p>
    </DocLayout>
  )
}

export function Contact() {
  return (
    <DocLayout title="Contact">
      <Updated />
      <p>U, ME, NOW. provides support for safety concerns, account issues, privacy requests, complaints and payment questions.</p>
      <H2>Support</H2>
      <p>
        Email us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal underline" data-testid="contact-email">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <H2>Urgent safety</H2>
      <p>If you are in immediate danger, contact local emergency services first. Then report the relevant user in the app and contact us if appropriate.</p>
      <H2>Legal operator information</H2>
      <p>The legal business name, registered office and any applicable local representative details must be kept current here before public launch and in the service's formal business records.</p>
    </DocLayout>
  )
}
