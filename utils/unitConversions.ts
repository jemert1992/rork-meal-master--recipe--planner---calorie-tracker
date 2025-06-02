// Utility functions for unit conversions

/**
 * Convert kilograms to pounds
 */
export const kgToPounds = (kg: number): number => {
  return kg * 2.20462;
};

/**
 * Convert pounds to kilograms
 */
export const poundsToKg = (pounds: number): number => {
  return pounds / 2.20462;
};

/**
 * Convert centimeters to feet and inches
 */
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

/**
 * Convert feet and inches to centimeters
 */
export const feetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

/**
 * Format height in feet and inches for display
 */
export const formatHeight = (cm: number): string => {
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}' ${inches}"`;
};

/**
 * Format weight in pounds for display
 */
export const formatWeight = (kg: number): string => {
  const pounds = Math.round(kgToPounds(kg));
  return `${pounds} lbs`;
};