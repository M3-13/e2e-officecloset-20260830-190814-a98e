import { useCallback, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import ItemForm from '../components/ItemForm';
import '../styles/wardrobe.css';

export default function Wardrobe() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await client.get('/wardrobe/items');
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(error.message || 'Die Garderobe konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const seen = new Set();
    items.forEach((item) => {
      if (item.category) seen.add(item.category);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const visibleItems = useMemo(
    () => (activeCategory ? items.filter((item) => item.category === activeCategory) : items),
    [items, activeCategory],
  );

  function openCreate() {
    setEditingItem(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setFormOpen(false);
    setEditingItem(null);
    setFormError(null);
  }

  async function handleSubmit(formData) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingItem) {
        await client.patch(`/wardrobe/items/${editingItem.id}`, formData);
        setToast({ type: 'success', message: 'Kleidungsstück aktualisiert.' });
      } else {
        await client.post('/wardrobe/items', formData);
        setToast({ type: 'success', message: 'Kleidungsstück angelegt.' });
      }
      setFormOpen(false);
      setEditingItem(null);
      await loadItems();
    } catch (error) {
      setFormError(error.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/wardrobe/items/${deleteTarget.id}`);
      setToast({ type: 'success', message: 'Kleidungsstück gelöscht.' });
      setDeleteTarget(null);
      await loadItems();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Löschen fehlgeschlagen.' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="page wardrobe">
      <div className="wardrobe-header">
        <div>
          <h1>Garderobe</h1>
          {user && <p className="wardrobe-subtitle">Deine persönliche Garderobe</p>}
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Kleidungsstück hinzufügen
        </button>
      </div>

      {loading && <p className="wardrobe-status">Garderobe wird geladen …</p>}

      {!loading && loadError && (
        <div className="empty-state">
          <p className="empty-state-title">Ladefehler</p>
          <p className="empty-state-text">{loadError}</p>
          <button type="button" className="btn btn-secondary" onClick={loadItems}>
            Erneut versuchen
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {categories.length > 0 && (
            <div className="filter-chips" role="group" aria-label="Nach Kategorie filtern">
              <button
                type="button"
                className={`chip ${activeCategory === null ? 'chip-selected' : ''}`}
                onClick={() => setActiveCategory(null)}
              >
                Alle
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`chip ${activeCategory === category ? 'chip-selected' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {visibleItems.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">
                {items.length === 0
                  ? 'Noch keine Kleidungsstücke'
                  : 'Keine Treffer in dieser Kategorie'}
              </p>
              <p className="empty-state-text">
                {items.length === 0
                  ? 'Lege dein erstes Kleidungsstück an.'
                  : 'Wähle eine andere Kategorie oder lege ein neues Kleidungsstück an.'}
              </p>
              {items.length === 0 && (
                <button type="button" className="btn btn-secondary" onClick={openCreate}>
                  Erstes Kleidungsstück anlegen
                </button>
              )}
            </div>
          ) : (
            <div className="wardrobe-grid">
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {formOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingItem ? 'Kleidungsstück bearbeiten' : 'Kleidungsstück anlegen'}</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Schließen"
                onClick={closeForm}
              >
                ×
              </button>
            </div>
            <ItemForm
              initial={editingItem}
              error={formError}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Kleidungsstück löschen</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Schließen"
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>
            <p className="modal-text">
              Möchtest du „{deleteTarget.name}“ wirklich löschen? Das kann nicht rückgängig
              gemacht werden.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Löschen …' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </section>
  );
}
