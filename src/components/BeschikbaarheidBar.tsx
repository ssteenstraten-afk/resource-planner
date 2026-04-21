import { berekenBeschikbaarheid, beschikbaarheidLabel } from '../lib/beschikbaarheidUtils'

interface Props {
  weken: Array<{ key: string; totaalUren: number }>
  contractUren: number
}

export function BeschikbaarheidBar({ weken, contractUren }: Props) {
  return (
    <tfoot>
      <tr className="rij-bezet">
        <td className="rij-label">Allocated</td>
        {weken.map(w => (
          <td key={w.key} className="rij-waarde">
            {w.totaalUren}h
          </td>
        ))}
      </tr>
      <tr className="rij-contract">
        <td className="rij-label">Contract</td>
        {weken.map(w => (
          <td key={w.key} className="rij-waarde">
            {contractUren}h
          </td>
        ))}
      </tr>
      <tr className="rij-beschikbaar">
        <td className="rij-label">Available</td>
        {weken.map(w => {
          const info = berekenBeschikbaarheid(w.totaalUren, contractUren)
          return (
            <td
              key={w.key}
              className={`rij-waarde beschikbaar-${info.status}`}
              style={{ backgroundColor: info.achtergrondKleur, color: info.tekstKleur }}
              title={`${info.percentage}% allocated`}
            >
              {beschikbaarheidLabel(info)}
            </td>
          )
        })}
      </tr>
      <tr className="rij-percentage">
        <td className="rij-label">% allocated</td>
        {weken.map(w => {
          const info = berekenBeschikbaarheid(w.totaalUren, contractUren)
          return (
            <td
              key={w.key}
              className={`rij-waarde beschikbaar-${info.status}`}
              style={{ backgroundColor: info.achtergrondKleur, color: info.tekstKleur, fontWeight: 600 }}
            >
              {info.percentage}%
            </td>
          )
        })}
      </tr>
    </tfoot>
  )
}
