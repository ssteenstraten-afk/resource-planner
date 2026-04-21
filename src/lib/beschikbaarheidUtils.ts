export type BezettingStatus = 'onderbezet' | 'gemiddeld' | 'goed' | 'overbezet'

export interface BeschikbaarheidInfo {
  bezeteUren: number
  contractUren: number
  beschikbareUren: number
  percentage: number
  status: BezettingStatus
  kleur: string
  achtergrondKleur: string
  tekstKleur: string
}

/**
 * Bereken beschikbaarheidsinfo op basis van bezette en contracturen
 *
 * Kleurcodering:
 * >= 80% bezet  → groen
 * 60–79% bezet  → oranje
 * < 60% bezet   → rood (onderbezet)
 * > 100% bezet  → paars (overbezet)
 */
export function berekenBeschikbaarheid(
  bezeteUren: number,
  contractUren: number
): BeschikbaarheidInfo {
  const beschikbareUren = contractUren - bezeteUren
  const percentage = contractUren > 0 ? (bezeteUren / contractUren) * 100 : 0

  let status: BezettingStatus
  let kleur: string
  let achtergrondKleur: string
  let tekstKleur: string

  if (percentage > 100) {
    status = 'overbezet'
    kleur = '#7c3aed'
    achtergrondKleur = '#ede9fe'
    tekstKleur = '#5b21b6'
  } else if (percentage >= 80) {
    status = 'goed'
    kleur = '#16a34a'
    achtergrondKleur = '#dcfce7'
    tekstKleur = '#15803d'
  } else if (percentage >= 60) {
    status = 'gemiddeld'
    kleur = '#ea580c'
    achtergrondKleur = '#fff7ed'
    tekstKleur = '#c2410c'
  } else {
    status = 'onderbezet'
    kleur = '#dc2626'
    achtergrondKleur = '#fef2f2'
    tekstKleur = '#b91c1c'
  }

  return {
    bezeteUren,
    contractUren,
    beschikbareUren,
    percentage: Math.round(percentage),
    status,
    kleur,
    achtergrondKleur,
    tekstKleur,
  }
}

/** CSS klasse naam op basis van status */
export function statusNaarKlasse(status: BezettingStatus): string {
  const klassen: Record<BezettingStatus, string> = {
    goed: 'status-goed',
    gemiddeld: 'status-gemiddeld',
    onderbezet: 'status-onderbezet',
    overbezet: 'status-overbezet',
  }
  return klassen[status]
}

/** Label voor beschikbaarheid */
export function beschikbaarheidLabel(info: BeschikbaarheidInfo): string {
  if (info.beschikbareUren <= 0) {
    return info.beschikbareUren < 0
      ? `${Math.abs(info.beschikbareUren)}h over`
      : 'Full'
  }
  return `${info.beschikbareUren}h available`
}
