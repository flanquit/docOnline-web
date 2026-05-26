import { useCallback, useEffect, useMemo, useState } from 'react';
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
    { id: 'bookings', label: 'Bookings' },
    { id: 'pharmacies', label: 'Pharmacies' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'records', label: 'My Records' },
  ],
  doctor: [
    { id: 'overview', label: 'Overview' },
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

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('doconline_token') ?? '');
  const [selectedRole, setSelectedRole] = useState(localStorage.getItem('doconline_role') ?? 'patient');
  const [authForm, setAuthForm] = useState(roleAccounts[selectedRole]);
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [locationNotice, setLocationNotice] = useState('Use your current location to sort pharmacies by distance.');
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

  const role = portal?.role ?? user?.role ?? selectedRole;
  const navigation = navByRole[role] ?? navByRole.patient;
  const title = navigation.find((item) => item.id === activeView)?.label ?? 'Overview';

  const apiFetch = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
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
  }, [token]);

  const loadPortal = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/portal/dashboard');
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
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('doconline_token');
      setToken('');
      setUser(null);
      setPortal(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, bookingForm.doctor_id, token]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const selectRole = (newRole) => {
    setSelectedRole(newRole);
    setAuthForm(roleAccounts[newRole]);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch('/api/logout', { method: 'POST' });
      }
    } catch {
      setNotice('Logged out locally.');
    }

    localStorage.removeItem('doconline_token');
    setToken('');
    setUser(null);
    setPortal(null);
    setActiveView('overview');
  };

  const postAction = async (path, payload, successMessage, method = 'POST') => {
    setError('');
    setNotice('');
    await apiFetch(path, {
      method,
      body: JSON.stringify(payload ?? {}),
    });
    setNotice(successMessage);
    await loadPortal();
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    await postAction('/api/portal/bookings', bookingForm, 'Booking request sent.');
    setBookingForm((form) => ({ ...form, scheduled_for: '', reason: '', symptoms: '' }));
  };

  const submitReminder = async (event) => {
    event.preventDefault();
    await postAction('/api/portal/medication-reminders', reminderForm, 'Medicine reminder added.');
    setReminderForm({
      medicine_name: '',
      dosage: '',
      doses_per_day: 1,
      quantity_total: 30,
      quantity_remaining: '',
      refill_at: '',
      remind_at: '',
    });
  };

  const updatePharmacy = async (event) => {
    event.preventDefault();
    await postAction('/api/portal/pharmacy', pharmacyForm, 'Pharmacy location updated.', 'PATCH');
  };

  const sortPharmaciesByLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Location is not supported by this browser.');
      return;
    }

    setLocationNotice('Checking your current location...');
    navigator.geolocation.getCurrentPosition((position) => {
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;
      const pharmacies = (portal?.pharmacies ?? []).map((pharmacy) => ({
        ...pharmacy,
        distance_km: pharmacy.latitude && pharmacy.longitude
          ? distanceKm(currentLat, currentLng, Number(pharmacy.latitude), Number(pharmacy.longitude))
          : null,
      })).sort((a, b) => (a.distance_km ?? 999999) - (b.distance_km ?? 999999));

      setPortal((data) => ({ ...data, pharmacies }));
      setLocationNotice('Nearest pharmacies are sorted by distance.');
    }, () => {
      setLocationNotice('Location permission was not granted.');
    });
  };

  const enableMedicineAlerts = () => {
    if (!('Notification' in window)) {
      setNotice('This browser does not support notifications.');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission !== 'granted') {
        setNotice('Notification permission was not granted.');
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
    });
  };

  if (!user) {
    return (
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
              <span className="eyebrow">Login</span>
              <h2>{roleAccounts[selectedRole].label} access</h2>
            </div>
          </div>

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

          {error && <p className="message error-message">{error}</p>}
          {notice && <p className="message success-message">{notice}</p>}

          <div className="credential-card">
            <span>Demo account</span>
            <strong>{roleAccounts[selectedRole].email}</strong>
            <code>{roleAccounts[selectedRole].password}</code>
          </div>
        </section>
      </main>
    );
  }

  return (
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
          <button className="secondary-button" type="button" onClick={loadPortal}>Refresh</button>
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
            reminderForm={reminderForm}
            setReminderForm={setReminderForm}
            submitBooking={submitBooking}
            submitReminder={submitReminder}
            postAction={postAction}
            sortPharmaciesByLocation={sortPharmaciesByLocation}
            locationNotice={locationNotice}
            enableMedicineAlerts={enableMedicineAlerts}
          />
        )}

        {role === 'doctor' && <DoctorPortal activeView={activeView} portal={portal} />}

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
  );
}

function PatientPortal({
  activeView,
  portal,
  bookingForm,
  setBookingForm,
  reminderForm,
  setReminderForm,
  submitBooking,
  submitReminder,
  postAction,
  sortPharmaciesByLocation,
  locationNotice,
  enableMedicineAlerts,
}) {
  const stats = portal?.stats ?? {};
  const doctors = portal?.doctors ?? [];
  const pharmacies = portal?.pharmacies ?? [];
  const bookings = portal?.bookings ?? [];
  const reminders = portal?.reminders ?? [];
  const records = portal?.records ?? [];

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
          <button className="secondary-button" type="button" onClick={sortPharmaciesByLocation}>Use my location</button>
        </div>
        <div className="card-grid">
          {pharmacies.map((pharmacy) => (
            <article className="data-card" key={pharmacy.id}>
              <div className="map-tile"><span /></div>
              <h3>{pharmacy.name}</h3>
              <p>{pharmacy.address ?? 'Address not set'}</p>
              <div className="meta-row"><span>Distance</span><strong>{pharmacy.distance_km ? `${pharmacy.distance_km.toFixed(1)} km` : 'Allow location'}</strong></div>
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

function DoctorPortal({ activeView, portal }) {
  const stats = portal?.stats ?? {};
  const bookings = portal?.bookings ?? [];
  const records = portal?.records ?? [];

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

function distanceKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
