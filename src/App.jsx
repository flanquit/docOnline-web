import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const roleAccounts = {
  patient: { label: 'Patient', email: 'patient@doconline.test', password: 'password' },
  doctor: { label: 'Doctor', email: 'doctor@doconline.test', password: 'password' },
  pharmacy: { label: 'Pharmacy', email: 'pharmacy@doconline.test', password: 'password' },
};

const navByRole = {
  patient: [
    { id: 'overview', label: 'Overview' },
    { id: 'assistant', label: 'CareGuide AI' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'pharmacies', label: 'Pharmacies' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'records', label: 'My Records' },
  ],
  doctor: [
    { id: 'overview', label: 'Overview' },
    { id: 'availability', label: 'Availability' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'records', label: 'Patient Records' },
  ],
  pharmacy: [
    { id: 'overview', label: 'Overview' },
    { id: 'location', label: 'Location' },
    { id: 'medicines', label: 'Medicine Queue' },
    { id: 'illnesses', label: 'Illness Summary' },
  ],
};

function initials(name = 'DO') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatShortDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString([], { dateStyle: 'medium' });
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">+</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SectionHeading({ kicker, title, text }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Bar({ label, value, tone = 'green' }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="chart-row">
      <div className="chart-label">
        <span>{label}</span>
        <strong>{width}%</strong>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast-card ${toast.type}`} key={toast.id}>
          <span className="toast-dot" />
          <div>
            <strong>{toast.title}</strong>
            {toast.text && <p>{toast.text}</p>}
          </div>
          <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>x</button>
        </div>
      ))}
    </div>
  );
}

function PageLoader({ active, message }) {
  if (!active) return null;

  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="loader-panel">
        <div className="loader-mark">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>{message}</strong>
          <p>Please wait while Doc Online completes the request.</p>
        </div>
      </div>
    </div>
  );
}

function CareGuideChat({
  compact = false,
  messages,
  input,
  typing,
  setInput,
  submitMessage,
  openBooking,
  onClose,
}) {
  return (
    <article className={compact ? 'assistant-panel compact' : 'assistant-panel'}>
      <div className="assistant-header">
        <div>
          <span className="eyebrow">CareGuide AI</span>
          <h2>Patient support assistant</h2>
          <p>Focused on doctor availability, your reminders, booking handoff, and care tips from your portal data.</p>
        </div>
        <div className="assistant-header-actions">
          <span className="assistant-status">Professional mode</span>
          {compact && <button className="chat-close-button" type="button" aria-label="Close CareGuide" onClick={onClose}>x</button>}
        </div>
      </div>

      <div className="assistant-messages" aria-live="polite">
        {messages.map((message) => (
          <div className={`chat-message ${message.author}`} key={message.id}>
            <div className="chat-bubble">
              <p>{message.text}</p>
              {!!message.actions?.length && (
                <div className="chat-actions">
                  {message.actions.map((action) => (
                    <button
                      className="secondary-button"
                      key={`${message.id}-${action.doctor.id}`}
                      type="button"
                      onClick={() => openBooking(action.doctor)}
                    >
                      Book {action.doctor.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="chat-message assistant">
            <div className="typing-bubble" aria-label="CareGuide is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="assistant-prompts">
        {[
          'Which doctors are available?',
          'Do I have reminders today?',
          'Give me a care tip from my stats',
        ].map((prompt) => (
          <button className="ghost-button" key={prompt} type="button" onClick={(event) => submitMessage(event, prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="assistant-composer" onSubmit={submitMessage}>
        <input
          aria-label="Message CareGuide"
          placeholder="Ask about doctors, reminders, bookings, or your care stats"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary-button" type="submit" disabled={typing}>Send</button>
      </form>
    </article>
  );
}

function CareGuideLauncher({
  open,
  setOpen,
  messages,
  input,
  typing,
  setInput,
  submitMessage,
  openBooking,
}) {
  return (
    <div className="careguide-live">
      {open && (
        <div className="careguide-popover">
          <CareGuideChat
            compact
            messages={messages}
            input={input}
            typing={typing}
            setInput={setInput}
            submitMessage={submitMessage}
            openBooking={openBooking}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
      <button
        className={`careguide-launcher ${open ? 'open' : ''}`}
        type="button"
        aria-label={open ? 'Close CareGuide AI chat' : 'Open CareGuide AI chat'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="launcher-icon">CG</span>
        <span className="launcher-pulse" />
      </button>
      {!open && (
        <div className="careguide-nudge">
          <strong>CareGuide AI</strong>
          <span>Ready to assist</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('doconline_token') ?? '');
  const [selectedRole, setSelectedRole] = useState(localStorage.getItem('doconline_role') ?? 'patient');
  const [authForm, setAuthForm] = useState(roleAccounts[selectedRole]);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toasts, setToasts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loaderMessage, setLoaderMessage] = useState('Contacting backend...');
  const [locationNotice, setLocationNotice] = useState('Use your current location to sort pharmacies by distance.');
  const [locationAddress, setLocationAddress] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: 'welcome',
      author: 'assistant',
      text: 'I am CareGuide. I can check doctor availability, summarize your reminders, and give care tips from your portal data.',
      actions: [],
    },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    doctor_id: '',
    scheduled_for: '',
    visit_type: 'video',
    reason: '',
    symptoms: '',
  });
  const [reminderForm, setReminderForm] = useState({
    medicine_name: '',
    dosage: '',
    doses_per_day: 1,
    quantity_total: 30,
    quantity_remaining: '',
    refill_at: '',
    remind_at: '',
  });
  const [pharmacyForm, setPharmacyForm] = useState({
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    hours: '',
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    is_available: true,
    available_from_date: '',
    available_to_date: '',
    available_start_time: '',
    available_end_time: '',
    availability_note: '',
  });
  const [registerForm, setRegisterForm] = useState({
    role: 'patient',
    name: '',
    email: '',
    password: '',
    specialty: '',
    phone: '',
    bio: '',
  });

  const role = portal?.role ?? user?.role ?? selectedRole;
  const navigation = navByRole[role] ?? navByRole.patient;
  const title = navigation.find((item) => item.id === activeView)?.label ?? 'Overview';

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type, title, text = '') => {
    const id = `${Date.now()}-${Math.random()}`;

    setToasts((items) => [{ id, type, title, text }, ...items].slice(0, 4));
    window.setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
    }, 4600);
  }, []);

  const startRequest = useCallback((message) => {
    setLoaderMessage(message);
    setPendingRequests((count) => count + 1);
  }, []);

  const finishRequest = useCallback(() => {
    setPendingRequests((count) => Math.max(0, count - 1));
  }, []);

  const apiFetch = useCallback(async (path, options = {}) => {
    const { requestLabel = 'Contacting backend...', ...fetchOptions } = options;

    startRequest(requestLabel);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(fetchOptions.headers ?? {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data.message ||
          Object.values(data.errors ?? {})
            .flat()
            .join(' ') ||
          'Request failed.';
        throw new Error(message);
      }

      return data;
    } finally {
      finishRequest();
    }
  }, [finishRequest, startRequest, token]);

  const loadPortal = useCallback(async ({ silent = false } = {}) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/portal/dashboard', { requestLabel: 'Loading your dashboard...' });
      setPortal(data);
      setUser(data.user);
      setActiveView((view) => (navByRole[data.role] ?? []).some((item) => item.id === view) ? view : 'overview');

      if (data.role === 'patient' && data.doctors?.length && !bookingForm.doctor_id) {
        setBookingForm((form) => ({ ...form, doctor_id: String(data.doctors[0].id) }));
      }

      if (data.role === 'pharmacy' && data.pharmacy) {
        setPharmacyForm({
          address: data.pharmacy.address ?? '',
          latitude: data.pharmacy.latitude ?? '',
          longitude: data.pharmacy.longitude ?? '',
          phone: data.pharmacy.phone ?? '',
          hours: data.pharmacy.hours ?? '',
        });
      }

      if (data.role === 'doctor' && data.doctor) {
        setAvailabilityForm({
          is_available: Boolean(data.doctor.is_available ?? true),
          available_from_date: dateInputValue(data.doctor.available_from_date),
          available_to_date: dateInputValue(data.doctor.available_to_date),
          available_start_time: timeInputValue(data.doctor.available_start_time),
          available_end_time: timeInputValue(data.doctor.available_end_time),
          availability_note: data.doctor.availability_note ?? '',
        });
      }

      if (!silent) {
        showToast('success', 'Dashboard refreshed', 'Latest portal data loaded.');
      }
    } catch (err) {
      setError(err.message);
      showToast('error', 'Dashboard request failed', err.message);
      localStorage.removeItem('doconline_token');
      setToken('');
      setUser(null);
      setPortal(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, bookingForm.doctor_id, showToast, token]);

  useEffect(() => {
    loadPortal({ silent: true });
  }, [loadPortal]);

  const selectRole = (newRole) => {
    setSelectedRole(newRole);
    setAuthForm(roleAccounts[newRole]);
    setAuthMode('login');
    setError('');
    setNotice('');
  };

  const login = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    setNotice('');

    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
        headers: { Authorization: '' },
        requestLabel: 'Signing you in...',
      });

      if (data.user.role !== selectedRole) {
        throw new Error(`This account is registered as ${data.user.role}, not ${selectedRole}.`);
      }

      localStorage.setItem('doconline_token', data.token);
      localStorage.setItem('doconline_role', data.user.role);
      setToken(data.token);
      setUser(data.user);
      setSelectedRole(data.user.role);
      setNotice(`${roleAccounts[data.user.role].label} logged in.`);
      showToast('success', 'Signed in', `${roleAccounts[data.user.role].label} dashboard is opening.`);
    } catch (err) {
      setError(err.message);
      showToast('error', 'Sign in failed', err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const register = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    setNotice('');

    try {
      const data = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
        headers: { Authorization: '' },
        requestLabel: 'Creating your account...',
      });

      setNotice(data.message ?? 'Account created. Awaiting admin activation.');
      showToast('success', 'Registration submitted', data.message ?? 'Admin activation is required before login.');
      setAuthMode('login');
      setSelectedRole(registerForm.role);
      setAuthForm({
        ...roleAccounts[registerForm.role],
        email: registerForm.email,
        password: '',
      });
      setRegisterForm({
        role: registerForm.role,
        name: '',
        email: '',
        password: '',
        specialty: '',
        phone: '',
        bio: '',
      });
    } catch (err) {
      setError(err.message);
      showToast('error', 'Registration failed', err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch('/api/logout', { method: 'POST', requestLabel: 'Signing you out...' });
      }
    } catch {
      setNotice('Logged out locally.');
      showToast('warning', 'Logged out locally', 'The backend did not confirm logout.');
    }

    localStorage.removeItem('doconline_token');
    setToken('');
    setUser(null);
    setPortal(null);
    setActiveView('overview');
    showToast('success', 'Signed out', 'Your local session has been cleared.');
  };

  const postAction = async (path, payload, successMessage, method = 'POST') => {
    setError('');
    setNotice('');

    try {
      await apiFetch(path, {
        method,
        body: JSON.stringify(payload ?? {}),
        requestLabel: 'Saving your changes...',
      });
      setNotice(successMessage);
      showToast('success', 'Request completed', successMessage);
      await loadPortal({ silent: true });
      return true;
    } catch (err) {
      setError(err.message);
      showToast('error', 'Request failed', err.message);
      return false;
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    const saved = await postAction('/api/portal/bookings', bookingForm, 'Booking request sent.');

    if (saved) {
      setBookingForm((form) => ({ ...form, scheduled_for: '', reason: '', symptoms: '' }));
    }
  };

  const submitReminder = async (event) => {
    event.preventDefault();
    const saved = await postAction('/api/portal/medication-reminders', reminderForm, 'Medicine reminder added.');

    if (saved) {
      setReminderForm({
        medicine_name: '',
        dosage: '',
        doses_per_day: 1,
        quantity_total: 30,
        quantity_remaining: '',
        refill_at: '',
        remind_at: '',
      });
    }
  };

  const updatePharmacy = async (event) => {
    event.preventDefault();
    await postAction('/api/portal/pharmacy', pharmacyForm, 'Pharmacy location updated.', 'PATCH');
  };

  const updateDoctorAvailability = async (event) => {
    event.preventDefault();
    await postAction('/api/portal/doctor/availability', availabilityForm, 'Doctor availability updated.', 'PATCH');
  };

  const openBookingFromAssistant = (doctor) => {
    const scheduledFor = nextBookingDateTime(doctor);

    setBookingForm((form) => ({
      ...form,
      doctor_id: String(doctor.id),
      scheduled_for: scheduledFor,
      reason: form.reason || `Booking requested after CareGuide availability check with ${doctor.name}.`,
    }));
    setActiveView('bookings');
    showToast('success', 'Booking form prepared', `${doctor.name} is selected with the next available time.`);
  };

  const submitAssistantMessage = (event, quickPrompt = '') => {
    event?.preventDefault();

    const prompt = (quickPrompt || assistantInput).trim();
    if (!prompt || assistantTyping) return;

    const patientMessage = {
      id: `${Date.now()}-patient`,
      author: 'patient',
      text: prompt,
      actions: [],
    };

    setAssistantInput('');
    setAssistantMessages((messages) => [...messages, patientMessage]);
    setAssistantTyping(true);

    const response = buildCareGuideResponse(prompt, portal);
    const delay = Math.min(2200, Math.max(900, response.text.length * 16));

    window.setTimeout(() => {
      setAssistantMessages((messages) => [
        ...messages,
        {
          id: `${Date.now()}-assistant`,
          author: 'assistant',
          ...response,
        },
      ]);
      setAssistantTyping(false);
    }, delay);
  };

  const applyPharmacyDistances = (currentLat, currentLng, sourceLabel) => {
    const pharmacies = withPharmacyDistances(portal?.pharmacies ?? [], currentLat, currentLng);
    const mappedCount = pharmacies.filter((pharmacy) => hasDistance(pharmacy)).length;
    const nextNotice = mappedCount
      ? `${mappedCount} pharmacies sorted nearest first from ${sourceLabel}.`
      : 'No pharmacies have map coordinates yet. Pharmacies can add them from their Location page.';

    setPortal((data) => data ? { ...data, pharmacies } : data);
    setLocationNotice(nextNotice);
    showToast(mappedCount ? 'success' : 'warning', mappedCount ? 'Pharmacies sorted' : 'No mapped pharmacies', nextNotice);
  };

  const sortPharmaciesByLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Location is not supported by this browser.');
      showToast('error', 'Location unavailable', 'This browser does not support current location checks.');
      return;
    }

    setLocationNotice('Checking your current location...');
    startRequest('Checking your location...');
    navigator.geolocation.getCurrentPosition((position) => {
      finishRequest();
      applyPharmacyDistances(position.coords.latitude, position.coords.longitude, 'your current location');
    }, () => {
      finishRequest();
      setLocationNotice('Location permission was not granted.');
      showToast('warning', 'Location blocked', 'Allow location access or enter an address instead.');
    });
  };

  const sortPharmaciesByAddress = async (event) => {
    event.preventDefault();

    const query = locationAddress.trim();
    if (!query) {
      setLocationNotice('Enter an address or area, or use your current location.');
      showToast('warning', 'Address needed', 'Enter an address or use your current location.');
      return;
    }

    setLocationNotice('Finding that address...');
    startRequest('Finding your address...');

    try {
      const coordinates = await geocodeAddress(query);

      if (!coordinates) {
        setLocationNotice('That address was not found. Try a more specific street, suburb, or city.');
        showToast('warning', 'Address not found', 'Try a more specific street, suburb, or city.');
        return;
      }

      applyPharmacyDistances(coordinates.latitude, coordinates.longitude, query);
    } catch {
      setLocationNotice('Address lookup failed. You can still sort using your current location.');
      showToast('error', 'Address lookup failed', 'You can still sort using your current location.');
    } finally {
      finishRequest();
    }
  };

  const enableMedicineAlerts = () => {
    if (!('Notification' in window)) {
      setNotice('This browser does not support notifications.');
      showToast('error', 'Notifications unavailable', 'This browser does not support medicine alerts.');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission !== 'granted') {
        setNotice('Notification permission was not granted.');
        showToast('warning', 'Alerts blocked', 'Notification permission was not granted.');
        return;
      }

      const due = (portal?.reminders ?? []).filter((reminder) => needsRefill(reminder));
      if (due.length) {
        new Notification('Medicine refill needed', {
          body: `${due.slice(0, 2).map((item) => item.medicine_name).join(', ')} running low.`,
        });
      }

      (portal?.reminders ?? []).forEach((reminder) => {
        if (!reminder.remind_at) return;

        const [hours, minutes] = reminder.remind_at.slice(0, 5).split(':').map(Number);
        const now = new Date();
        const alertAt = new Date();
        alertAt.setHours(hours, minutes, 0, 0);
        if (alertAt <= now) alertAt.setDate(alertAt.getDate() + 1);

        window.setTimeout(() => {
          new Notification('Medicine reminder', { body: `Time to take ${reminder.medicine_name}.` });
        }, alertAt.getTime() - now.getTime());
      });

      setNotice('Medicine alerts enabled while this dashboard is open.');
      showToast('success', 'Medicine alerts enabled', 'Alerts will run while this dashboard is open.');
    });
  };

  if (!user) {
    return (
      <>
        <main className="auth-page">
          <section className="auth-hero">
            <div className="brand-row">
              <div className="brand-mark">DO</div>
              <span>Doc Online</span>
            </div>
            <div className="hero-copy">
              <span className="eyebrow">Role-based care portal</span>
              <h1>One connected app for patients, doctors, and pharmacies.</h1>
              <p>
                Each login opens only the information needed for that role. Patient records stay private to the patient and assigned doctor.
              </p>
            </div>
            <div className="metric-strip">
              <div><strong>3</strong><span>Role portals</span></div>
              <div><strong>Maps</strong><span>Nearest pharmacy support</span></div>
              <div><strong>Alerts</strong><span>Medicine reminders</span></div>
            </div>
          </section>

          <section className="auth-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">{authMode === 'login' ? 'Login' : 'Register'}</span>
                <h2>{authMode === 'login' ? `${roleAccounts[selectedRole].label} access` : 'Create account'}</h2>
              </div>
            </div>

            <div className="auth-mode-row">
              <button className={authMode === 'login' ? 'selected-demo' : ''} type="button" onClick={() => setAuthMode('login')}>Log in</button>
              <button className={authMode === 'register' ? 'selected-demo' : ''} type="button" onClick={() => setAuthMode('register')}>Register</button>
            </div>

            {authMode === 'login' && (
              <>
                <div className="demo-row">
                  {Object.entries(roleAccounts).map(([key, account]) => (
                    <button className={selectedRole === key ? 'selected-demo' : ''} key={key} type="button" onClick={() => selectRole(key)}>
                      {account.label}
                    </button>
                  ))}
                </div>

                <form className="form-stack" onSubmit={login}>
                  <Field label="Email address">
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                      minLength={8}
                      required
                    />
                  </Field>
                  <button className="primary-button" type="submit" disabled={authBusy}>
                    {authBusy ? 'Checking...' : `Log in as ${roleAccounts[selectedRole].label}`}
                  </button>
                </form>
              </>
            )}

            {authMode === 'register' && (
              <form className="form-stack" onSubmit={register}>
                <Field label="Account type">
                  <select value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </Field>
                <Field label="Full name">
                  <input value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} required />
                </Field>
                <Field label="Email address">
                  <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required />
                </Field>
                <Field label="Password">
                  <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} minLength={8} required />
                </Field>
                {registerForm.role === 'doctor' && (
                  <>
                    <Field label="Specialty">
                      <input value={registerForm.specialty} onChange={(event) => setRegisterForm({ ...registerForm, specialty: event.target.value })} required />
                    </Field>
                    <Field label="Phone for SMS alerts">
                      <input value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} required />
                    </Field>
                    <Field label="Bio">
                      <textarea value={registerForm.bio} onChange={(event) => setRegisterForm({ ...registerForm, bio: event.target.value })} rows="3" />
                    </Field>
                  </>
                )}
                <button className="primary-button" type="submit" disabled={authBusy}>
                  {authBusy ? 'Submitting...' : 'Submit registration'}
                </button>
              </form>
            )}

            {error && <p className="message error-message">{error}</p>}
            {notice && <p className="message success-message">{notice}</p>}

            {authMode === 'login' && (
              <div className="credential-card">
                <span>Demo account</span>
                <strong>{roleAccounts[selectedRole].email}</strong>
                <code>{roleAccounts[selectedRole].password}</code>
              </div>
            )}
          </section>
        </main>
        <PageLoader active={pendingRequests > 0 || authBusy} message={loaderMessage} />
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">DO</div>
          <span>Doc Online</span>
        </div>

        <div className="user-card">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <span className={`role-chip ${role}`}>{roleAccounts[role]?.label ?? role}</span>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? 'active' : ''}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button className="secondary-button" type="button" onClick={() => loadPortal()}>Refresh</button>
          <button className="ghost-button" type="button" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{roleAccounts[role]?.label} dashboard</span>
            <h1>{title}</h1>
          </div>
        </header>

        {error && <p className="message error-message">{error}</p>}
        {notice && <p className="message success-message">{notice}</p>}
        {loading && <div className="loading-line" />}

        {role === 'patient' && (
          <PatientPortal
            activeView={activeView}
            portal={portal}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            assistantMessages={assistantMessages}
            assistantInput={assistantInput}
            assistantTyping={assistantTyping}
            setAssistantInput={setAssistantInput}
            submitAssistantMessage={submitAssistantMessage}
            openBookingFromAssistant={openBookingFromAssistant}
            reminderForm={reminderForm}
            setReminderForm={setReminderForm}
            submitBooking={submitBooking}
            submitReminder={submitReminder}
            postAction={postAction}
            sortPharmaciesByLocation={sortPharmaciesByLocation}
            sortPharmaciesByAddress={sortPharmaciesByAddress}
            locationNotice={locationNotice}
            locationAddress={locationAddress}
            setLocationAddress={setLocationAddress}
            enableMedicineAlerts={enableMedicineAlerts}
          />
        )}

        {role === 'doctor' && (
          <DoctorPortal
            activeView={activeView}
            portal={portal}
            availabilityForm={availabilityForm}
            setAvailabilityForm={setAvailabilityForm}
            updateDoctorAvailability={updateDoctorAvailability}
          />
        )}

        {role === 'pharmacy' && (
          <PharmacyPortal
            activeView={activeView}
            portal={portal}
            pharmacyForm={pharmacyForm}
            setPharmacyForm={setPharmacyForm}
            updatePharmacy={updatePharmacy}
          />
        )}
        </main>
      </div>
      <PageLoader active={pendingRequests > 0 || loading} message={loaderMessage} />
      {role === 'patient' && (
        <CareGuideLauncher
          open={assistantOpen}
          setOpen={setAssistantOpen}
          messages={assistantMessages}
          input={assistantInput}
          typing={assistantTyping}
          setInput={setAssistantInput}
          submitMessage={submitAssistantMessage}
          openBooking={openBookingFromAssistant}
        />
      )}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function PatientPortal({
  activeView,
  portal,
  bookingForm,
  setBookingForm,
  assistantMessages,
  assistantInput,
  assistantTyping,
  setAssistantInput,
  submitAssistantMessage,
  openBookingFromAssistant,
  reminderForm,
  setReminderForm,
  submitBooking,
  submitReminder,
  postAction,
  sortPharmaciesByLocation,
  sortPharmaciesByAddress,
  locationNotice,
  locationAddress,
  setLocationAddress,
  enableMedicineAlerts,
}) {
  const stats = portal?.stats ?? {};
  const doctors = portal?.doctors ?? [];
  const pharmacies = portal?.pharmacies ?? [];
  const bookings = portal?.bookings ?? [];
  const reminders = portal?.reminders ?? [];
  const records = portal?.records ?? [];

  if (activeView === 'assistant') {
    return (
      <section className="assistant-layout">
        <CareGuideChat
          messages={assistantMessages}
          input={assistantInput}
          typing={assistantTyping}
          setInput={setAssistantInput}
          submitMessage={submitAssistantMessage}
          openBooking={openBookingFromAssistant}
        />

        <aside className="assistant-context panel">
          <span className="eyebrow">Live data</span>
          <h3>What CareGuide can read</h3>
          <div className="detail-list">
            <div><span>Doctors</span><strong>{doctors.length}</strong></div>
            <div><span>Available now</span><strong>{doctors.filter(isDoctorAvailable).length}</strong></div>
            <div><span>Reminders</span><strong>{reminders.length}</strong></div>
            <div><span>Low stock</span><strong>{reminders.filter(needsRefill).length}</strong></div>
          </div>
        </aside>
      </section>
    );
  }

  if (activeView === 'overview') {
    return (
      <section className="view-grid">
        <div className="hero-panel">
          <div>
            <span className="eyebrow">Care overview</span>
            <h2>Your care, bookings, medicine, and records.</h2>
            <p>Only your own bookings, reminders, pharmacy tools, and doctor notes are shown here.</p>
          </div>
          <div className="status-board">
            <div><strong>{stats.bookings ?? 0}</strong><span>Bookings</span></div>
            <div><strong>{stats.low_stock ?? 0}</strong><span>Low-stock medicines</span></div>
            <div><strong>{stats.progress_average ?? 0}%</strong><span>Average progress</span></div>
            <div><strong>{pharmacies.length}</strong><span>Available pharmacies</span></div>
          </div>
        </div>
        <div className="content-grid two">
          <article className="panel">
            <span className="eyebrow">Medicine analytics</span>
            <h3>Current stock</h3>
            {(reminders.length ? reminders : []).map((reminder) => (
              <Bar key={reminder.id} label={reminder.medicine_name} value={stockPercent(reminder)} tone={needsRefill(reminder) ? 'amber' : 'green'} />
            ))}
            {!reminders.length && <EmptyState title="No medicine yet" text="Add a reminder to start tracking stock." />}
          </article>
          <article className="panel">
            <span className="eyebrow">Care analytics</span>
            <h3>Progress from records</h3>
            {(records.length ? records : []).slice(0, 4).map((record) => (
              <Bar key={record.id} label={record.illness} value={record.progress_score} />
            ))}
            {!records.length && <EmptyState title="No records yet" text="Doctor records will appear after visits." />}
          </article>
        </div>
      </section>
    );
  }

  if (activeView === 'bookings') {
    return (
      <section className="content-grid two">
        <article className="panel">
          <SectionHeading kicker="Book care" title="Request a doctor visit" text="Bookings are connected to the backend and visible to the selected doctor." />
          <form className="form-stack" onSubmit={submitBooking}>
            <Field label="Doctor">
              <select value={bookingForm.doctor_id} onChange={(event) => setBookingForm({ ...bookingForm, doctor_id: event.target.value })} required>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialty}</option>)}
              </select>
            </Field>
            <Field label="Date and time">
              <input type="datetime-local" value={bookingForm.scheduled_for} onChange={(event) => setBookingForm({ ...bookingForm, scheduled_for: event.target.value })} required />
            </Field>
            <Field label="Visit type">
              <select value={bookingForm.visit_type} onChange={(event) => setBookingForm({ ...bookingForm, visit_type: event.target.value })}>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="in_person">In person</option>
              </select>
            </Field>
            <Field label="Reason">
              <input value={bookingForm.reason} onChange={(event) => setBookingForm({ ...bookingForm, reason: event.target.value })} required />
            </Field>
            <Field label="Symptoms">
              <textarea value={bookingForm.symptoms} onChange={(event) => setBookingForm({ ...bookingForm, symptoms: event.target.value })} rows="4" />
            </Field>
            <button className="primary-button" type="submit">Request booking</button>
          </form>
        </article>
        <article className="panel">
          <SectionHeading kicker="My bookings" title="Upcoming and previous" text="Only your own booking requests are listed." />
          <RecordTable rows={bookings} columns={[
            ['Doctor', (item) => item.doctor?.name ?? 'Not assigned'],
            ['Date', (item) => formatDate(item.scheduled_for)],
            ['Reason', (item) => item.reason],
            ['Status', (item) => item.status],
          ]} />
        </article>
      </section>
    );
  }

  if (activeView === 'pharmacies') {
    return (
      <section className="section-stack">
        <div className="topbar">
          <SectionHeading kicker="Nearest pharmacy" title="Find available pharmacies" text={locationNotice} />
          <div className="pharmacy-location-tools">
            <form className="location-search" onSubmit={sortPharmaciesByAddress}>
              <input
                aria-label="Address to sort pharmacies from"
                placeholder="Enter your address or area"
                value={locationAddress}
                onChange={(event) => setLocationAddress(event.target.value)}
              />
              <button className="primary-button" type="submit">Use address</button>
            </form>
            <button className="secondary-button" type="button" onClick={sortPharmaciesByLocation}>Use my location</button>
          </div>
        </div>
        <div className="card-grid">
          {pharmacies.map((pharmacy) => (
            <article
              className={`data-card pharmacy-card ${hasDistance(pharmacy) ? 'has-distance' : 'needs-location'}`}
              key={pharmacy.id}
              style={pharmacyDistanceStyle(pharmacies, pharmacy)}
            >
              <div className="map-tile"><span /></div>
              <div className="pharmacy-card-head">
                <div>
                  <h3>{pharmacy.name}</h3>
                  <p>{pharmacy.address ?? 'Address not set'}</p>
                </div>
                {hasDistance(pharmacy) && <span className="distance-chip">{distanceRankLabel(pharmacies, pharmacy)}</span>}
              </div>
              <div className="distance-spectrum"><span /></div>
              <div className="meta-row"><span>Distance</span><strong>{hasDistance(pharmacy) ? `${Number(pharmacy.distance_km).toFixed(1)} km` : 'Add location'}</strong></div>
              <div className="meta-row"><span>Hours</span><strong>{pharmacy.hours ?? 'Not set'}</strong></div>
              <div className="meta-row"><span>Phone</span><strong>{pharmacy.phone ?? 'Not provided'}</strong></div>
              {pharmacy.latitude && pharmacy.longitude && (
                <a className="secondary-button" href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`} target="_blank" rel="noreferrer">Google Maps</a>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === 'reminders') {
    return (
      <section className="content-grid two">
        <article className="panel">
          <div className="topbar">
            <SectionHeading kicker="Medicine reminder" title="Add medication" text="Track remaining stock and receive browser alerts while the dashboard is open." />
            <button className="secondary-button" type="button" onClick={enableMedicineAlerts}>Enable alerts</button>
          </div>
          <form className="form-stack" onSubmit={submitReminder}>
            <Field label="Medicine">
              <input value={reminderForm.medicine_name} onChange={(event) => setReminderForm({ ...reminderForm, medicine_name: event.target.value })} required />
            </Field>
            <Field label="Dosage">
              <input value={reminderForm.dosage} onChange={(event) => setReminderForm({ ...reminderForm, dosage: event.target.value })} />
            </Field>
            <div className="form-two">
              <Field label="Doses per day">
                <input type="number" min="1" max="12" value={reminderForm.doses_per_day} onChange={(event) => setReminderForm({ ...reminderForm, doses_per_day: Number(event.target.value) })} />
              </Field>
              <Field label="Total stock">
                <input type="number" min="1" value={reminderForm.quantity_total} onChange={(event) => setReminderForm({ ...reminderForm, quantity_total: Number(event.target.value) })} />
              </Field>
            </div>
            <div className="form-two">
              <Field label="Remaining">
                <input type="number" min="0" value={reminderForm.quantity_remaining} onChange={(event) => setReminderForm({ ...reminderForm, quantity_remaining: event.target.value })} />
              </Field>
              <Field label="Reminder time">
                <input type="time" value={reminderForm.remind_at} onChange={(event) => setReminderForm({ ...reminderForm, remind_at: event.target.value })} />
              </Field>
            </div>
            <Field label="Refill date">
              <input type="date" value={reminderForm.refill_at} onChange={(event) => setReminderForm({ ...reminderForm, refill_at: event.target.value })} />
            </Field>
            <button className="primary-button" type="submit">Add reminder</button>
          </form>
        </article>
        <article className="panel">
          <SectionHeading kicker="My medicine" title="Stock and dose tracking" text="Dose and refill actions update the backend immediately." />
          <div className="stack-list">
            {reminders.map((reminder) => (
              <div className="queue-card" key={reminder.id}>
                <div className="queue-head">
                  <div>
                    <h3>{reminder.medicine_name}</h3>
                    <p>{reminder.dosage || 'No dosage'} · {reminder.quantity_remaining} of {reminder.quantity_total} left</p>
                  </div>
                  <span className={`role-chip ${needsRefill(reminder) ? 'danger' : 'patient'}`}>{needsRefill(reminder) ? 'Refill soon' : 'On track'}</span>
                </div>
                <Bar label="Stock" value={stockPercent(reminder)} tone={needsRefill(reminder) ? 'amber' : 'green'} />
                <div className="button-row">
                  <button className="secondary-button" type="button" onClick={() => postAction(`/api/portal/medication-reminders/${reminder.id}/taken`, {}, 'Dose recorded.', 'PATCH')}>Mark dose taken</button>
                  <button className="primary-button" type="button" onClick={() => postAction(`/api/portal/medication-reminders/${reminder.id}/refilled`, {}, 'Medicine refilled.', 'PATCH')}>Refilled</button>
                </div>
              </div>
            ))}
            {!reminders.length && <EmptyState title="No reminders" text="Add a medication to start tracking." />}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="section-stack">
      <SectionHeading kicker="Private records" title="My doctor records" text="Only your own illness, way-forward notes, and medication effects are shown." />
      <RecordTable rows={records} columns={[
        ['Doctor', (item) => item.doctor?.name ?? 'Not assigned'],
        ['Illness', (item) => item.illness],
        ['Way forward', (item) => item.treatment_plan ?? 'Not recorded'],
        ['Medication effects', (item) => item.medication_effects ?? 'Not recorded'],
      ]} />
    </section>
  );
}

function DoctorPortal({ activeView, portal, availabilityForm, setAvailabilityForm, updateDoctorAvailability }) {
  const stats = portal?.stats ?? {};
  const bookings = portal?.bookings ?? [];
  const records = portal?.records ?? [];
  const doctor = portal?.doctor;

  if (activeView === 'overview') {
    return (
      <section className="view-grid">
        <div className="hero-panel">
          <div>
            <span className="eyebrow">Doctor workspace</span>
            <h2>Assigned bookings and patient care records.</h2>
            <p>Doctors only see bookings and records connected to their doctor profile.</p>
          </div>
          <div className="status-board">
            <div><strong>{stats.pending_bookings ?? 0}</strong><span>Pending bookings</span></div>
            <div><strong>{stats.completed_bookings ?? 0}</strong><span>Completed visits</span></div>
            <div><strong>{stats.average_progress ?? 0}%</strong><span>Avg progress</span></div>
            <div><strong>{stats.average_adherence ?? 0}%</strong><span>Avg adherence</span></div>
          </div>
        </div>
        <div className="content-grid two">
          <article className="panel">
            <span className="eyebrow">Booking analytics</span>
            <h3>Current workload</h3>
            <Bar label="Pending" value={percent(stats.pending_bookings, bookings.length)} tone="amber" />
            <Bar label="Completed" value={percent(stats.completed_bookings, bookings.length)} />
          </article>
          <article className="panel">
            <span className="eyebrow">Patient response</span>
            <h3>Clinical indicators</h3>
            <Bar label="Average progress" value={stats.average_progress} />
            <Bar label="Average adherence" value={stats.average_adherence} tone="blue" />
          </article>
        </div>
      </section>
    );
  }

  if (activeView === 'availability') {
    return (
      <section className="content-grid two">
        <article className="panel">
          <SectionHeading kicker="Booking availability" title="Set patient booking window" text="CareGuide and the patient booking flow use this status to explain when you can be booked." />
          <form className="form-stack" onSubmit={updateDoctorAvailability}>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={availabilityForm.is_available}
                onChange={(event) => setAvailabilityForm({ ...availabilityForm, is_available: event.target.checked })}
              />
              <span>Available for patient bookings</span>
            </label>
            <div className="form-two">
              <Field label="Available from">
                <input type="date" value={availabilityForm.available_from_date} onChange={(event) => setAvailabilityForm({ ...availabilityForm, available_from_date: event.target.value })} />
              </Field>
              <Field label="Available to">
                <input type="date" value={availabilityForm.available_to_date} onChange={(event) => setAvailabilityForm({ ...availabilityForm, available_to_date: event.target.value })} />
              </Field>
            </div>
            <div className="form-two">
              <Field label="Start time">
                <input type="time" value={availabilityForm.available_start_time} onChange={(event) => setAvailabilityForm({ ...availabilityForm, available_start_time: event.target.value })} />
              </Field>
              <Field label="End time">
                <input type="time" value={availabilityForm.available_end_time} onChange={(event) => setAvailabilityForm({ ...availabilityForm, available_end_time: event.target.value })} />
              </Field>
            </div>
            <Field label="Availability note">
              <input value={availabilityForm.availability_note} onChange={(event) => setAvailabilityForm({ ...availabilityForm, availability_note: event.target.value })} placeholder="Example: Weekdays only, emergency slots in the morning" />
            </Field>
            <button className="primary-button" type="submit">Save availability</button>
          </form>
        </article>

        <article className="data-card">
          <span className="eyebrow">Current status</span>
          <h3>{doctor?.name}</h3>
          <p>{doctorAvailabilityText(doctor)}</p>
          <div className="detail-list">
            <div><span>Specialty</span><strong>{doctor?.specialty ?? 'Not set'}</strong></div>
            <div><span>Status</span><strong>{isDoctorAvailable(doctor) ? 'Available' : 'Unavailable'}</strong></div>
            <div><span>Note</span><strong>{doctor?.availability_note ?? 'None'}</strong></div>
          </div>
        </article>
      </section>
    );
  }

  if (activeView === 'bookings') {
    return (
      <section className="section-stack">
        <SectionHeading kicker="Assigned bookings" title="Patient consultation requests" text="Only bookings assigned to your doctor account appear here." />
        <RecordTable rows={bookings} columns={[
          ['Patient', (item) => item.patient?.name ?? 'Patient'],
          ['Date', (item) => formatDate(item.scheduled_for)],
          ['Reason', (item) => item.reason],
          ['Symptoms', (item) => item.symptoms ?? 'Not provided'],
          ['Status', (item) => item.status],
        ]} />
      </section>
    );
  }

  return (
    <section className="section-stack">
      <SectionHeading kicker="Patient records" title="Clinical notes and medicine effects" text="These records are visible to the assigned doctor and the patient, not pharmacies." />
      <RecordTable rows={records} columns={[
        ['Patient', (item) => item.patient?.name ?? 'Patient'],
        ['Illness', (item) => item.illness],
        ['Diagnosis', (item) => item.diagnosis ?? 'Not recorded'],
        ['Way forward', (item) => item.treatment_plan ?? 'Not recorded'],
        ['Effects', (item) => item.medication_effects ?? 'Not recorded'],
        ['Progress', (item) => `${item.progress_score}%`],
      ]} />
    </section>
  );
}

function PharmacyPortal({ activeView, portal, pharmacyForm, setPharmacyForm, updatePharmacy }) {
  const stats = portal?.stats ?? {};
  const queue = portal?.medication_queue ?? [];
  const illnesses = portal?.illness_summary ?? [];
  const pharmacy = portal?.pharmacy;

  if (activeView === 'overview') {
    return (
      <section className="view-grid">
        <div className="hero-panel">
          <div>
            <span className="eyebrow">Pharmacy workspace</span>
            <h2>Medicine demand and public location details.</h2>
            <p>Pharmacies can update their own address and see medicine/refill context, not private doctor notes.</p>
          </div>
          <div className="status-board">
            <div><strong>{stats.refill_due ?? 0}</strong><span>Refills due</span></div>
            <div><strong>{stats.active_medicines ?? 0}</strong><span>Tracked medicines</span></div>
            <div><strong>{stats.mapped ? 'Yes' : 'No'}</strong><span>Map ready</span></div>
            <div><strong>{queue.length}</strong><span>Queue items</span></div>
          </div>
        </div>
        <div className="content-grid two">
          <article className="panel">
            <span className="eyebrow">Refill analytics</span>
            <h3>Medicine queue</h3>
            <Bar label="Refill due" value={percent(stats.refill_due, queue.length)} tone="amber" />
            <Bar label="Active stock" value={percent(queue.length - (stats.refill_due ?? 0), queue.length)} />
          </article>
          <article className="panel">
            <span className="eyebrow">Location</span>
            <h3>{pharmacy?.name}</h3>
            <p>{pharmacy?.address ?? 'Address not set'}</p>
            <div className="detail-list">
              <div><span>Phone</span><strong>{pharmacy?.phone ?? 'Not set'}</strong></div>
              <div><span>Hours</span><strong>{pharmacy?.hours ?? 'Not set'}</strong></div>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (activeView === 'location') {
    return (
      <section className="content-grid two">
        <article className="panel">
          <SectionHeading kicker="Public pharmacy details" title="Update address and coordinates" text="Patients use this data to find the nearest pharmacy with Google Maps." />
          <form className="form-stack" onSubmit={updatePharmacy}>
            <Field label="Address">
              <input value={pharmacyForm.address} onChange={(event) => setPharmacyForm({ ...pharmacyForm, address: event.target.value })} />
            </Field>
            <div className="form-two">
              <Field label="Latitude">
                <input type="number" step="0.0000001" value={pharmacyForm.latitude} onChange={(event) => setPharmacyForm({ ...pharmacyForm, latitude: event.target.value })} />
              </Field>
              <Field label="Longitude">
                <input type="number" step="0.0000001" value={pharmacyForm.longitude} onChange={(event) => setPharmacyForm({ ...pharmacyForm, longitude: event.target.value })} />
              </Field>
            </div>
            <Field label="Phone">
              <input value={pharmacyForm.phone} onChange={(event) => setPharmacyForm({ ...pharmacyForm, phone: event.target.value })} />
            </Field>
            <Field label="Hours">
              <input value={pharmacyForm.hours} onChange={(event) => setPharmacyForm({ ...pharmacyForm, hours: event.target.value })} />
            </Field>
            <button className="primary-button" type="submit">Save pharmacy details</button>
          </form>
        </article>
        <article className="data-card">
          <div className="map-tile"><span /></div>
          <h3>{pharmacy?.name}</h3>
          <p>{pharmacy?.address ?? 'Address not set'}</p>
          {pharmacy?.latitude && pharmacy?.longitude && (
            <a className="secondary-button" href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.latitude},${pharmacy.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
          )}
        </article>
      </section>
    );
  }

  if (activeView === 'medicines') {
    return (
      <section className="section-stack">
        <SectionHeading kicker="Dispensing context" title="Medication queue" text="Pharmacy sees medication/refill context only. Doctor diagnoses and private notes are not exposed here." />
        <RecordTable rows={queue} columns={[
          ['Patient', (item) => item.patient ?? 'Patient'],
          ['Medicine', (item) => item.medicine_name],
          ['Dosage', (item) => item.dosage ?? 'Not set'],
          ['Remaining', (item) => item.quantity_remaining],
          ['Refill date', (item) => formatShortDate(item.refill_at)],
          ['Status', (item) => item.status],
        ]} />
      </section>
    );
  }

  return (
    <section className="section-stack">
      <SectionHeading kicker="Limited illness summary" title="Previous illness categories" text="This is a restricted summary for medication safety. It does not include diagnosis, doctor notes, effects, or treatment plans." />
      <RecordTable rows={illnesses} columns={[
        ['Patient', (item) => item.patient ?? 'Patient'],
        ['Illness', (item) => item.illness],
        ['Recorded', (item) => formatShortDate(item.recorded_at)],
      ]} />
    </section>
  );
}

function RecordTable({ rows, columns }) {
  if (!rows?.length) {
    return <EmptyState title="No records" text="Data will appear here after it is created in the system." />;
  }

  return (
    <div className="table-panel">
      <table>
        <thead>
          <tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? `${row.patient}-${row.illness}-${row.medicine_name}`}>
              {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildCareGuideResponse(prompt, portal) {
  const doctors = portal?.doctors ?? [];
  const reminders = portal?.reminders ?? [];
  const records = portal?.records ?? [];
  const stats = portal?.stats ?? {};
  const query = prompt.toLowerCase();

  if (!portal) {
    return {
      text: 'I need your dashboard data before I can answer. Refresh the portal and ask again.',
      actions: [],
    };
  }

  if (/(doctor|doc|available|availability|book|appointment|specialist|specialty)/.test(query)) {
    const matchingDoctor = doctors.find((doctor) => {
      const name = String(doctor.name ?? '').toLowerCase();
      const specialty = String(doctor.specialty ?? '').toLowerCase();
      return name && (query.includes(name) || name.split(' ').some((part) => part.length > 3 && query.includes(part)) || (specialty && query.includes(specialty)));
    });
    const candidates = matchingDoctor ? [matchingDoctor] : doctors;
    const bookable = candidates.filter(isDoctorBookable);

    if (!doctors.length) {
      return {
        text: 'I do not see active doctors in the portal yet. Please check again after the clinic updates the doctor directory.',
        actions: [],
      };
    }

    if (!bookable.length) {
      return {
        text: matchingDoctor
          ? `${matchingDoctor.name} is currently marked unavailable. ${doctorAvailabilityText(matchingDoctor)}`
          : 'No doctors are marked available for booking right now. I can still help you check reminders or prepare once availability is updated.',
        actions: [],
      };
    }

    const summary = bookable
      .slice(0, 4)
      .map((doctor) => `${doctor.name} (${doctor.specialty ?? 'general care'}): ${doctorAvailabilityText(doctor)}`)
      .join(' ');

    return {
      text: `${matchingDoctor ? 'I checked that doctor.' : 'I checked the live doctor list.'} ${summary}`,
      actions: bookable.slice(0, 3).map((doctor) => ({ type: 'book', doctor })),
    };
  }

  if (/(reminder|medicine|medication|dose|refill|stock|tablet|pill)/.test(query)) {
    if (!reminders.length) {
      return {
        text: 'You do not have medication reminders on this account yet. Add one from Reminders so I can track stock and refill timing for you.',
        actions: [],
      };
    }

    const urgent = reminders.filter(needsRefill);
    const scheduled = reminders.filter((reminder) => reminder.remind_at).slice(0, 3);
    const urgentText = urgent.length
      ? `${urgent.length} reminder${urgent.length === 1 ? '' : 's'} need attention: ${urgent.map((item) => item.medicine_name).join(', ')}.`
      : 'No medication is currently flagged for refill.';
    const scheduleText = scheduled.length
      ? ` Scheduled reminders: ${scheduled.map((item) => `${item.medicine_name} at ${timeInputValue(item.remind_at)}`).join(', ')}.`
      : ' No reminder times are set yet.';

    return {
      text: `${urgentText}${scheduleText}`,
      actions: [],
    };
  }

  if (/(tip|advice|stats|progress|health|care|summary)/.test(query)) {
    const lowStock = reminders.filter(needsRefill).length;
    const progress = Number(stats.progress_average ?? 0);
    const latestRecord = records[0];
    const tips = [];

    if (lowStock) {
      tips.push(`You have ${lowStock} low-stock medicine item${lowStock === 1 ? '' : 's'}, so refill planning should be handled before booking delays become a problem.`);
    }

    if (progress > 0 && progress < 60) {
      tips.push(`Your average progress is ${progress}%, so ask your doctor to review the treatment plan at your next visit.`);
    } else if (progress >= 60) {
      tips.push(`Your average progress is ${progress}%; keep your reminder routine consistent and report any medication effects.`);
    }

    if (latestRecord?.medication_effects) {
      tips.push(`Your latest record mentions medication effects. Keep that detail ready for the doctor when booking.`);
    }

    return {
      text: tips.length
        ? tips.join(' ')
        : 'Your portal does not show enough trend data for a specific care tip yet. Keep reminders updated and record symptoms clearly before appointments.',
      actions: [],
    };
  }

  return {
    text: 'I can help with doctor availability, booking handoff, medication reminders, refill status, and care tips from your portal stats. I cannot answer topics outside Doc Online patient support.',
    actions: [],
  };
}

function isDoctorBookable(doctor) {
  return doctor?.is_active !== false && doctor?.is_available !== false;
}

function isDoctorAvailable(doctor) {
  if (!isDoctorBookable(doctor)) return false;

  const today = startOfToday();
  const from = parseDateOnly(doctor.available_from_date);
  const to = parseDateOnly(doctor.available_to_date);

  if (from && from > today) return false;
  if (to && to < today) return false;

  return true;
}

function doctorAvailabilityText(doctor) {
  if (!doctor) return 'Availability has not been set.';
  if (doctor.is_available === false) return 'Marked unavailable for patient bookings.';

  const from = formatCareDate(doctor.available_from_date);
  const to = formatCareDate(doctor.available_to_date);
  const start = timeInputValue(doctor.available_start_time);
  const end = timeInputValue(doctor.available_end_time);
  const dateText = from && to ? `${from} to ${to}` : from ? `from ${from}` : to ? `until ${to}` : 'open dates';
  const timeText = start && end ? `${start} to ${end}` : start ? `from ${start}` : end ? `until ${end}` : 'times not restricted';
  const note = doctor.availability_note ? ` Note: ${doctor.availability_note}.` : '';

  return `Available ${dateText}, ${timeText}.${note}`;
}

function nextBookingDateTime(doctor) {
  const now = new Date();
  const from = parseDateOnly(doctor.available_from_date);
  const selected = from && from > startOfToday() ? from : new Date(now);
  const [hour, minute] = timeInputValue(doctor.available_start_time)
    ? timeInputValue(doctor.available_start_time).split(':').map(Number)
    : [now.getHours() + 1, 0];

  selected.setHours(hour, minute, 0, 0);

  if (selected <= now) {
    selected.setHours(now.getHours() + 1, 0, 0, 0);
  }

  return toDateTimeLocalValue(selected);
}

function dateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function timeInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function parseDateOnly(value) {
  const input = dateInputValue(value);
  if (!input) return null;

  const date = new Date(`${input}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatCareDate(value) {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
}

function toDateTimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withPharmacyDistances(pharmacies, currentLat, currentLng) {
  return pharmacies
    .map((pharmacy) => {
      const latitude = Number(pharmacy.latitude);
      const longitude = Number(pharmacy.longitude);
      const canMeasure = Number.isFinite(latitude) && Number.isFinite(longitude);

      return {
        ...pharmacy,
        distance_km: canMeasure ? distanceKm(currentLat, currentLng, latitude, longitude) : null,
      };
    })
    .sort((a, b) => {
      if (!hasDistance(a) && !hasDistance(b)) return String(a.name).localeCompare(String(b.name));
      if (!hasDistance(a)) return 1;
      if (!hasDistance(b)) return -1;
      return Number(a.distance_km) - Number(b.distance_km);
    });
}

async function geocodeAddress(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Address lookup failed.');
  }

  const [result] = await response.json();

  if (!result) return null;

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  };
}

function hasDistance(pharmacy) {
  return Number.isFinite(Number(pharmacy?.distance_km));
}

function locatedPharmacies(pharmacies) {
  return pharmacies.filter((pharmacy) => hasDistance(pharmacy));
}

function distanceRankLabel(pharmacies, pharmacy) {
  const located = locatedPharmacies(pharmacies);
  const rank = located.findIndex((item) => item.id === pharmacy.id);

  if (rank === -1) return 'Needs location';
  if (rank === 0) return 'Nearest';
  if (rank === located.length - 1) return 'Farthest';

  return `#${rank + 1} nearby`;
}

function pharmacyDistanceStyle(pharmacies, pharmacy) {
  const located = locatedPharmacies(pharmacies);
  const rank = located.findIndex((item) => item.id === pharmacy.id);

  if (rank === -1) {
    return {
      '--distance-color': '#656d76',
      '--distance-bg': 'rgba(101, 109, 118, 0.08)',
      '--distance-strength': '0%',
    };
  }

  const ratio = located.length > 1 ? rank / (located.length - 1) : 0;
  const color = spectrumColor(ratio);

  return {
    '--distance-color': `rgb(${color.join(', ')})`,
    '--distance-bg': `rgba(${color.join(', ')}, ${0.14 - ratio * 0.04})`,
    '--distance-strength': `${Math.max(12, Math.round((1 - ratio) * 100))}%`,
  };
}

function spectrumColor(ratio) {
  const green = [22, 138, 99];
  const blue = [37, 99, 235];
  const amber = [183, 121, 31];
  const midpoint = 0.52;

  if (ratio <= midpoint) {
    return mixColor(green, blue, ratio / midpoint);
  }

  return mixColor(blue, amber, (ratio - midpoint) / (1 - midpoint));
}

function mixColor(from, to, amount) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * amount));
}

function stockPercent(reminder) {
  if (!reminder?.quantity_total) return 0;
  return Math.round((Number(reminder.quantity_remaining ?? 0) / Number(reminder.quantity_total)) * 100);
}

function needsRefill(reminder) {
  const remaining = Number(reminder?.quantity_remaining ?? 0);
  const doses = Math.max(1, Number(reminder?.doses_per_day ?? 1));
  const refillAt = reminder?.refill_at ? new Date(reminder.refill_at) : null;
  return remaining <= doses * 2 || (refillAt && refillAt < new Date());
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value ?? 0) / Number(total)) * 100);
}
