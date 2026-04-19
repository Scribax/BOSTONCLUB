/**
 * Utilidades para formatear números con puntos de miles y atajos (k, m)
 */

/**
 * Convierte un número o string a formato con puntos de miles (Ej: 1000000 -> "1.000.000")
 */
export const formatWithDots = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === "") return "";
  
  // Limpiamos cualquier carácter no numérico excepto el número en sí
  const num = typeof value === "string" ? value.replace(/\D/g, "") : value.toString();
  
  if (!num) return "";
  
  // Formateamos con puntos de miles
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Convierte un string con formato (puntos, k, m) a un número puro
 */
export const parseSmartNumber = (value: string): number => {
  if (!value) return 0;
  
  let cleanValue = value.toLowerCase().trim();
  
  // Manejo de atajos k (miles) y m (millones)
  let multiplier = 1;
  
  if (cleanValue.endsWith("k")) {
    multiplier = 1000;
    cleanValue = cleanValue.slice(0, -1);
  } else if (cleanValue.endsWith("m")) {
    multiplier = 1000000;
    cleanValue = cleanValue.slice(0, -1);
  } else if (cleanValue.includes("kk")) { // Caso especial de gente que escribe kk para millones
    multiplier = 1000000;
    cleanValue = cleanValue.replace("kk", "");
  }

  // Eliminamos los puntos para quedarnos con el número base
  const numericString = cleanValue.replace(/\D/g, "");
  const num = parseInt(numericString) || 0;
  
  return num * multiplier;
};
