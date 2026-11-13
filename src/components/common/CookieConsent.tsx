import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, Check } from 'lucide-react';
import { CONSENT_VERSION, readConsent, saveConsent } from '@/lib/consent';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * The consent notice.
 *
 * Written to the shape the DPDP Rules 2025 ask for rather than the shape most
 * banners take:
 *
 *   Nothing optional is pre-ticked. Consent has to be an affirmative act, and
 *   a switch already on is not one.
 *
 *   "Reject all" sits beside "Accept all", same size, same prominence. A
 *   reject buried inside a "manage preferences" sub-panel makes refusing cost
 *   more than agreeing, which is not free consent.
 *
 *   It says what each category is actually for, in the visitor's language.
 *   Gujarati and Hindi are both in the Eighth Schedule, and this is a Surat
 *   lab — an English-only notice would not be informed consent for a good
 *   share of the people reading it.
 *
 *   It can be reopened and changed from the footer at any time, because
 *   consent that cannot be withdrawn is not consent.
 *
 * It is a notice, not a wall. There is no overlay trapping the page behind it:
 * someone who wants to read about a test before deciding about analytics
 * should be able to.
 */

type Lang = 'en' | 'gu' | 'hi';

const COPY: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Your privacy',
    body: 'We use a small amount of storage to keep this site working — your login, your language and what you have saved. Nothing else is switched on unless you say so.',
    necessary: 'Essential',
    necessaryNote: 'Keeps you signed in and remembers your settings. Cannot be turned off.',
    analytics: 'Analytics',
    analyticsNote: 'Would let us count visits and see which pages help, with no attempt to identify you.',
    marketing: 'Marketing',
    marketingNote: 'Would let us show you offers based on what you looked at.',
    accept: 'Accept all',
    reject: 'Reject all',
    manage: 'Choose',
    save: 'Save my choice',
    policy: 'Privacy policy',
    notUsedYet: 'Not in use today — this switch decides what happens if it ever is.',
  },
  gu: {
    title: 'તમારી ગોપનીયતા',
    body: 'આ સાઇટ ચાલુ રાખવા માટે થોડી માહિતી સાચવીએ છીએ — તમારું લૉગિન, ભાષા અને તમે સાચવેલું. બીજું કશું તમારી મંજૂરી વિના ચાલુ થતું નથી.',
    necessary: 'જરૂરી',
    necessaryNote: 'તમને લૉગિન રાખે છે અને સેટિંગ યાદ રાખે છે. બંધ કરી શકાતું નથી.',
    analytics: 'એનાલિટિક્સ',
    analyticsNote: 'મુલાકાત ગણવા અને કયાં પાનાં ઉપયોગી છે તે જોવા — તમારી ઓળખ કર્યા વગર.',
    marketing: 'માર્કેટિંગ',
    marketingNote: 'તમે જે જોયું તેના આધારે ઓફર બતાવવા માટે.',
    accept: 'બધું સ્વીકારો',
    reject: 'બધું નકારો',
    manage: 'પસંદ કરો',
    save: 'મારી પસંદ સાચવો',
    policy: 'ગોપનીયતા નીતિ',
    notUsedYet: 'આજે વપરાતું નથી — આ સ્વિચ ભવિષ્ય માટે છે.',
  },
  hi: {
    title: 'आपकी निजता',
    body: 'यह साइट चलाने के लिए हम थोड़ी जानकारी सहेजते हैं — आपका लॉगिन, भाषा और आपने जो सहेजा है। इसके अलावा कुछ भी आपकी अनुमति के बिना चालू नहीं होता।',
    necessary: 'ज़रूरी',
    necessaryNote: 'आपको लॉगिन रखता है और सेटिंग याद रखता है। बंद नहीं किया जा सकता।',
    analytics: 'एनालिटिक्स',
    analyticsNote: 'विज़िट गिनने और यह देखने के लिए कि कौन से पेज काम आते हैं — आपकी पहचान किए बिना।',
    marketing: 'मार्केटिंग',
    marketingNote: 'आपने जो देखा उसके आधार पर ऑफ़र दिखाने के लिए।',
    accept: 'सब स्वीकारें',
    reject: 'सब अस्वीकारें',
    manage: 'चुनें',
    save: 'मेरी पसंद सहेजें',
    policy: 'निजता नीति',
    notUsedYet: 'आज उपयोग में नहीं — यह स्विच भविष्य के लिए है।',
  },
};

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'gu', label: 'ગુજરાતી' },
  { id: 'hi', label: 'हिन्दी' },
];

export function CookieConsent() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [choice, setChoice] = useState({ analytics: false, marketing: false });

  const t = COPY[lang];

  useEffect(() => {
    // Ask only when there is no decision on this version of the categories.
    if (!readConsent()) setOpen(true);

    // The footer link reopens it; see ConsentSettingsLink below.
    const reopen = () => {
      const current = readConsent();
      setChoice({
        analytics: current?.analytics ?? false,
        marketing: current?.marketing ?? false,
      });
      setDetail(true);
      setOpen(true);
    };
    window.addEventListener('hcl:open-consent', reopen);
    return () => window.removeEventListener('hcl:open-consent', reopen);
  }, []);

  const decide = useCallback((analytics: boolean, marketing: boolean) => {
    saveConsent({ analytics, marketing });
    setOpen(false);
    setDetail(false);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="consent-heading"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        /*
          z-[65] clears the header (50) and the assistant (55) but stays under
          the mobile navigation drawer (60)… except the drawer is a full
          takeover, so this sits above it deliberately: a notice the visitor
          cannot reach from behind an open menu is a notice they cannot act on.
        */
        className="fixed inset-x-0 bottom-0 z-[65] p-3 sm:p-5"
      >
        <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-5 shadow-liftLg ring-1 ring-ink-line sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Cookie className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="consent-heading" className="text-[16px] font-bold text-ink">
                  {t.title}
                </h2>
                <div className="flex gap-1">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLang(l.id)}
                      aria-pressed={lang === l.id}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                        lang === l.id ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-mist',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{t.body}</p>

              {detail && (
                <ul className="mt-4 space-y-2.5">
                  <Row
                    title={t.necessary}
                    note={t.necessaryNote}
                    checked
                    locked
                    onChange={() => {}}
                  />
                  <Row
                    title={t.analytics}
                    note={`${t.analyticsNote} ${t.notUsedYet}`}
                    checked={choice.analytics}
                    onChange={(v) => setChoice((c) => ({ ...c, analytics: v }))}
                  />
                  <Row
                    title={t.marketing}
                    note={`${t.marketingNote} ${t.notUsedYet}`}
                    checked={choice.marketing}
                    onChange={(v) => setChoice((c) => ({ ...c, marketing: v }))}
                  />
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {/*
                  Reject sits beside Accept, same weight. Making refusal cost
                  an extra tap is the commonest way a banner stops being free
                  consent.
                */}
                <button
                  type="button"
                  onClick={() => decide(true, true)}
                  className="h-10 flex-1 min-w-[120px] rounded-xl bg-brand-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {t.accept}
                </button>
                <button
                  type="button"
                  onClick={() => decide(false, false)}
                  className="h-10 flex-1 min-w-[120px] rounded-xl bg-mist px-4 text-[13.5px] font-semibold text-ink ring-1 ring-ink-line transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {t.reject}
                </button>
                {detail ? (
                  <button
                    type="button"
                    onClick={() => decide(choice.analytics, choice.marketing)}
                    className="h-10 flex-1 min-w-[120px] rounded-xl bg-white px-4 text-[13.5px] font-semibold text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {t.save}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetail(true)}
                    className="h-10 rounded-xl px-4 text-[13.5px] font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {t.manage}
                  </button>
                )}
              </div>

              <p className="mt-3 text-[12px] text-ink-soft">
                <Link to="/privacy-policy" className="font-semibold text-brand-600 hover:underline">
                  {t.policy}
                </Link>
                <span className="ml-2 font-mono text-[11px] text-ink-soft/70">v{CONSENT_VERSION}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function Row({
  title,
  note,
  checked,
  locked = false,
  onChange,
}: {
  title: string;
  note: string;
  checked: boolean;
  locked?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-mist p-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={locked}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          checked ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-ink-line',
          locked && 'opacity-60',
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
      </button>
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{note}</p>
      </div>
    </li>
  );
}

/** Reopens the notice. Belongs in the footer, beside the privacy policy. */
export function ConsentSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('hcl:open-consent'))}
      className={className}
    >
      Cookie settings
    </button>
  );
}
