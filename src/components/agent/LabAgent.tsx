import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Phone, Send, Sparkles, X } from 'lucide-react';
import { AGENT_SYSTEM_PROMPT } from '@/data/agentKnowledge';
import { assistantConfigured, chat } from '@/lib/assistant';
import type { ChatMessage } from '@/lib/assistant';
import { useContent } from '@/store/content';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SITE_CONFIG, telHref } from '@/config/site';
import { cn } from '@/lib/cn';

/**
 * The site assistant, in place of the WhatsApp button that used to sit here.
 *
 * It answers questions about tests, packages, preparation, centres and
 * opening hours in English, Gujarati or Hindi, from a knowledge digest built
 * out of the same data the pages render. What it will not do is read anybody's
 * results — the limits are set in AGENT_SYSTEM_PROMPT and the first one is
 * that it is not a doctor.
 *
 * Two deliberate design decisions, both about not lying to a patient:
 *
 * Lead capture is a form, not a parse. The assistant asks for a name, mobile
 * and area conversationally, but what gets *saved* comes from three real
 * inputs the visitor fills and submits. Scraping a name out of free text would
 * file half the leads wrong and the visitor would never know which half.
 *
 * Nothing here promises a callback. Contact details are stored in this
 * browser's localStorage, exactly as the contact form does — this site has no
 * backend, so nothing reaches the lab on its own. Saying "we will call you"
 * would be a straightforward lie to someone who might be waiting on it, so the
 * panel says what actually happens and puts the lab's number in front of them.
 */

type Lang = 'en' | 'gu' | 'hi';

interface Line {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
  { id: 'hi', label: 'हिन्दी', short: 'हि' },
];

const COPY: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Ask Healthcare Labs',
    subtitle: 'Tests, packages, timings and centres',
    greeting:
      'Hello. I can explain what a test or package covers, what it costs and how to prepare for it. What would you like to know?',
    placeholder: 'Type your question…',
    send: 'Send',
    thinking: 'Thinking…',
    close: 'Close assistant',
    open: 'Ask Healthcare Labs',
    error: 'Sorry — I could not reach the assistant. Please call the lab.',
    notDoctor: 'Not medical advice. A doctor must read your report.',
    detailsTitle: 'Leave your details',
    detailsNote: 'Saved in this browser only — this site has no server, so please call the lab as well.',
    name: 'Your name',
    mobile: 'Mobile number',
    area: 'Area in Surat',
    save: 'Save my details',
    saved: 'Noted. Nothing is sent automatically, so please call the lab to confirm.',
    callUs: 'Call the lab',
    invalidPhone: 'Enter a valid 10-digit mobile number.',
    needName: 'Please add your name.',
  },
  gu: {
    title: 'હેલ્થકેર લેબ્સને પૂછો',
    subtitle: 'ટેસ્ટ, પેકેજ, સમય અને કેન્દ્રો',
    greeting:
      'નમસ્તે. કયા ટેસ્ટ કે પેકેજમાં શું આવે છે, તેની કિંમત કેટલી છે અને તૈયારી કેવી રીતે કરવી — એ હું સમજાવી શકું. તમારે શું જાણવું છે?',
    placeholder: 'તમારો પ્રશ્ન લખો…',
    send: 'મોકલો',
    thinking: 'વિચારી રહ્યું છે…',
    close: 'બંધ કરો',
    open: 'હેલ્થકેર લેબ્સને પૂછો',
    error: 'માફ કરશો — જવાબ મળી શક્યો નહીં. કૃપા કરીને લેબને ફોન કરો.',
    notDoctor: 'આ તબીબી સલાહ નથી. રિપોર્ટ ડૉક્ટરે જ વાંચવો જોઈએ.',
    detailsTitle: 'તમારી વિગતો આપો',
    detailsNote: 'આ ફક્ત આ બ્રાઉઝરમાં સચવાય છે — સાઇટ પર સર્વર નથી, તેથી લેબને ફોન પણ કરો.',
    name: 'તમારું નામ',
    mobile: 'મોબાઇલ નંબર',
    area: 'સુરતમાં વિસ્તાર',
    save: 'વિગતો સાચવો',
    saved: 'નોંધી લીધું. આ આપોઆપ મોકલાતું નથી, તેથી કૃપા કરીને લેબને ફોન કરો.',
    callUs: 'લેબને ફોન કરો',
    invalidPhone: '૧૦ અંકનો સાચો મોબાઇલ નંબર લખો.',
    needName: 'કૃપા કરીને તમારું નામ લખો.',
  },
  hi: {
    title: 'हेल्थकेयर लैब्स से पूछें',
    subtitle: 'टेस्ट, पैकेज, समय और केंद्र',
    greeting:
      'नमस्ते। किस टेस्ट या पैकेज में क्या आता है, कीमत कितनी है और तैयारी कैसे करनी है — यह मैं बता सकता हूँ। आप क्या जानना चाहेंगे?',
    placeholder: 'अपना सवाल लिखें…',
    send: 'भेजें',
    thinking: 'सोच रहा है…',
    close: 'बंद करें',
    open: 'हेल्थकेयर लैब्स से पूछें',
    error: 'क्षमा करें — जवाब नहीं मिल सका। कृपया लैब को फ़ोन करें।',
    notDoctor: 'यह चिकित्सकीय सलाह नहीं है। रिपोर्ट डॉक्टर ही पढ़ें।',
    detailsTitle: 'अपनी जानकारी दें',
    detailsNote: 'यह केवल इसी ब्राउज़र में सेव होती है — साइट पर सर्वर नहीं है, इसलिए लैब को फ़ोन भी करें।',
    name: 'आपका नाम',
    mobile: 'मोबाइल नंबर',
    area: 'सूरत में क्षेत्र',
    save: 'जानकारी सेव करें',
    saved: 'दर्ज कर लिया। यह अपने आप नहीं भेजा जाता, इसलिए कृपया लैब को फ़ोन करें।',
    callUs: 'लैब को फ़ोन करें',
    invalidPhone: '10 अंकों का सही मोबाइल नंबर लिखें।',
    needName: 'कृपया अपना नाम लिखें।',
  },
};

/** Named for the model, which does better with a language than a code. */
const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  gu: 'Gujarati (ગુજરાતી)',
  hi: 'Hindi (हिन्दी)',
};

/** Indian mobile numbers start 6–9 and run ten digits. */
const MOBILE_RE = /^[6-9]\d{9}$/;

/** Which script the visitor typed in, so the panel can follow them. */
function detectLang(text: string): Lang | null {
  if (/[઀-૿]/.test(text)) return 'gu';
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  return null;
}

export function LabAgent() {
  const reduced = usePrefersReducedMotion();
  const { addContact, storageAvailable } = useContent();

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '', area: '' });
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSaved, setLeadSaved] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);

  const t = COPY[lang];

  /* The assistant is hidden rather than broken when no key is configured. */
  const enabled = assistantConfigured();

  /* Escape closes, and focus goes to the input when the panel opens. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open]);

  /* Any in-flight request is abandoned when the panel closes or unmounts. */
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  /* Keep the newest message in view. */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, busy, showForm, leadSaved]);

  const history = useMemo<ChatMessage[]>(
    () => lines.map((l) => ({ role: l.role, content: l.text })),
    [lines],
  );

  const push = useCallback((role: Line['role'], text: string) => {
    setLines((prev) => [...prev, { id: nextId.current++, role, text }]);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;

      // Follow the visitor into Gujarati or Hindi without them asking.
      const detected = detectLang(text);
      if (detected && detected !== lang) setLang(detected);

      // A mobile number in the thread is the cue to offer the form.
      if (!leadSaved && MOBILE_RE.test(text.replace(/\D/g, '').slice(-10))) {
        setLead((p) => ({ ...p, phone: text.replace(/\D/g, '').slice(-10) }));
        setShowForm(true);
      }

      push('user', text);
      setDraft('');
      setBusy(true);
      setFailed(false);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        /*
          The language in force is stated explicitly rather than left to the
          model to infer. Inference works while the visitor is typing words,
          and fails the moment they send something with no script in it — a
          phone number, a package name, "ok". Measured: after a Gujarati
          exchange, a bare mobile number got an English reply.
        */
        const want = detected ?? lang;
        /*
          The directive rides on the user turn, not a system message. A system
          message saying "the visitor is using Gujarati" was measured and
          ignored: after a Gujarati exchange, a bare mobile number still came
          back in English. Attached to the message being answered, it holds.
          The suffix never reaches the screen — the bubble renders `text`.
        */
        const reply = await chat(
          [
            { role: 'system', content: AGENT_SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: `${text}

[Reply in ${LANG_NAMES[want]}.]` },
          ],
          { signal: controller.signal },
        );
        push('assistant', reply);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailed(true);
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, history, lang, leadSaved, push],
  );

  const saveLead = useCallback(() => {
    const phone = lead.phone.replace(/\D/g, '').slice(-10);
    if (!lead.name.trim()) {
      setLeadError(t.needName);
      return;
    }
    if (!MOBILE_RE.test(phone)) {
      setLeadError(t.invalidPhone);
      return;
    }
    const transcript = lines
      .slice(-6)
      .map((l) => `${l.role === 'user' ? 'Visitor' : 'Assistant'}: ${l.text}`)
      .join('\n');
    addContact({
      name: lead.name.trim(),
      phone,
      email: '',
      message: [
        'Asked the site assistant.',
        lead.area.trim() ? `Area: ${lead.area.trim()}` : null,
        transcript ? `\nLast exchanges:\n${transcript}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
    setLeadError(null);
    setLeadSaved(true);
    setShowForm(false);
  }, [addContact, lead, lines, t]);

  if (!enabled) return null;

  return (
    <>
      {/* ------------------------------- Launcher ------------------------------ */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (lines.length === 0) push('assistant', t.greeting);
        }}
        aria-expanded={open}
        aria-label={open ? t.close : t.open}
        /* A stable hook: the aria-label is translated, so it is not one. */
        data-agent="launcher"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_12px_32px_-10px_rgba(15,122,172,0.8)] transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(15,122,172,0.95)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {!reduced && !open && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-brand-400/40 animate-pulse-ring"
          />
        )}
        {open ? (
          <X className="relative h-[24px] w-[24px]" strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <Bot className="relative h-[26px] w-[26px]" strokeWidth={2} aria-hidden="true" />
        )}
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-navy-900 px-3 py-2 text-[13px] font-medium text-white opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100 lg:block">
          {t.open}
        </span>
      </button>

      {/* -------------------------------- Panel --------------------------------
        Rendered into <body> rather than beside the launcher.

        The launcher lives in the floating chrome, which carries z-40. A
        z-index on that container opens a stacking context, so a child can
        never escape it however high its own z-index is: the panel asked for
        z-50 and still rendered underneath the site header, which is also
        z-50 but a sibling of the container rather than a cousin. Portalling
        to the body makes the panel a sibling of the header, and z-55 then
        actually means above it — while staying below the mobile menu at
        z-[60], which should cover the assistant when it is open.
      */}
      {createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={t.title}
            data-agent="panel"
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-[55] flex max-h-[min(640px,calc(100dvh-7.5rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-liftLg ring-1 ring-ink-line sm:bottom-28 sm:right-7"
          >
            {/* Header */}
            <div className="flex items-start gap-3 bg-gradient-to-br from-brand-700 to-brand-600 px-5 py-4 text-white">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight tracking-tightest">{t.title}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-white/70">{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="-mr-1 -mt-1 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            {/* Language switch */}
            <div className="flex items-center gap-1.5 border-b border-ink-line bg-mist px-4 py-2.5">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  aria-pressed={lang === l.id}
                  className={cn(
                    'rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                    lang === l.id
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-soft hover:bg-white hover:text-ink',
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Thread */}
            <div
              ref={threadRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              aria-live="polite"
              aria-atomic="false"
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={cn('flex', line.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <p
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed',
                      line.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-mist text-ink',
                    )}
                  >
                    {line.text}
                  </p>
                </div>
              ))}

              {busy && (
                <p className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} aria-hidden="true" />
                  {t.thinking}
                </p>
              )}

              {failed && (
                <div className="rounded-2xl bg-coral-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-coral-600">
                  {t.error}
                  <a
                    href={telHref()}
                    className="mt-1.5 flex items-center gap-1.5 font-semibold underline"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                    {SITE_CONFIG.phoneDisplay}
                  </a>
                </div>
              )}

              {/* Lead form — real inputs, because a parsed name files half the leads wrong. */}
              {showForm && !leadSaved && (
                <div className="rounded-2xl bg-surface-soft p-4 ring-1 ring-brand-100">
                  <p className="text-[13.5px] font-bold text-ink">{t.detailsTitle}</p>
                  <p className="mt-1 text-[12px] leading-snug text-ink-soft">{t.detailsNote}</p>
                  <div className="mt-3 space-y-2">
                    {([
                      ['name', t.name, 'text'],
                      ['phone', t.mobile, 'tel'],
                      ['area', t.area, 'text'],
                    ] as const).map(([key, label, type]) => (
                      <input
                        key={key}
                        type={type}
                        /* Stable hook: the aria-label follows the visitor's language. */
                        data-agent={`lead-${key}`}
                        value={lead[key]}
                        onChange={(e) => setLead((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={label}
                        aria-label={label}
                        className="w-full rounded-xl border border-ink-line bg-white px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-soft focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    ))}
                  </div>
                  {leadError && (
                    <p role="alert" className="mt-2 text-[12.5px] font-medium text-coral-600">
                      {leadError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={saveLead}
                    data-agent="lead-save"
                    disabled={!storageAvailable}
                    className="mt-3 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {t.save}
                  </button>
                </div>
              )}

              {leadSaved && (
                <div className="rounded-2xl bg-mint-50 p-4 ring-1 ring-mint-200">
                  <p className="text-[13.5px] leading-relaxed text-ink">{t.saved}</p>
                  <a
                    href={telHref()}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                    {SITE_CONFIG.phoneDisplay}
                  </a>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-ink-line bg-white px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(draft);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter is a newline, as every chat does.
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-ink-line bg-mist px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-soft focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={busy || draft.trim().length === 0}
                  aria-label={t.send}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  <Send className="h-[17px] w-[17px]" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </form>
              <p className="mt-2 px-1 text-[11px] leading-snug text-ink-soft">{t.notDoctor}</p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
