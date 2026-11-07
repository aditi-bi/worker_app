import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Fixed text shown before the input, e.g. "+91" or "₹". */
  prefix?: string
  error?: string
  big?: boolean
}

/** Labelled input in the design's thick black outline. Errors are tied to the input for screen readers. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, prefix, error, big, id, className, ...rest }, ref) {
  const inputId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-bold text-ink">
        {label}
      </label>
      <div className={cn('flex min-h-14 items-center gap-2.5 rounded-2xl border-2 bg-surface px-3.5', error ? 'border-bad' : 'border-ink')}>
        {prefix && <small className="border-r-2 border-line pr-2.5 text-[15px] font-bold text-muted">{prefix}</small>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn('min-w-0 flex-1 bg-transparent font-extrabold text-ink outline-none placeholder:font-semibold placeholder:text-muted', big ? 'text-2xl tracking-wide' : 'text-lg', className)}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${inputId}-err`} role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
    </div>
  )
})
