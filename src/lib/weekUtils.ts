import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  addWeeks,
  format,
} from 'date-fns'
import { nl } from 'date-fns/locale'

export interface WeekInfo {
  jaar: number
  week: number
  startDatum: Date
  eindDatum: Date
  label: string
}

/** Geeft ISO week en jaar voor een datum */
export function getWeekEnJaar(datum: Date): { week: number; jaar: number } {
  return {
    week: getISOWeek(datum),
    jaar: getISOWeekYear(datum),
  }
}

/** Geeft huidige week info */
export function getHuidigeWeek(): WeekInfo {
  const nu = new Date()
  return maakWeekInfo(nu)
}

/** Maak WeekInfo object vanuit een datum */
export function maakWeekInfo(datum: Date): WeekInfo {
  const start = startOfISOWeek(datum)
  const eind = endOfISOWeek(datum)
  const week = getISOWeek(datum)
  const jaar = getISOWeekYear(datum)
  return {
    jaar,
    week,
    startDatum: start,
    eindDatum: eind,
    label: `wk${week}`,
  }
}

/** Geeft array van WeekInfo voor komende N weken (inclusief huidige) */
export function getKomendeWeken(aantalWeken: number = 12, vanafDatum?: Date): WeekInfo[] {
  const start = vanafDatum ?? new Date()
  const weken: WeekInfo[] = []
  for (let i = 0; i < aantalWeken; i++) {
    const datum = addWeeks(start, i)
    weken.push(maakWeekInfo(datum))
  }
  return weken
}

/** Formatteer datumrange van een week: "14 apr – 20 apr" */
export function formatWeekRange(weekInfo: WeekInfo): string {
  const start = format(weekInfo.startDatum, 'd MMM', { locale: nl })
  const eind = format(weekInfo.eindDatum, 'd MMM', { locale: nl })
  return `${start} – ${eind}`
}

/** Vergelijk twee weken: -1, 0, 1 */
export function vergelijkWeken(
  a: { jaar: number; week: number },
  b: { jaar: number; week: number }
): number {
  if (a.jaar !== b.jaar) return a.jaar < b.jaar ? -1 : 1
  if (a.week !== b.week) return a.week < b.week ? -1 : 1
  return 0
}

/** Converteer jaar+week naar datum (maandag van die week) */
export function weekNaarDatum(jaar: number, week: number): Date {
  // 4 januari is altijd in week 1
  const jan4 = new Date(jaar, 0, 4)
  const jan4Start = startOfISOWeek(jan4)
  return addWeeks(jan4Start, week - 1)
}

/** Geeft de eerste dag van de week (maandag) als datum-string "yyyy-MM-dd" */
export function weekMaandag(jaar: number, week: number): string {
  return format(weekNaarDatum(jaar, week), 'yyyy-MM-dd')
}
