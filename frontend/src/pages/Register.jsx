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

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/wardrobe');
    } catch (err) {
      setError(err && err.message ? err.message : 'Registrierung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Registrieren</h1>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="register-email">
            E-Mail
          </label>
          <input
            id="register-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="register-password">
            Passwort
          </label>
          <input
            id="register-password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="register-confirm">
            Passwort wiederholen
          </label>
          <input
            id="register-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={errorStyle} role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Registrieren …' : 'Registrieren'}
        </button>
      </form>

      <p style={switchStyle}>
        Schon ein Konto? <Link to="/login">Jetzt anmelden</Link>
      </p>
    </div>
  );
}
