export default function ItemCard({ item, onEdit, onDelete }) {
  return (
    <article className="card item-card">
      <div className="item-thumb">
        {item.image_url ? (
          <img className="item-thumb-img" src={item.image_url} alt={item.name} />
        ) : (
          <div className="item-thumb-placeholder" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5a2 2 0 1 1 2 2" />
              <path d="M7 20h10" />
              <path d="M8 8 6.5 20" />
              <path d="M16 8 17.5 20" />
            </svg>
          </div>
        )}
      </div>
      <div className="item-card-body">
        <h3 className="item-card-name">{item.name}</h3>
        <div className="item-card-meta">
          <span className="chip chip-static">{item.category}</span>
          {item.color && <span className="item-meta-text">{item.color}</span>}
          {item.season && <span className="item-meta-text">{item.season}</span>}
        </div>
      </div>
      <div className="item-card-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(item)}>
          Bearbeiten
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>
          Löschen
        </button>
      </div>
    </article>
  );
}
