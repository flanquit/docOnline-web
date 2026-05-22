import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const demoAccounts = {
  patient: { email: 'patient@doconline.test', password: 'password' },
  admin: { email: 'admin@doconline.test', password: 'password' },
  pending: { email: 'pending@doconline.test', password: 'password' },
};

const navigation = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'profile', label: 'My Account' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'pharmacies', label: 'Pharmacies' },
  { id: 'packages', label: 'Care Packages' },
  { id: 'patients', label: 'Patients' },
  { id: 'roadmap', label: 'Next Modules' },
];

const roadmap = [
  {
    title: 'Booking Requests',
    text: 'Request a doctor visit and track the status.',
    status: 'Coming soon',
  },
  {
    title: 'Nearest Pharmacy',
    text: 'Find nearby open pharmacies faster.',
    status: 'Coming soon',
  },
  {
    title: 'Medication Reminders',
    text: 'Get reminders before medicine runs out.',
    status: 'Coming soon',
  },
];

function money(value) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function initials(name = 'DO') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('doconline_token') ?? '');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [activeView, setActiveView] = useState('dashboard');
  const [authForm, setAuthForm] = useState({
    name: 'Tariro Moyo',
    email: demoAccounts.patient.email,
    password: demoAccounts.patient.password,
  });
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [packages, setPackages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [activity, setActivity] = useState([
    'Care dashboard is ready.',
    'Welcome back.',
  ]);

  const activePackage = user?.care_package ?? null;
  const activePatientCount = patients.length;
  const activeDoctorCount = doctors.length;
  const activePharmacyCount = pharmacies.length;
  const activePackageCount = packages.length;

  const currentViewLabel = useMemo(
    () => navigation.find((item) => item.id === activeView)?.label ?? 'Overview',
    [activeView]
  );

  const addActivity = (message) => {
    setActivity((items) => [message, ...items].slice(0, 6));
  };

  const fillDemo = (account) => {
    setAuthMode('login');
    setAuthForm((form) => ({
      ...form,
      email: demoAccounts[account].email,
      password: demoAccounts[account].password,
    }));
    setError('');
    setNotice('');
  };

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

  const loadPublicData = useCallback(async () => {
    const [doctorData, pharmacyData, packageData, patientData] = await Promise.all([
      apiFetch('/api/doctors'),
      apiFetch('/api/pharmacies'),
      apiFetch('/api/care-packages'),
      apiFetch('/api/patients'),
    ]);

    setDoctors(doctorData);
    setPharmacies(pharmacyData);
    setPackages(packageData);
    setPatients(patientData);
  }, [apiFetch]);

  const syncProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    const profile = await apiFetch('/api/me');
    setUser(profile);
  }, [apiFetch, token]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      setLoading(true);
      try {
        await loadPublicData();
        if (token) {
          await syncProfile();
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          if (token) {
            localStorage.removeItem('doconline_token');
            setToken('');
            setUser(null);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    boot();

    return () => {
      active = false;
    };
  }, [token, loadPublicData, syncProfile]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    setNotice('');

    try {
      const path = authMode === 'login' ? '/api/login' : '/api/register';
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : { name: authForm.name, email: authForm.email, password: authForm.password };

      const data = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: token ? { Authorization: '' } : {},
      });

      if (authMode === 'register') {
        setNotice(data.message ?? 'Account created. Ask the admin to activate it.');
        setAuthMode('login');
        addActivity('New account created.');
        return;
      }

      localStorage.setItem('doconline_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setActiveView('dashboard');
      addActivity(`${data.user.name} logged in successfully.`);
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
    setActiveView('dashboard');
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
            <span className="eyebrow">Integrated telemedicine platform</span>
            <h1>Care, doctors, pharmacies, and packages in one place.</h1>
            <p>
              Sign in to manage your care profile, view providers, and check available packages.
            </p>
          </div>
          <div className="metric-strip">
            <div>
              <strong>{activeDoctorCount}</strong>
              <span>Doctors</span>
            </div>
            <div>
              <strong>{activePharmacyCount}</strong>
              <span>Pharmacies</span>
            </div>
            <div>
              <strong>{activePackageCount}</strong>
              <span>Packages</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">{authMode === 'login' ? 'Login' : 'Register'}</span>
              <h2>{authMode === 'login' ? 'Welcome back' : 'Create patient account'}</h2>
            </div>
            <button className="link-button" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </div>

          <div className="demo-row">
            <button type="button" onClick={() => fillDemo('patient')}>Patient demo</button>
            <button type="button" onClick={() => fillDemo('admin')}>Admin demo</button>
            <button type="button" onClick={() => fillDemo('pending')}>Inactive demo</button>
          </div>

          <form className="form-stack" onSubmit={submitAuth}>
            {authMode === 'register' && (
              <Field label="Full name">
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  required
                />
              </Field>
            )}
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
              {authBusy ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          {error && <p className="message error-message">{error}</p>}
          {notice && <p className="message success-message">{notice}</p>}

          <div className="credential-card">
            <span>Default login</span>
            <strong>{demoAccounts.patient.email}</strong>
            <code>{demoAccounts.patient.password}</code>
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
          <span className={user.is_admin ? 'role-chip admin' : 'role-chip'}>
            {user.is_admin ? 'Admin' : 'Patient'}
          </span>
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
          <a className="secondary-button" href={`${API_BASE_URL}/admin`} target="_blank" rel="noreferrer">
            Admin portal
          </a>
          <button className="ghost-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Doc Online</span>
            <h1>{currentViewLabel}</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  await loadPublicData();
                  await syncProfile();
                  addActivity('Data refreshed from the backend API.');
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Refresh data
            </button>
          </div>
        </header>

        {error && <p className="message error-message">{error}</p>}
        {loading && <div className="loading-line" />}

        {activeView === 'dashboard' && (
          <section className="view-grid">
            <div className="hero-panel">
              <div>
                <span className="eyebrow">Care coordination</span>
                <h2>Your care hub is ready.</h2>
                <p>
                  View your profile, providers, pharmacies, and care package from one clean dashboard.
                </p>
              </div>
              <div className="status-board">
                <div>
                  <strong>{activePatientCount}</strong>
                  <span>Active patients</span>
                </div>
                <div>
                  <strong>{activeDoctorCount}</strong>
                  <span>Active doctors</span>
                </div>
                <div>
                  <strong>{activePharmacyCount}</strong>
                  <span>Active pharmacies</span>
                </div>
                <div>
                  <strong>{activePackageCount}</strong>
                  <span>Care packages</span>
                </div>
              </div>
            </div>

            <div className="content-grid two">
              <article className="panel">
                <span className="eyebrow">Current account</span>
                <h3>{user.name}</h3>
                <p>{user.is_active ? 'Account active and authenticated.' : 'Account waiting for activation.'}</p>
                <div className="detail-list">
                  <div><span>Email</span><strong>{user.email}</strong></div>
                  <div><span>Package</span><strong>{activePackage?.name ?? 'Not assigned'}</strong></div>
                  <div><span>Package status</span><strong>{user.care_package_active ? 'Active' : 'Inactive'}</strong></div>
                </div>
              </article>

              <article className="panel">
                <span className="eyebrow">Activity</span>
                <h3>Recent actions</h3>
                <div className="activity-list">
                  {activity.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="content-grid two">
            <article className="panel tall">
              <span className="eyebrow">Protected endpoint</span>
              <h2>Authenticated profile</h2>
              <div className="profile-block">
                <div className="avatar large">{initials(user.name)}</div>
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="role-chip">{user.is_active ? 'Active account' : 'Inactive account'}</span>
                </div>
              </div>
              <div className="detail-list">
                <div><span>User ID</span><strong>#{user.id}</strong></div>
                <div><span>Admin access</span><strong>{user.is_admin ? 'Yes' : 'No'}</strong></div>
                <div><span>Care package</span><strong>{activePackage?.name ?? 'Not assigned'}</strong></div>
                <div><span>Last activity</span><strong>{user.last_activity_at ? new Date(user.last_activity_at).toLocaleString() : 'Just now'}</strong></div>
              </div>
            </article>

            <article className="panel tall">
              <span className="eyebrow">Care package</span>
              <h2>{activePackage?.name ?? 'No package assigned'}</h2>
              <p>{activePackage?.description ?? 'An administrator can assign a care package from the Laravel admin portal.'}</p>
              {activePackage?.features?.length ? (
                <ul className="check-list">
                  {activePackage.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              ) : (
                <EmptyState title="No package features" text="Package details will appear here after assignment." />
              )}
            </article>
          </section>
        )}

        {activeView === 'doctors' && (
          <section className="section-stack">
            <SectionHeading
              kicker="Doctor directory"
              title="Available doctors"
              text="Choose a provider for your next care visit."
            />
            <div className="card-grid">
              {doctors.map((doctor) => (
                <article className="data-card" key={doctor.id}>
                  <div className="avatar">{initials(doctor.name)}</div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialty ?? 'General Care'}</p>
                  <div className="meta-row"><span>Email</span><strong>{doctor.email ?? 'Not provided'}</strong></div>
                  <div className="meta-row"><span>Phone</span><strong>{doctor.phone ?? 'Not provided'}</strong></div>
                  <p className="small-text">{doctor.bio}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'pharmacies' && (
          <section className="section-stack">
            <SectionHeading
              kicker="Pharmacy directory"
              title="Nearby pharmacies"
              text="Check contact details, locations, and opening hours."
            />
            <div className="card-grid">
              {pharmacies.map((pharmacy) => (
                <article className="data-card" key={pharmacy.id}>
                  <div className="map-tile"><span /></div>
                  <h3>{pharmacy.name}</h3>
                  <p>{pharmacy.address ?? 'Address not provided'}</p>
                  <div className="meta-row"><span>Hours</span><strong>{pharmacy.hours ?? 'Not set'}</strong></div>
                  <div className="meta-row"><span>Phone</span><strong>{pharmacy.phone ?? 'Not provided'}</strong></div>
                  <div className="meta-row"><span>Email</span><strong>{pharmacy.email ?? 'Not provided'}</strong></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'packages' && (
          <section className="section-stack">
            <SectionHeading
              kicker="Care packages"
              title="Available care packages"
              text="Choose the care level that fits your needs."
            />
            <div className="package-grid">
              {packages.map((pkg) => (
                <article className={activePackage?.id === pkg.id ? 'package-card selected' : 'package-card'} key={pkg.id}>
                  <div className="package-head">
                    <div>
                      <h3>{pkg.name}</h3>
                      <p>{pkg.description}</p>
                    </div>
                    <strong>{money(pkg.price)}</strong>
                  </div>
                  <ul className="check-list">
                    {(pkg.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  {activePackage?.id === pkg.id && <span className="selected-pill">Assigned to you</span>}
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'patients' && (
          <section className="section-stack">
            <SectionHeading
              kicker="Active patients"
              title="Patient list"
              text="View active patient accounts and assigned packages."
            />
            <div className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Care package</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.name}</td>
                      <td>{patient.email}</td>
                      <td>{patient.care_package?.name ?? 'Not assigned'}</td>
                      <td><span className="role-chip">{patient.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'roadmap' && (
          <section className="section-stack">
            <SectionHeading
              kicker="Future modules"
              title="Coming next"
              text="More helpful tools for booking, pharmacy search, and reminders."
            />
            <div className="card-grid">
              {roadmap.map((item) => (
                <article className="data-card feature-card" key={item.title}>
                  <span className="role-chip admin">{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => addActivity(`${item.title} workflow preview opened.`)}
                  >
                    Preview workflow
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
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
