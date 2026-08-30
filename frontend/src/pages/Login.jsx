import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const errorStyle = { color: 'var(--color-danger)', fontSize: '14px', margin: 0 };

const switchStyle = {
  marginTop: 'var(--space-4)',
  fontSize: '14px',
  color: 'var(--color-muted)',
  textAlign: 'center',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/wardrobe');
    } catch (err) {
      setError(err && err.message ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Anmelden</h1>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="login-email">
            E-Mail
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="login-password">
            Passwort
          </label>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={errorStyle} role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>

      <p style={switchStyle}>
        Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
      </p>
    </div>
  );
}
