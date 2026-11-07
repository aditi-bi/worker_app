/** The short code the worker reads out on the verification call. */
export function CodeDigits({ code }: { code: string }) {
  return (
    <div className="flex justify-center gap-2" aria-label={code.split('').join(' ')}>
      {code.split('').map((digit, i) => (
        <b key={i} aria-hidden="true" className="flex h-16 w-[3.4rem] items-center justify-center rounded-2xl bg-night text-4xl font-extrabold text-accent">
          {digit}
        </b>
      ))}
    </div>
  )
}
