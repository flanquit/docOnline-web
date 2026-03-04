import './App.css';

const stats = [
  { label: 'Active Patients', value: '28,400+' },
  { label: 'Verified Pharmacies', value: '1,160' },
  { label: 'Avg. Response Time', value: '6 min' },
  { label: 'Medication Adherence', value: '92%' },
];

const services = [
  {
    title: 'Virtual Doctor Consultations',
    copy: 'Book video or chat consultations with licensed clinicians, share files, and get digital prescriptions in minutes.',
  },
  {
    title: 'Smart Pharmacy Match',
    copy: 'We use your location to surface the closest open pharmacies, their inventory highlights, and pickup options.',
  },
  {
    title: 'Refill & Follow-up Alerts',
    copy: 'Automated reminders for ARV, diabetic, hypertension, and chronic care patients before refill dates.',
  },
  {
    title: 'Caregiver & Family Access',
    copy: 'Invite a trusted caregiver to receive updates, reminders, and pharmacy pickup instructions.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create a health profile',
    copy: 'Add medical history, allergies, ongoing medication, and your preferred pharmacy.',
  },
  {
    step: '02',
    title: 'Start a consultation',
    copy: 'Pick on-demand or scheduled slots, upload notes, and see a doctor instantly.',
  },
  {
    step: '03',
    title: 'Receive prescriptions',
    copy: 'We send digital prescriptions and notify your nearest pharmacy for quick pickup.',
  },
  {
    step: '04',
    title: 'Stay on track',
    copy: 'Receive refill alerts and follow-up check-ins weeks or days before due dates.',
  },
];

const pharmacies = [
  {
    name: 'GreenLife Pharmacy',
    distance: '0.8 km',
    hours: 'Open · Closes 9:30 PM',
    tags: ['24/7 hotline', 'ARV stocked', 'Pickup in 15 min'],
  },
  {
    name: 'MetroCare Pharmacy',
    distance: '1.4 km',
    hours: 'Open · Closes 10:00 PM',
    tags: ['Diabetic care', 'Delivery available', 'Insurance accepted'],
  },
  {
    name: 'WellSpring Pharmacy',
    distance: '2.1 km',
    hours: 'Open · Closes 8:00 PM',
    tags: ['Family care', 'Vaccination', 'Chronic meds'],
  },
];

const alerts = [
  {
    title: 'ARV Refill',
    copy: 'Next pickup due in 12 days. We will notify your pharmacy and caregiver.',
    date: 'Apr 15',
  },
  {
    title: 'Diabetes Follow-up',
    copy: 'Schedule your check-in with the diabetic nurse within 7 days.',
    date: 'Apr 22',
  },
  {
    title: 'Blood Pressure Review',
    copy: 'Reminder sent to measure BP and submit readings this week.',
    date: 'Apr 27',
  },
];

const testimonials = [
  {
    name: 'Tariro M.',
    role: 'ARV Patient',
    quote: 'The refill reminders are a lifesaver. My pharmacy already has my meds ready when I arrive.',
  },
  {
    name: 'Dr. K. Ndlovu',
    role: 'Family Physician',
    quote: 'The consultation workflow is clean and the pharmacy integration saves us hours every week.',
  },
  {
    name: 'Simba R.',
    role: 'Caregiver',
    quote: 'I receive timely alerts for my father’s refills and I can coordinate pickups without stress.',
  },
];

const faqs = [
  {
    q: 'Is the consultation private and secure?',
    a: 'Yes. All consultations are end-to-end encrypted and follow healthcare data protection standards.',
  },
  {
    q: 'Can I choose a specific pharmacy?',
    a: 'Absolutely. You can set a preferred pharmacy or pick from the nearest available options every time.',
  },
  {
    q: 'How far in advance do alerts go out?',
    a: 'Alerts are configurable. By default, you receive reminders 14 days and 3 days before refill dates.',
  },
];

export default function App() {
  return (
    <div className="app">
      <header className="hero">
        <nav className="nav">
          <div className="logo">Doc Online</div>
          <div className="nav-links">
            <button className="ghost">Platform</button>
            <button className="ghost">Pharmacies</button>
            <button className="ghost">Alerts</button>
            <button className="ghost">Contact</button>
          </div>
          <div className="nav-actions">
            <button className="ghost">Sign in</button>
            <button className="primary">Get started</button>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-text">
            <p className="eyebrow">Digital healthcare, designed for real life</p>
            <h1>
              Consult doctors online, connect to the closest pharmacy, and never miss a refill.
            </h1>
            <p className="subtext">
              Doc Online links patients, clinicians, and pharmacies in a single care journey. From virtual
              consultations to automated ARV and diabetic refill alerts, you stay supported every step.
            </p>
            <div className="hero-actions">
              <button className="primary">Book a consultation</button>
              <button className="secondary">View care plans</button>
            </div>
            <div className="hero-badges">
              <span>Licensed clinicians</span>
              <span>Smart refill alerts</span>
              <span>Nearest pharmacy matching</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <div>
                <h3>Today’s Care Dashboard</h3>
                <p>Harare, Zimbabwe · Updated 3 mins ago</p>
              </div>
              <span className="pill">Live</span>
            </div>
            <div className="hero-card-grid">
              {stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <h4>{stat.value}</h4>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="hero-card-footer">
              <div>
                <p className="label">Next appointment</p>
                <h4>Video consult · 2:30 PM</h4>
              </div>
              <button className="secondary small">Join now</button>
            </div>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">What the platform delivers</p>
            <h2>One system for consultations, prescriptions, and pharmacy care.</h2>
          </div>
          <button className="secondary">Explore features</button>
        </div>
        <div className="grid">
          {services.map((service) => (
            <div className="card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
              <button className="text-button">Learn more</button>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="section-header">
          <div>
            <p className="eyebrow">Consultation flow</p>
            <h2>Designed for speed, clarity, and ongoing care.</h2>
          </div>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <div className="step" key={step.step}>
              <span>{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Pharmacy proximity</p>
            <h2>Find the closest pharmacy with the right stock.</h2>
          </div>
          <button className="secondary">See all pharmacies</button>
        </div>
        <div className="pharmacy-layout">
          <div className="map-card">
            <div className="map">
              <div className="map-dot"></div>
              <div className="map-ring"></div>
              <p>Interactive map preview</p>
            </div>
            <div className="map-info">
              <h3>Location smart match</h3>
              <p>
                We surface the nearest open pharmacies and highlight ARV, diabetic, and chronic medication
                availability in real time.
              </p>
              <div className="map-actions">
                <button className="primary small">Share location</button>
                <button className="ghost small">Set default area</button>
              </div>
            </div>
          </div>
          <div className="pharmacy-list">
            {pharmacies.map((pharmacy) => (
              <div className="card" key={pharmacy.name}>
                <div className="pharmacy-head">
                  <div>
                    <h3>{pharmacy.name}</h3>
                    <p>{pharmacy.hours}</p>
                  </div>
                  <span className="pill">{pharmacy.distance}</span>
                </div>
                <div className="tags">
                  {pharmacy.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <button className="text-button">Reserve pickup</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="section-header">
          <div>
            <p className="eyebrow">Medication adherence</p>
            <h2>Alerts that keep chronic care on track.</h2>
          </div>
          <button className="secondary">Configure reminders</button>
        </div>
        <div className="alert-grid">
          <div className="alert-card">
            <h3>Upcoming alerts</h3>
            <p>Plan for ARV, diabetic, hypertension, and maternal care follow-ups.</p>
            <div className="alert-list">
              {alerts.map((alert) => (
                <div className="alert-item" key={alert.title}>
                  <div>
                    <h4>{alert.title}</h4>
                    <p>{alert.copy}</p>
                  </div>
                  <span>{alert.date}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="alert-card highlight">
            <h3>Care plan automation</h3>
            <ul>
              <li>Automatic reminders 14 and 3 days before refill dates.</li>
              <li>Pharmacy pre-notifications to prepare medicine packs.</li>
              <li>Follow-up checklists for ARV adherence and diabetic monitoring.</li>
              <li>Caregiver notifications when critical refills are due.</li>
            </ul>
            <button className="primary">Enable my plan</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Community trust</p>
            <h2>Built for patients, doctors, and caregivers.</h2>
          </div>
        </div>
        <div className="grid three">
          {testimonials.map((item) => (
            <div className="card" key={item.name}>
              <p className="quote">“{item.quote}”</p>
              <div className="author">
                <h4>{item.name}</h4>
                <span>{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="section-header">
          <div>
            <p className="eyebrow">FAQs</p>
            <h2>Everything you need before getting started.</h2>
          </div>
          <button className="secondary">Talk to us</button>
        </div>
        <div className="faq-grid">
          {faqs.map((faq) => (
            <div className="card" key={faq.q}>
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Ready to bring Doc Online to your community?</h2>
          <p>
            Launch a modern virtual care and pharmacy-refill system. Start with the web app and integrate
            your Laravel API when ready.
          </p>
        </div>
        <div className="cta-actions">
          <button className="primary">Request a demo</button>
          <button className="ghost">Download project brief</button>
        </div>
      </section>

      <footer className="footer">
        <div>
          <h3>Doc Online</h3>
          <p>Connected care for consultations, pharmacy access, and adherence reminders.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Platform</h4>
            <button className="ghost">Consultations</button>
            <button className="ghost">Pharmacy network</button>
            <button className="ghost">Refill alerts</button>
          </div>
          <div>
            <h4>Support</h4>
            <button className="ghost">Help center</button>
            <button className="ghost">Security</button>
            <button className="ghost">Contact</button>
          </div>
          <div>
            <h4>Social</h4>
            <button className="ghost">LinkedIn</button>
            <button className="ghost">Instagram</button>
            <button className="ghost">Twitter</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
