import { useCallback, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import OutfitBuilder, { ItemThumb } from '../components/OutfitBuilder';

// Outfit-specific styles are scoped to this ticket and injected here so the
// page and its builder stay self-contained (the shared stylesheet is owned by
// the frontend-skeleton ticket). Tokens resolve against the skeleton's :root.
const OUTFIT_CSS = `
.page-subtitle {
  color: var(--color-muted);
  margin-top: calc(-1 * var(--space-2));
  margin-bottom: var(--space-5);
}

.banner {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  font-size: 14px;
}

.banner-error {
  background: rgba(224, 108, 91, 0.12);
  border: 1px solid var(--color-danger);
  color: var(--color-danger_hover);
}

.banner-success {
  background: rgba(127, 181, 139, 0.12);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.builder {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 560px;
}

.builder-name-field {
  flex: 1;
}

.builder-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  gap: var(--space-1);
  min-height: 48px;
}

.preview-empty {
  color: var(--color-muted);
  font-size: 14px;
  padding: var(--space-2) 0;
  margin: 0;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .item-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .item-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.item-tile {
  position: relative;
  background: var(--color-surface_raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: left;
  font-family: var(--font_family);
  transition: border-color 160ms ease, background-color 160ms ease;
}

.item-tile:hover {
  border-color: var(--color-accent);
}

.item-tile-selected {
  border-color: var(--color-accent);
  background: rgba(212, 175, 55, 0.14);
}

.item-tile-check {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  z-index: 1;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: #161110;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.item-tile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-tile-category {
  font-size: 12px;
  color: var(--color-muted);
}

.item-thumb {
  position: relative;
  width: 48px;
  height: 48px;
  background: #0f0c0b;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  flex-shrink: 0;
}

.item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-thumb-fluid {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
}

.outfit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .outfit-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .outfit-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.outfit-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.outfit-card-preview {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  gap: var(--space-1);
  min-height: 48px;
}

.outfit-card-name {
  font-family: var(--display_font_family);
  font-size: 20px;
  color: var(--color-fg);
  word-break: break-word;
}

.outfit-card-meta {
  font-size: 12px;
  color: var(--color-muted);
}

.outfit-card-actions {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-top: auto;
}

.btn-sm {
  min-height: 36px;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-fg);
  font-family: var(--font_family);
}

.btn-sm:hover {
  background: var(--color-surface_raised);
  border-color: var(--color-accent);
}

.btn-sm-danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.btn-sm-danger:hover {
  background: rgba(224, 108, 91, 0.12);
  border-color: var(--color-danger);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-3);
}

.modal-panel {
  background: var(--color-surface_raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  max-width: 480px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.modal-panel-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.modal-header h3 {
  margin: 0;
  font-size: 28px;
}

.modal-close {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-fg);
}

.modal-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.modal-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.modal-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-fg);
}

.modal-item-meta {
  font-size: 12px;
  color: var(--color-muted);
}

.modal-message {
  font-size: 14px;
  color: var(--color-fg);
  margin-bottom: var(--space-4);
}

.modal-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
`;

function OutfitModal({ outfit, itemById, onClose, onEdit, onDelete, deleting }) {
  const items = outfit.item_ids.map((id) => itemById.get(id)).filter(Boolean);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <h3>{outfit.name}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <p className="empty-state-text">
            Dieses Outfit enthält keine Kleidungsstücke.
          </p>
        ) : (
          <div className="modal-items">
            {items.map((item) => (
              <div key={item.id} className="modal-item">
                <ItemThumb item={item} />
                <div>
                  <div className="modal-item-name">{item.name}</div>
                  <div className="modal-item-meta">{item.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            Bearbeiten
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? 'Lösche …' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, deleting, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel modal-panel-sm">
        <h3>{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Lösche …' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Outfits() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const itemById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, outfitsData] = await Promise.all([
        client.get('/wardrobe/items'),
        client.get('/outfits'),
      ]);
      setItems(itemsData);
      setOutfits(outfitsData);
    } catch (err) {
      setError(err.message || 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(name, itemIds) {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      if (editing) {
        const updated = await client.patch(`/outfits/${editing.id}`, {
          name,
          item_ids: itemIds,
        });
        setOutfits((prev) =>
          prev.map((outfit) => (outfit.id === updated.id ? updated : outfit)),
        );
        setEditing(null);
        setFeedback('Outfit aktualisiert.');
      } else {
        const created = await client.post('/outfits', { name, item_ids: itemIds });
        setOutfits((prev) => [created, ...prev]);
        setFeedback('Outfit gespeichert.');
      }
    } catch (err) {
      setError(err.message || 'Outfit konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    setFeedback(null);
    try {
      await client.delete(`/outfits/${deleteTarget.id}`);
      setOutfits((prev) =>
        prev.filter((outfit) => outfit.id !== deleteTarget.id),
      );
      setViewing((current) =>
        current && current.id === deleteTarget.id ? null : current,
      );
      setEditing((current) =>
        current && current.id === deleteTarget.id ? null : current,
      );
      setDeleteTarget(null);
      setFeedback('Outfit gelöscht.');
    } catch (err) {
      setError(err.message || 'Outfit konnte nicht gelöscht werden.');
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(outfit) {
    setViewing(null);
    setEditing(outfit);
    setFeedback(null);
  }

  return (
    <section className="page">
      <style>{OUTFIT_CSS}</style>
      <h1>Outfits</h1>
      <p className="page-subtitle">
        Kombiniere deine Kleidungsstücke zu glamourösen Outfits.
      </p>

      {error && <div className="banner banner-error">{error}</div>}
      {feedback && <div className="banner banner-success">{feedback}</div>}

      <section className="section-spacing">
        <h2>{editing ? 'Outfit bearbeiten' : 'Neues Outfit erstellen'}</h2>
        {loading ? (
          <p className="empty-state-text">Lade Garderobe …</p>
        ) : (
          <OutfitBuilder
            key={editing ? editing.id : 'new'}
            items={items}
            initial={editing}
            saving={saving}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </section>

      <section>
        <h2>Deine Outfits</h2>
        {loading ? (
          <p className="empty-state-text">Lade Outfits …</p>
        ) : outfits.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Noch keine Outfits</p>
            <p className="empty-state-text">
              Stelle oben dein erstes Outfit zusammen – es erscheint dann hier
              in deiner Liste.
            </p>
          </div>
        ) : (
          <div className="outfit-grid">
            {outfits.map((outfit) => {
              const outfitItems = outfit.item_ids
                .map((id) => itemById.get(id))
                .filter(Boolean);
              return (
                <div key={outfit.id} className="outfit-card">
                  <div className="outfit-card-preview">
                    {outfitItems.slice(0, 3).map((item) => (
                      <ItemThumb key={item.id} item={item} />
                    ))}
                  </div>
                  <div className="outfit-card-name">{outfit.name}</div>
                  <div className="outfit-card-meta">
                    {outfitItems.length} Kleidungsstück
                    {outfitItems.length === 1 ? '' : 'e'}
                  </div>
                  <div className="outfit-card-actions">
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => setViewing(outfit)}
                    >
                      Öffnen
                    </button>
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => handleEdit(outfit)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-sm-danger"
                      onClick={() => setDeleteTarget(outfit)}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {viewing && (
        <OutfitModal
          outfit={viewing}
          itemById={itemById}
          onClose={() => setViewing(null)}
          onEdit={() => handleEdit(viewing)}
          onDelete={() => {
            setDeleteTarget(viewing);
            setViewing(null);
          }}
          deleting={deleting}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Outfit löschen"
          message={`Möchtest du „${deleteTarget.name}" wirklich löschen?`}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}
