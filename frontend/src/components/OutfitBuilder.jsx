import { useState } from 'react';

function HangerPlaceholder() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5a2 2 0 1 1 2 2" />
      <path d="M12 7v1.5" />
      <path d="M3.5 20 8 11h8l4.5 9" />
    </svg>
  );
}

export function ItemThumb({ item, className = '' }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`item-thumb ${className}`}>
      {item.image_url && !failed ? (
        <img src={item.image_url} alt={item.name} onError={() => setFailed(true)} />
      ) : (
        <HangerPlaceholder />
      )}
    </div>
  );
}

export default function OutfitBuilder({ items, initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initial ? initial.item_ids : []),
  );

  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  function toggleItem(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || selectedItems.length === 0 || saving) {
      return;
    }
    onSave(trimmed, [...selectedIds]);
  }

  return (
    <form className="builder" onSubmit={handleSubmit}>
      <div className="builder-name-row">
        <div className="builder-name-field">
          <label className="label" htmlFor="outfit-name">
            Name des Outfits
          </label>
          <input
            id="outfit-name"
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Roter Teppich"
            maxLength={120}
          />
        </div>
      </div>

      <h3>Vorschau</h3>
      {selectedItems.length === 0 ? (
        <p className="preview-empty">
          Wähle Kleidungsstücke aus, um eine Vorschau zu sehen.
        </p>
      ) : (
        <div className="preview-grid">
          {selectedItems.map((item) => (
            <ItemThumb key={item.id} item={item} />
          ))}
        </div>
      )}

      <h3>Kleidungsstücke auswählen</h3>
      {items.length === 0 ? (
        <p className="preview-empty">
          Du hast noch keine Kleidungsstücke. Lege zuerst welche in deiner
          Garderobe an.
        </p>
      ) : (
        <div className="item-grid">
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={`item-tile${selected ? ' item-tile-selected' : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-pressed={selected}
              >
                {selected && (
                  <span className="item-tile-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                <ItemThumb item={item} className="item-thumb-fluid" />
                <span className="item-tile-name">{item.name}</span>
                <span className="item-tile-category">{item.category}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="builder-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || selectedItems.length === 0 || saving}
        >
          {saving
            ? 'Speichere …'
            : initial
              ? 'Änderungen speichern'
              : 'Outfit speichern'}
        </button>
        {initial && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
