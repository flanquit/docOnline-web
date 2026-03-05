import { useEffect, useMemo, useState } from 'react';
import './App.css';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'chat', label: 'Live Chat' },
  { id: 'pharmacies', label: 'Pharmacies' },
  { id: 'checkout', label: 'Pharmacy Checkout' },
  { id: 'alerts', label: 'Refill Alerts' },
  { id: 'support', label: 'Support' },
];

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

const consultations = [
  {
    id: 'c1',
    name: 'Dr. L. Chipo',
    specialty: 'Family Medicine',
    time: 'Today · 2:30 PM',
    mode: 'Video call',
  },
  {
    id: 'c2',
    name: 'Dr. T. Moyo',
    specialty: 'Diabetic Care',
    time: 'Tomorrow · 9:00 AM',
    mode: 'Chat',
  },
  {
    id: 'c3',
    name: 'Nurse K. Ncube',
    specialty: 'ARV Adherence',
    time: 'Fri · 4:00 PM',
    mode: 'Video call',
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

const initialChat = [
  { from: 'Dr. Chipo', time: '2:02 PM', text: 'Hello Tariro, how are you feeling today?' },
  { from: 'You', time: '2:03 PM', text: 'I am feeling better. My BP is slightly high though.' },
  { from: 'Dr. Chipo', time: '2:04 PM', text: 'Thanks for sharing. Please upload your BP readings.' },
];

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState([
    { label: 'Welcome back! Your next consultation is at 2:30 PM.', time: 'Just now' },
  ]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [chatMessages, setChatMessages] = useState(initialChat);
  const [chatInput, setChatInput] = useState('');
  const [checkoutSubmitted, setCheckoutSubmitted] = useState(false);
  const [docSubmitted, setDocSubmitted] = useState(false);

  const logAction = (label) => {
    setActivity((prev) => [{ label, time: 'Just now' }, ...prev].slice(0, 5));
  };

  const activeLabel = useMemo(
    () => menuItems.find((item) => item.id === activeView)?.label ?? 'Dashboard',
    [activeView]
  );

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { from: 'You', time, text: chatInput.trim() }]);
    setChatInput('');
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, [isAuthed, activeView, authView]);

  const loader = isLoading ? (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="loader-card">
        <div className="loader-orbit" />
        <div className="loader-mark">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
        <div className="loader-text">
          <p className="eyebrow">Doc Online</p>
          <h2>Preparing your care space</h2>
          <p className="muted">Syncing consultations, pharmacy, and support channels.</p>
        </div>
      </div>
    </div>
  ) : null;

  if (!isAuthed) {
    return (
      <>
        {loader}
        <div className="landing">
          <div className="landing-bg" aria-hidden="true">
          <span className="bg-orb orb-1" />
          <span className="bg-orb orb-2" />
          <span className="bg-orb orb-3" />
          <span className="bg-orb orb-4" />
          <span className="bg-orb orb-5" />
          <span className="bg-trace trace-1" />
          <span className="bg-trace trace-2" />
          <span className="bg-trace trace-3" />
          <svg className="bg-icon icon-1" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20s-6.5-4.2-8.5-7.6C1.7 9.7 3.2 6.8 6.2 6.2c2-.4 3.6.6 4.8 2 1.2-1.4 2.8-2.4 4.8-2 3 .6 4.5 3.5 2.7 6.2C18.5 15.8 12 20 12 20Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="bg-icon icon-2" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h4l2.5-5 4 10 2.5-5H21"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="bg-icon icon-3" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3l7 3v5c0 5-3.5 8.2-7 10-3.5-1.8-7-5-7-10V6l7-3Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          </div>
          <header className="landing-nav">
          <div className="logo">Doc Online</div>
          <div className="landing-actions">
            <button className="ghost" onClick={() => setAuthView('login')}>
              Log in
            </button>
            <button className="primary" onClick={() => setAuthView('register')}>
              Create account
            </button>
          </div>
        </header>
        <main className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow">Welcome to connected care</p>
            <h1>Healthcare that feels human, organized, and always within reach.</h1>
            <p className="subtext">
              Doc Online keeps patients, doctors, and pharmacies aligned with real-time consultations, trusted refill
              alerts, and seamless pickup coordination.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => setAuthView('register')}>
                Get started
              </button>
              <button className="secondary" onClick={() => setAuthView('login')}>
                Sign in
              </button>
            </div>
            <div className="hero-badges">
              <span>Licensed clinicians</span>
              <span>Pharmacy network coverage</span>
              <span>Automated refill reminders</span>
            </div>
          </div>
          <div className="landing-card">
            <div className="landing-card-header">
              <div>
                <h3>{authView === 'login' ? 'Welcome back' : 'Create your account'}</h3>
                <p className="muted">
                  {authView === 'login'
                    ? 'Log in to access your care dashboard.'
                    : 'Register to start booking consultations.'}
                </p>
              </div>
              <div className="pill">{authView === 'login' ? 'Login' : 'Register'}</div>
            </div>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                setIsAuthed(true);
              }}
            >
              {authView === 'register' && (
                <label>
                  Full name
                  <input required placeholder="e.g. Tariro Moyo" />
                </label>
              )}
              <label>
                Email address
                <input type="email" required placeholder="you@email.com" />
              </label>
              <label>
                Password
                <input type="password" required placeholder="Minimum 8 characters" />
              </label>
              {authView === 'register' && (
                <label>
                  Phone number
                  <input required placeholder="+263 77 000 0000" />
                </label>
              )}
              <button className="primary" type="submit">
                {authView === 'login' ? 'Log in' : 'Create account'}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
              >
                {authView === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
              </button>
            </form>
          </div>
        </main>
        <section className="landing-highlights">
          <div className="card">
            <h3>Unified care timeline</h3>
            <p>Track consultations, medication refills, and follow-ups in one place.</p>
          </div>
          <div className="card">
            <h3>Pharmacy-ready prescriptions</h3>
            <p>Digital prescriptions route directly to nearby pharmacies for faster pickup.</p>
          </div>
          <div className="card">
            <h3>Caregiver-ready alerts</h3>
            <p>Loop in family or caregivers with consented reminders and updates.</p>
          </div>
        </section>
        </div>
      </>
    );
  }

  return (
    <>
      {loader}
      <div className="app-shell">
        <aside className="sidebar">
        <div className="logo">Doc Online</div>
        <div className="profile-card">
          <p className="eyebrow">Patient</p>
          <h3>Tariro M.</h3>
          <p>Harare, Zimbabwe</p>
          <span className="status-chip">Care plan active</span>
        </div>
        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-btn ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="ghost">Settings</button>
          <button className="ghost" onClick={() => setIsAuthed(false)}>
            Log out
          </button>
          <button className="primary" onClick={() => setIsBookingOpen(true)}>
            New Consultation
          </button>
        </div>
        </aside>

        <main className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live system status</p>
            <h2>{activeView === 'dashboard' ? 'Care Dashboard' : activeLabel}</h2>
          </div>
          <div className="topbar-actions">
            <button className="ghost" onClick={() => logAction('Location refreshed for nearby pharmacies.')}>
              Refresh location
            </button>
            <button className="secondary" onClick={() => logAction('New message sent to your care team.')}>
              Message care team
            </button>
          </div>
        </header>

        <div className="main-grid">
          <section className="main-content">
            {activeView === 'dashboard' && (
              <>
                <section className="hero">
                  <div className="hero-text">
                    <p className="eyebrow">Digital healthcare, designed for real life</p>
                    <h1>Consult doctors online, connect to the closest pharmacy, and never miss a refill.</h1>
                    <p className="subtext">
                      Doc Online links patients, clinicians, and pharmacies in a single care journey. From virtual
                      consultations to automated ARV and diabetic refill alerts, you stay supported every step.
                    </p>
                    <div className="hero-actions">
                      <button className="primary" onClick={() => setIsBookingOpen(true)}>
                        Book a consultation
                      </button>
                      <button className="secondary" onClick={() => logAction('Care plan summary opened.')}>
                        View care plans
                      </button>
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
                        <p>Updated 3 mins ago</p>
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
                      <button className="secondary small" onClick={() => logAction('Joining video consultation...')}>
                        Join now
                      </button>
                    </div>
                  </div>
                </section>

                <section className="section">
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">What the platform delivers</p>
                      <h2>One system for consultations, prescriptions, and pharmacy care.</h2>
                    </div>
                    <button className="secondary" onClick={() => logAction('Feature overview opened.')}>
                      Explore features
                    </button>
                  </div>
                  <div className="grid">
                    {services.map((service) => (
                      <div className="card" key={service.title}>
                        <h3>{service.title}</h3>
                        <p>{service.copy}</p>
                        <button
                          className="text-button"
                          onClick={() => logAction(`${service.title} details opened.`)}
                        >
                          Learn more
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeView === 'consultations' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Consultations</p>
                    <h2>Upcoming appointments</h2>
                  </div>
                  <button className="primary" onClick={() => setIsBookingOpen(true)}>
                    Schedule new
                  </button>
                </div>
                <div className="grid">
                  {consultations.map((consultation) => (
                    <div className="card" key={consultation.id}>
                      <h3>{consultation.name}</h3>
                      <p>{consultation.specialty}</p>
                      <div className="pill-row">
                        <span className="pill">{consultation.time}</span>
                        <span className="pill">{consultation.mode}</span>
                      </div>
                      <button
                        className="primary"
                        onClick={() => logAction(`Joining ${consultation.mode} with ${consultation.name}.`)}
                      >
                        Join session
                      </button>
                    </div>
                  ))}
                </div>

                <div className="form-card">
                  <h3>Doctor consultation form</h3>
                  <p className="muted">Fill in symptoms and attach recent readings before the session.</p>
                  <form
                    className="form-grid"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setDocSubmitted(true);
                      logAction('Consultation form submitted to doctor.');
                    }}
                  >
                    <label>
                      Symptoms summary
                      <textarea required placeholder="Describe symptoms, duration, and triggers." rows={4} />
                    </label>
                    <label>
                      Upload BP / sugar readings
                      <input type="file" />
                    </label>
                    <label>
                      Preferred consultation mode
                      <select required>
                        <option value="">Select mode</option>
                        <option>Video call</option>
                        <option>Chat</option>
                        <option>Phone call</option>
                      </select>
                    </label>
                    <button className="primary" type="submit">
                      Submit to doctor
                    </button>
                    {docSubmitted && <p className="success">Submitted! The doctor will review before your session.</p>}
                  </form>
                </div>
              </section>
            )}

            {activeView === 'chat' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Live chat</p>
                    <h2>Chat with your care team</h2>
                  </div>
                  <button className="secondary" onClick={() => logAction('Chat transcript saved.')}>
                    Save transcript
                  </button>
                </div>
                <div className="chat-window">
                  <div className="chat-header">
                    <div>
                      <h3>Dr. L. Chipo</h3>
                      <p>Family Medicine · Online now</p>
                    </div>
                    <button className="ghost" onClick={() => logAction('Video call requested from chat.')}>
                      Request video call
                    </button>
                  </div>
                  <div className="chat-messages">
                    {chatMessages.map((message, index) => (
                      <div
                        key={`${message.text}-${index}`}
                        className={`chat-bubble ${message.from === 'You' ? 'sent' : 'received'}`}
                      >
                        <p>{message.text}</p>
                        <span>{message.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chat-input">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleChatSend();
                        }
                      }}
                    />
                    <button className="primary" onClick={handleChatSend}>
                      Send
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeView === 'pharmacies' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Pharmacy proximity</p>
                    <h2>Find the closest pharmacy with the right stock.</h2>
                  </div>
                  <button className="secondary" onClick={() => logAction('Pharmacy map refreshed.')}>
                    See map
                  </button>
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
                        <button
                          className="primary small"
                          onClick={() => logAction('Location shared with pharmacy network.')}
                        >
                          Share location
                        </button>
                        <button className="ghost small" onClick={() => logAction('Default area saved.')}>
                          Set default area
                        </button>
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
                        <button
                          className="text-button"
                          onClick={() => logAction(`Pickup reserved at ${pharmacy.name}.`)}
                        >
                          Reserve pickup
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeView === 'checkout' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Pharmacy checkout</p>
                    <h2>Reserve your medication pickup</h2>
                  </div>
                  <button className="secondary" onClick={() => logAction('Checkout summary downloaded.')}>
                    Download summary
                  </button>
                </div>
                <div className="checkout-layout">
                  <form
                    className="form-card"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setCheckoutSubmitted(true);
                      logAction('Checkout submitted to pharmacy.');
                    }}
                  >
                    <h3>Pickup details</h3>
                    <label>
                      Select pharmacy
                      <select required>
                        <option value="">Choose pharmacy</option>
                        {pharmacies.map((pharmacy) => (
                          <option key={pharmacy.name}>{pharmacy.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Prescription ID
                      <input required placeholder="RX-2045-ARV" />
                    </label>
                    <label>
                      Pickup date
                      <input type="date" required />
                    </label>
                    <label>
                      Delivery option
                      <select required>
                        <option value="">Select option</option>
                        <option>Pick up at pharmacy</option>
                        <option>Home delivery</option>
                        <option>Caregiver pickup</option>
                      </select>
                    </label>
                    <label>
                      Notes for pharmacist
                      <textarea rows={3} placeholder="Any allergies or timing notes?" />
                    </label>
                    <button className="primary" type="submit">
                      Confirm pickup
                    </button>
                    {checkoutSubmitted && (
                      <p className="success">Success! Your pharmacy has been notified and will confirm shortly.</p>
                    )}
                  </form>
                  <div className="summary-card">
                    <h3>Order summary</h3>
                    <div className="summary-row">
                      <span>ARV Refill Pack</span>
                      <strong>$0.00</strong>
                    </div>
                    <div className="summary-row">
                      <span>Diabetic strips</span>
                      <strong>$8.50</strong>
                    </div>
                    <div className="summary-row">
                      <span>Delivery</span>
                      <strong>$2.00</strong>
                    </div>
                    <div className="summary-row total">
                      <span>Total</span>
                      <strong>$10.50</strong>
                    </div>
                    <p className="muted">Insurance coverage applied. Pay at pickup or via mobile money.</p>
                  </div>
                </div>
              </section>
            )}

            {activeView === 'alerts' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Medication adherence</p>
                    <h2>Alerts that keep chronic care on track.</h2>
                  </div>
                  <button className="secondary" onClick={() => logAction('Reminder schedule updated.')}>
                    Configure reminders
                  </button>
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
                          <button className="ghost" onClick={() => logAction(`${alert.title} reminder sent.`)}>
                            Send now
                          </button>
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
                    <button className="primary" onClick={() => logAction('Care plan automation enabled.')}>
                      Enable my plan
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeView === 'support' && (
              <section className="section">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Support</p>
                    <h2>We are here for patients, doctors, and caregivers.</h2>
                  </div>
                  <button className="primary" onClick={() => logAction('Support request created.')}>
                    Open a ticket
                  </button>
                </div>
                <div className="grid">
                  {faqs.map((faq) => (
                    <div className="card" key={faq.q}>
                      <h3>{faq.q}</h3>
                      <p>{faq.a}</p>
                      <button className="text-button" onClick={() => logAction(`Help article opened: ${faq.q}`)}>
                        Read article
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>

          <aside className="side-panel">
            <div className="panel-card">
              <h3>Activity feed</h3>
              <p className="muted">Demo actions appear here.</p>
              <div className="activity-list">
                {activity.map((item, index) => (
                  <div className="activity-item" key={`${item.label}-${index}`}>
                    <p>{item.label}</p>
                    <span>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-card highlight">
              <h3>Next refill</h3>
              <p>ARV medication pack due in 12 days.</p>
              <button className="primary" onClick={() => logAction('Refill reminder sent to pharmacy.')}>
                Notify pharmacy
              </button>
            </div>
            <div className="panel-card">
              <h3>Quick actions</h3>
              <div className="quick-actions">
                <button className="secondary" onClick={() => logAction('Vitals submitted to care team.')}>
                  Submit vitals
                </button>
                <button className="secondary" onClick={() => logAction('Caregiver added to your plan.')}>
                  Add caregiver
                </button>
                <button className="secondary" onClick={() => logAction('Prescription uploaded.')}>
                  Upload prescription
                </button>
              </div>
            </div>
          </aside>
        </div>

        <footer className="footer">
          <div>
            <h3>Doc Online</h3>
            <p>Connected care for consultations, pharmacy access, and adherence reminders.</p>
            <p className="footer-credit">Developed by Farai Zuva</p>
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
      </main>

      {isBookingOpen && (
        <div className="modal-backdrop" onClick={() => setIsBookingOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Book a consultation</h3>
                <p className="muted">Fill out the form to request a slot.</p>
              </div>
              <button className="ghost" onClick={() => setIsBookingOpen(false)}>
                Close
              </button>
            </div>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                setBookingSubmitted(true);
                logAction('Consultation booking request sent.');
              }}
            >
              <label>
                Full name
                <input required placeholder="e.g. Tariro Moyo" />
              </label>
              <label>
                Reason for visit
                <input required placeholder="Follow-up, refill, new symptoms" />
              </label>
              <label>
                Preferred date
                <input type="date" required />
              </label>
              <label>
                Preferred time
                <input type="time" required />
              </label>
              <label>
                Consultation mode
                <select required>
                  <option value="">Select mode</option>
                  <option>Video call</option>
                  <option>Chat</option>
                  <option>Phone call</option>
                </select>
              </label>
              <label>
                Upload files (optional)
                <input type="file" />
              </label>
              <button className="primary" type="submit">
                Send request
              </button>
              {bookingSubmitted && (
                <p className="success">Thanks! We are confirming your slot and will send a notification.</p>
              )}
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
