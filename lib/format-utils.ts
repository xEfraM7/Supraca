/**
 * Formatea números con separadores de miles y decimales
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Formatea cantidad en kilogramos con unidad
 */
export const formatKg = (kg: number, decimals: number = 2): string => {
  return `${formatNumber(kg, decimals)} kg`
}

/**
 * Formatea cantidad en metros cúbicos con unidad
 */
export const formatM3 = (m3: number, decimals: number = 2): string => {
  return `${formatNumber(m3, decimals)} m³`
}

/**
 * Formatea porcentaje
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`
}
