import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Custom listbox, replacing the native `<select>`.
 *
 * The reason this exists: a native select's *open* menu is drawn by the
 * operating system, and CSS cannot touch it. You can style the closed control
 * perfectly and the popup will still appear as a system list with the OS accent
 * colour on the highlighted row — which is exactly the mismatch this component
 * removes.
 *
 * It implements the ARIA listbox pattern properly, because replacing a native
 * control means taking on everything the native control gave you for free:
 * roving `aria-activedescendant`, full keyboard support (arrows, Home/End,
 * Enter, Escape, typeahead), click-outside dismissal, focus return to the
 * trigger, and a hidden input so the value still participates in form
 * semantics and `[name=...]` lookups.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Optional secondary text shown to the right of the label. */
  meta?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown when `value` matches no option — typically the empty choice. */
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Wired up by SelectField; ignored otherwise. */
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaLabel?: string;
}

const SIZES = {
  sm: 'h-8 pl-2.5 pr-8 text-[13px] rounded-lg',
  md: 'h-11 pl-3.5 pr-10 text-[14px] rounded-xl',
  lg: 'h-12 pl-4 pr-11 text-[15px] rounded-xl',
} as const;

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  name,
  id,
  disabled = false,
  invalid = false,
  size = 'lg',
  className,
  ariaLabelledBy,
  ariaDescribedBy,
  ariaLabel,
}: SelectProps) {
  const autoId = useId();
  const listId = `${id ?? autoId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ term: '', at: 0 });

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openList = useCallback(() => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, selectedIndex]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      close();
    },
    [options, onChange, close],
  );

  // Open upward when there is not enough room below.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimated = Math.min(options.length * 40 + 16, 288);
    setFlip(rect.bottom + estimated > window.innerHeight - 12 && rect.top > estimated);
  }, [open, options.length]);

  // Keep the active option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  // Dismiss on outside pointer or on scroll of an ancestor.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        return;
      case 'Tab':
        // Match native behaviour: commit nothing, just dismiss.
        setOpen(false);
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(active);
        return;
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => (i + 1) % options.length);
        return;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        return;
      case 'Home':
        e.preventDefault();
        setActive(0);
        return;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        return;
      default:
        break;
    }

    // Typeahead: jump to the first option starting with what was typed.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      const t = typeahead.current;
      t.term = now - t.at > 700 ? e.key : t.term + e.key;
      t.at = now;
      const match = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(t.term.toLowerCase()),
      );
      if (match >= 0) setActive(match);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      {/* Keeps the value in the DOM for form semantics and [name] lookups. */}
      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        data-field={name}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 border bg-white text-left font-medium text-ink',
          'transition-colors hover:border-brand-200',
          'focus:outline-none focus-visible:border-brand-300 focus-visible:ring-4 focus-visible:ring-brand-100',
          'disabled:cursor-not-allowed disabled:opacity-60',
          SIZES[size],
          invalid ? 'border-rose-300 bg-rose-50/40' : 'border-ink-line',
          open && !invalid && 'border-brand-300 ring-4 ring-brand-100',
        )}
      >
        <span className={cn('truncate', !selected && 'text-ink-soft/80')}>
          {selected ? selected.label : placeholder}
        </span>
      </button>

      <ChevronDown
        aria-hidden="true"
        strokeWidth={2.2}
        className={cn(
          'pointer-events-none absolute h-4 w-4 text-brand-500 transition-transform duration-200',
          size === 'sm' ? 'right-2.5 h-3.5 w-3.5' : 'right-4',
          'top-1/2 -translate-y-1/2',
          open && 'rotate-180',
        )}
        style={{ top: `calc(50% ${size === 'sm' ? '' : ''})` }}
      />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          tabIndex={-1}
          className={cn(
            'absolute z-50 max-h-72 w-full overflow-y-auto rounded-xl border border-ink-line bg-white p-1.5',
            'shadow-[0_24px_60px_-18px_rgba(11,32,88,0.35)]',
            flip ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === active;
            return (
              <li
                key={option.value || `empty-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors',
                  isActive && 'bg-brand-50',
                  isSelected ? 'font-semibold text-brand-700' : 'text-ink',
                )}
              >
                <span className="truncate">{option.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {option.meta && (
                    <span className="font-mono text-[11.5px] tabular-nums text-ink-soft">
                      {option.meta}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand-600" strokeWidth={2.6} aria-hidden="true" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
