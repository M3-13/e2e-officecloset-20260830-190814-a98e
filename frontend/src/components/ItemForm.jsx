import { useState } from 'react';

export const CATEGORIES = [
  'Oberteil',
  'Hose',
  'Kleid',
  'Rock',
  'Jacke',
  'Mantel',
  'Schuhe',
  'Accessoire',
];

export const SEASONS = ['Frühling', 'Sommer', 'Herbst', 'Winter'];

export default function ItemForm({
  initial = null,
  error = null,
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [category, setCategory] = useState(initial ? initial.category : '');
  const [color, setColor] = useState(initial && initial.color ? initial.color : '');
  const [season, setSeason] = useState(initial && initial.season ? initial.season : '');
  const [image, setImage] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('category', category);
    if (color.trim()) formData.append('color', color.trim());
    if (season) formData.append('season', season);
    if (image) formData.append('image', image);
    onSubmit(formData);
  }

  const canSubmit = name.trim().length > 0 && category.length > 0 && !submitting;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="item-name">
          Name
        </label>
        <input
          id="item-name"
          className="input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Rote Abendjacke"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="item-category">
          Kategorie
        </label>
        <select
          id="item-category"
          className="input"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>
            Kategorie wählen
          </option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="item-color">
          Farbe
        </label>
        <input
          id="item-color"
          className="input"
          type="text"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          placeholder="z. B. Bordeaux"
        />
      </div>

      <div>
        <label className="label" htmlFor="item-season">
          Saison
        </label>
        <select
          id="item-season"
          className="input"
          value={season}
          onChange={(event) => setSeason(event.target.value)}
        >
          <option value="">Keine Angabe</option>
          {SEASONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="item-image">
          Bild
        </label>
        <input
          id="item-image"
          className="input"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(event) => setImage(event.target.files && event.target.files[0])}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting ? 'Speichern …' : initial ? 'Speichern' : 'Anlegen'}
        </button>
      </div>
    </form>
  );
}
