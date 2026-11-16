import type { Place } from "@/lib/types";

export default function PlaceCard({ p }: { p: Place }) {
  const mapsUrl = p.gps_coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${p.gps_coordinates.latitude},${p.gps_coordinates.longitude}`
    : undefined;

  return (
    <article className="place">
      {p.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.thumbnail} alt={p.title} />
      )}
      <div>
        <h3>{p.title}</h3>
        {p.type && <p className="muted">{p.type}</p>}
        {p.rating !== undefined && (
          <p>
            ⭐ {p.rating}
            {p.reviews !== undefined && ` (${p.reviews})`}
            {p.price && ` · ${p.price}`}
          </p>
        )}
        {p.address && <p>{p.address}</p>}
        {p.open_state && <p className="muted">{p.open_state}</p>}
        {p.phone && <p className="muted">{p.phone}</p>}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            Buka di Google Maps
          </a>
        )}
      </div>
    </article>
  );
}