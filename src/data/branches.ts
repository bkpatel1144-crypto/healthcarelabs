/**
 * The seven Healthcare Labs collection centres.
 *
 * Transcribed verbatim from the list the lab supplied. Nothing here is
 * inferred: where a branch has no published landline, `phones` simply has one
 * entry, and where the lab gave no pin code the address ends without one.
 *
 * `mapUrl` is the exact link the lab published for that branch — a short link,
 * a plus-code link or a coordinate link, whichever they sent. It is what the
 * "Directions" button opens, so a visitor always lands on the pin the lab
 * itself chose.
 *
 * `coords` is the pin the lab itself published, never a geocode. Two of their
 * links carried a latitude and longitude outright; four more were short links
 * that resolve to a Google place, and the coordinate was read out of the
 * resolved place rather than out of a search for the lab's name.
 *
 * Sachin has no coordinate and that is deliberate. Its link is a Google search
 * URL rather than a map place, and it does not resolve to one. Resolving the
 * landmark in its address instead put it about thirteen kilometres from Sachin,
 * so nothing was written down. A branch without a pin is listed and routed to
 * by its own Directions link; a branch with the wrong pin sends someone to the
 * wrong part of the city.
 */

export interface Branch {
  id: string;
  /** Short name as the lab refers to it — "Katargam", "Yogi Chowk". */
  name: string;
  /** True for the registered head office. */
  head?: boolean;
  address: string;
  /** Every number the lab published for this branch, in their order. */
  phones: string[];
  /** Landline, where the lab published one separately from the mobiles. */
  landline?: string;
  /** The lab's own map link for this branch. */
  mapUrl: string;
  /** Latitude and longitude, only where the lab's link contained them. */
  coords?: { lat: number; lng: number };
}

export const BRANCHES: Branch[] = [
  {
    id: 'utran',
    name: 'Utran',
    head: true,
    address:
      '123-223-224, 1st Floor, Royal Square, Near Indian Oil Petrol Pump, VIP Circle, Utran, Mota Varachha, Surat - 394105',
    phones: ['9925094247', '9925088847'],
    landline: '0261-3522858',
    mapUrl: 'https://g.page/r/CTqv6i7O2GPiEAE',
    /* Resolves to the "Healthcare Labs Surat" place. */
    coords: { lat: 21.2333619, lng: 72.8642307 },
  },
  {
    id: 'katargam',
    name: 'Katargam',
    address: '204, 2nd Floor, Pragati Elite, Dabholi Char Rasta, Katargam, Surat',
    phones: ['8733016030'],
    mapUrl: 'https://maps.google.com/?q=21.230827,72.821083',
    coords: { lat: 21.230827, lng: 72.821083 },
  },
  {
    id: 'hirabaug',
    name: 'Hirabaug',
    address:
      '2nd Floor, Jeewandeep Complex, Above Sukhas Jewellers, Hira Baug Circle, Varachha Main Road, Surat - 395006',
    phones: ['9925094247', '9316664367'],
    landline: '0261-3522858',
    mapUrl: 'https://maps.google.com/?q=21.215950,72.862526',
    coords: { lat: 21.21595, lng: 72.862526 },
  },
  {
    id: 'vip-circle',
    name: 'VIP Circle',
    address: '805, 8th Floor, Navkar Bastion, VIP Circle, Utran, Surat - 394105',
    phones: [],
    mapUrl: 'https://maps.app.goo.gl/2y4Ph8Xg4MzjrHH49',
    /* Resolves to the "Healthcare Labs VIP Circle" place. */
    coords: { lat: 21.2314069, lng: 72.8665803 },
  },
  {
    id: 'parvat-patiya',
    name: 'Parvat Patiya',
    address:
      'G-37, Ground Floor, La Citadel Complex, Kangaroo Circle, Near CNG Pump, Parvat Patiya, Surat - 395010',
    phones: ['8511009400'],
    mapUrl: 'https://maps.app.goo.gl/eRhfrrQXLeCYrHfh8',
    /* Resolves to the "LA Citadel Complex" place named in the address. */
    coords: { lat: 21.1906087, lng: 72.869018 },
  },
  {
    id: 'sachin',
    name: 'Sachin',
    address: '1st Floor, Samarpan Hospital, Near Khetla Aapa, Sachin Navsari Road, Sachin, Surat',
    phones: ['9664911143'],
    /*
      A Google search link, not a map place — it does not resolve to a pin, so
      this branch has no coordinate and no marker. Send a dropped pin for it and
      it joins the others.
    */
    mapUrl: 'https://share.google/LMQ8qigWE8tt9Dkcd',
  },
  {
    id: 'yogi-chowk',
    name: 'Yogi Chowk',
    address: 'F-150, Apple Square, Near Swastik Plaza, Yogi Chowk, Surat - 395010',
    /*
      The lab supplied "990903640 / 9979651035". The first is nine digits, and
      an Indian mobile number is ten, so it is almost certainly missing one.
      Only the number that can actually be dialled is published here — a
      tel: link that cannot connect is worse than no link.
    */
    phones: ['9979651035'],
    mapUrl: 'https://maps.app.goo.gl/uLJ84w65byGE35ct5',
    /* Resolves to the "HEALTHCARE LABS" place at Yogi Chowk. */
    coords: { lat: 21.21359, lng: 72.8856566 },
  },
];

export const HEAD_OFFICE = BRANCHES.find((b) => b.head) ?? BRANCHES[0];

/** Strips separators so a published number can be used in a tel: link. */
export const branchTelHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Formats a ten-digit mobile as +91 XXXXX XXXXX; leaves landlines alone. */
export function formatBranchPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

/**
 * What the embedded map should be queried with.
 *
 * Coordinates where the lab published a pin, the street address otherwise.
 * Never a guessed coordinate.
 */
export function branchMapQuery(branch: Branch): string {
  return branch.coords ? `${branch.coords.lat},${branch.coords.lng}` : branch.address;
}

/** The branches that can be drawn on a map, in listed order. */
export const MAPPED_BRANCHES = BRANCHES.filter(
  (b): b is Branch & { coords: NonNullable<Branch['coords']> } => b.coords !== undefined,
);
