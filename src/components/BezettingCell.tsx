import { useState, useRef, useEffect } from 'react'

interface Props {
  uren: number
  gewijzigd: boolean
  readonly?: boolean
  weekTotaal: number
  onWijzig: (uren: number) => void
}

export function BezettingCell({
  uren,
  gewijzigd,
  readonly = false,
  weekTotaal,
  onWijzig,
}: Props) {
  const [bewerken, setBewerken] = useState(false)
  const [invoer, setInvoer] = useState(String(uren))
  const [fout, setFout] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bewerken) inputRef.current?.select()
  }, [bewerken])

  useEffect(() => {
    if (!bewerken) setInvoer(String(uren))
  }, [uren, bewerken])

  function startBewerken() {
    if (readonly) return
    setInvoer(String(uren))
    setFout(null)
    setBewerken(true)
  }

  function bevestig() {
    const waarde = parseFloat(invoer.replace(',', '.'))
    if (isNaN(waarde) || waarde < 0) {
      setFout('Ongeldig')
      return
    }
    if (waarde > 12) {
      setFout('Max 12u per dag aanbevolen')
    }
    // Bereken nieuw weektotaal als deze waarde wordt opgeslagen
    const verschil = waarde - uren
    const nieuwTotaal = weekTotaal + verschil
    if (nieuwTotaal > 60) {
      setFout(`Weeksom wordt ${nieuwTotaal}u (max 60u)`)
      return
    }
    setFout(null)
    setBewerken(false)
    onWijzig(waarde)
  }

  function annuleer() {
    setBewerken(false)
    setInvoer(String(uren))
    setFout(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') bevestig()
    if (e.key === 'Escape') annuleer()
  }

  const klasseNaam = [
    'bezetting-cel',
    gewijzigd ? 'cel-gewijzigd' : '',
    uren === 0 ? 'cel-leeg' : '',
    readonly ? 'cel-readonly' : 'cel-bewerkbaar',
  ].filter(Boolean).join(' ')

  if (bewerken) {
    return (
      <td className="bezetting-cel cel-actief">
        <div className="cel-invoer-wrapper">
          <input
            ref={inputRef}
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={invoer}
            onChange={e => setInvoer(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={bevestig}
            className="cel-invoer"
          />
          {fout && <div className="cel-fout">{fout}</div>}
        </div>
      </td>
    )
  }

  return (
    <td className={klasseNaam} onClick={startBewerken} title={readonly ? undefined : 'Klik om te wijzigen'}>
      {uren > 0 ? uren : '—'}
    </td>
  )
}
