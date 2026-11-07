import { Fragment } from 'react'

/** Removes the *highlight* markers so a title can be used as plain text (header, read aloud). */
export const plain = (text: string): string => text.replace(/\*/g, '')

/** Renders "Find work *near you*" with the marked words on a bright turquoise highlight. */
export function Highlighted({ text }: { text: string }) {
  const parts = text.split(/\*(.+?)\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="inline-block rounded-lg bg-accent px-2 text-accent-ink">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
