import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const errorStyle = { color: 'var(--color-danger)', fontSize: '14px', margin: 0 };

const confirmGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
};

const questionStyle = { margin: 0, fontWeight: 600 };

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      await client.delete('/auth/account');
      logout();
      navigate('/');
    } catch (err) {
      setError(
        err && err.message ? err.message : 'Konto konnte nicht gelöscht werden.',
      );
      setDeleting(false);
    }
  }

  return (
    <section className="page">
      <h1>Konto</h1>

      <div className="card section-spacing">
        <p className="label">Angemeldet als</p>
        <p style={{ margin: 0 }}>{user ? user.email : ''}</p>
      </div>

      <div className="card">
        <h3>Konto löschen</h3>
        <p className="empty-state-text">
          Beim Löschen werden dein Konto und alle damit verknüpften Daten –
          Kleidungsstücke, Outfits und hochgeladene Bilder – dauerhaft entfernt.
          Dieser Vorgang kann nicht rückgängig gemacht werden.
        </p>

        {error && (
          <p style={errorStyle} role="alert">
            {error}
          </p>
        )}

        {confirming ? (
          <div style={confirmGroupStyle}>
            <p style={questionStyle}>
              Wirklich dein Konto und alle Daten löschen?
            </p>
            <button
              className="btn btn-danger"
              type="button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Löschen …' : 'Endgültig löschen'}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setConfirming(false);
                setError('');
              }}
              disabled={deleting}
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => setConfirming(true)}
          >
            Konto löschen
          </button>
        )}
      </div>
    </section>
  );
}
