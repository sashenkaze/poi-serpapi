import type { Loc } from "@/lib/types";

export default function MapPreview({ loc }: { loc: Loc }) {
  const d = 0.008;
  const bbox = [loc.lng - d, loc.lat - d, loc.lng + d, loc.lat + d].join(",");
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${loc.lat},${loc.lng}`;

  return (
    <div className="map-wrap">
      <iframe src={src} title="Preview peta" loading="lazy" />
      <p className="hint">{loc.label}</p>
      <p className="hint">
        Preview peta bersifat tampilan saja, bukan peta interaktif.
      </p>
    </div>
  );
}