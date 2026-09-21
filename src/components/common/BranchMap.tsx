import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { MAPPED_BRANCHES } from '@/data/branches';

/**
 * Every collection centre on one map, with no API key.
 *
 * The Google embed this replaces takes a single `q=` and can only ever show one
 * place, which is why the map used to follow whichever branch was selected
 * instead of showing them all. Putting every pin up at once through Google
 * needs either the Maps JavaScript API — a billable key, checked into a static
 * site — or a My Maps the lab builds by hand. Leaflet over OpenStreetMap tiles
 * needs neither and draws as many markers as we have.
 *
 * Every coordinate here is one the lab published. Directions still open the
 * lab's own Google link, so anyone actually travelling is handed off to the
 * navigation they already use.
 *
 * Leaflet is imported dynamically and only once the band is near the viewport,
 * so it stays out of the main bundle and off the critical path.
 */
export function BranchMap({
  activeId,
  onSelect,
  load,
  className,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  /** Withheld until the band is near the viewport. */
  load: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  // Read inside the effect so selecting a branch does not tear the map down.
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!load || mapRef.current || !hostRef.current) return;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !hostRef.current || mapRef.current) return;

      const map = L.map(hostRef.current, {
        scrollWheelZoom: false, // a map that eats the page scroll is a trap
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      for (const branch of MAPPED_BRANCHES) {
        const marker = L.marker([branch.coords.lat, branch.coords.lng], {
          icon: pin(L, branch.head === true),
          title: `Healthcare Labs ${branch.name}`,
          alt: `Healthcare Labs ${branch.name}`,
          keyboard: true,
        }).addTo(map);

        marker.bindPopup(
          `<strong>Healthcare Labs ${escapeHtml(branch.name)}</strong><br>${escapeHtml(branch.address)}`,
        );
        marker.on('click', () => selectRef.current(branch.id));
        markersRef.current[branch.id] = marker;
      }

      // Open on everything, not on one branch — that is the whole point.
      map.fitBounds(
        MAPPED_BRANCHES.map((b) => [b.coords.lat, b.coords.lng] as [number, number]),
        { padding: [48, 48], maxZoom: 14 },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  // Selecting in the list moves the map to that pin and opens its label.
  useEffect(() => {
    const marker = markersRef.current[activeId];
    const map = mapRef.current;
    if (!marker || !map) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
  }, [activeId]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    },
    [],
  );

  return (
    <div
      ref={hostRef}
      className={className}
      role="application"
      aria-label={`Map of all ${MAPPED_BRANCHES.length} Healthcare Labs collection centres in Surat`}
    />
  );
}

/**
 * A brand pin rather than Leaflet's default blue teardrop, which ships as a
 * PNG that Vite would have to be told how to resolve anyway. The head office
 * gets the filled mark so it is findable among the rest.
 */
function pin(L: typeof import('leaflet'), head: boolean) {
  const fill = head ? '#0F7AAC' : '#159BD3';
  return L.divIcon({
    className: 'hcl-pin',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 39C15 39 28 24.5 28 15A13 13 0 1 0 2 15c0 9.5 13 24 13 24Z"
        fill="${fill}" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="15" cy="15" r="5.2" fill="#ffffff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 39],
    popupAnchor: [0, -34],
  });
}

/** The addresses are ours, but they go into innerHTML, so they get escaped. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
