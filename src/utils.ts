/**
 * Форматирует дату в YYYY-MM-DD без учета часового пояса
 */
export function formatLocalDate(date: Date) {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Возвращает начало недели
 */
export function firstDayOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
  return d
}

/**
 * Смещает дату на указанное количество
 */
export function offsetDate(date: Date, offset: number) {
  const d = new Date(date)
  return new Date(d.setDate(d.getDate() + offset))
}

/**
 * Вычисляет среднее значения
 */
export function avg(items: number[]) {
  const sum = items.reduce((acc, value) => {
    acc += value
    return acc
  }, 0)
  return sum / items.length
}
