import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light' | 'outline-light';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

const cls = (v: Variant, s: Size, block?: boolean, extra?: string) =>
  ['btn', `btn--${v}`, s !== 'md' && `btn--${s}`, block && 'btn--block', extra].filter(Boolean).join(' ');

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button(
    { variant = 'primary', size = 'md', block, loading, disabled, children, className, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cls(variant, size, block, className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

export function LinkButton({
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link className={cls(variant, size, block, className)} {...rest}>
      {children}
    </Link>
  );
}
