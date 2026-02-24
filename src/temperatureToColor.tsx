export function getTemperatureColor(temp: number | null): string {
    if (temp === null) return '#9ca3af';
  
    const min = 0;
    const max = 10;
    const clamped = Math.max(min, Math.min(max, temp));
    const t = (clamped - min) / (max - min);
  
    const hueStart = 240;
    const hueEnd = 360;
    const hue = hueStart + (hueEnd - hueStart) * t;
  
    return `hsl(${hue}, 90%, 55%)`;
  }