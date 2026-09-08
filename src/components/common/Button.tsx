import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'onDark' | 'outlineDark' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_10px_24px_-12px_rgba(21,155,211,0.9)] hover:bg-brand-600 hover:shadow-[0_16px_32px_-14px_rgba(21,155,211,0.95)] focus-visible:outline-brand-500',
  secondary:
    'bg-white text-ink border border-ink-line hover:border-brand-300 hover:text-brand-600 hover:shadow-lift focus-visible:outline-brand-500',
  ghost:
    'bg-transparent text-ink-muted hover:text-brand-600 hover:bg-brand-50 focus-visible:outline-brand-500',
  onDark:
    'bg-white text-navy-900 hover:bg-brand-50 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.6)] focus-visible:outline-brand-300',
  outlineDark:
    'bg-white/[0.06] text-white border border-white/25 backdrop-blur-sm hover:bg-white/[0.12] hover:border-white/45 focus-visible:outline-brand-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-lg',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5 rounded-xl',
};

const BASE =
  'group/btn inline-flex items-center justify-center font-semibold tracking-[-0.01em] ' +
  'transition-all duration-200 ease-premium will-change-transform ' +
  'hover:-translate-y-0.5 active:translate-y-0 active:duration-75 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-55';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders an internal <Link> instead of a <button>. */
  to?: string;
  /** Renders an external <a> instead of a <button>. */
  href?: string;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', to, href, className, children, ...rest },
  ref,
) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:|^mailto:|^tel:/.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external && href.startsWith('http')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

/** Arrow that slides on hover — pair with `group/btn` on the button. */
export function ButtonArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block transition-transform duration-200 ease-premium group-hover/btn:translate-x-1',
        className,
      )}
    >
      →
    </span>
  );
}
