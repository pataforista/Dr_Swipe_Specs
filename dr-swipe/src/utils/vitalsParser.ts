/**
 * Utility to parse clinical vitals from raw card text.
 * Uses regex to capture TA (Blood Pressure), FC (Heart Rate), and Temp (Temperature).
 */

export interface ParsedVitals {
  ta?: string;
  fc?: number;
  temp?: number;
  status: 'normal' | 'alert' | 'critical';
}

export const parseVitalsFromText = (text: string): ParsedVitals | null => {
  const taMatch = text.match(/TA\s*([\d]{2,3}\/[\d]{2,3})/i);
  const fcMatch = text.match(/FC\s*([\d]{2,3})/i);
  const tempMatch = text.match(/T(?:emp)?\s*([\d]{2}\.?[\d]?)/i);

  if (!taMatch && !fcMatch && !tempMatch) return null;

  const result: ParsedVitals = {
    ta: taMatch ? taMatch[1] : undefined,
    fc: fcMatch ? parseInt(fcMatch[1]) : undefined,
    temp: tempMatch ? parseFloat(tempMatch[1]) : undefined,
    status: 'normal'
  };

  // Internal semantic analysis (Semaforización)
  let severity = 0; // 0=normal, 1=alert, 2=critical

  if (result.ta) {
    const [sys, dia] = result.ta.split('/').map(n => parseInt(n));
    if (sys < 90 || dia < 60 || sys > 160) severity = Math.max(severity, 2);
    else if (sys < 100 || sys > 140) severity = Math.max(severity, 1);
  }

  if (result.fc) {
    if (result.fc < 50 || result.fc > 120) severity = Math.max(severity, 2);
    else if (result.fc < 60 || result.fc > 100) severity = Math.max(severity, 1);
  }

  if (result.temp) {
    if (result.temp < 35 || result.temp > 39) severity = Math.max(severity, 2);
    else if (result.temp > 37.5) severity = Math.max(severity, 1);
  }

  result.status = severity === 2 ? 'critical' : severity === 1 ? 'alert' : 'normal';
  
  return result;
};
