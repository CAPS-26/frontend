export const interpolateAODColor = (value: number): string => {
  const opacity = 0.85;

  if (value >= 4.0) {
    return `rgba(255, 0, 0, ${opacity})`; 
  }

  // gradasi mejikuhibiniu
  const ranges = [
    { max: 0.0, r: 128, g: 0, b: 128 }, 
    { max: 0.8, r: 75, g: 0, b: 130 },  
    { max: 1.6, r: 0, g: 0, b: 255 },   
    { max: 2.4, r: 0, g: 128, b: 0 },   
    { max: 3.2, r: 255, g: 255, b: 0 },
    { max: 4.0, r: 255, g: 165, b: 0 }, 
  ];

  for (let i = 0; i < ranges.length - 1; i++) {
    const current = ranges[i];
    const next = ranges[i + 1];
    if (value <= next.max) {
      const ratio = (value - current.max) / (next.max - current.max);
      const r = Math.round(current.r + ratio * (next.r - current.r));
      const g = Math.round(current.g + ratio * (next.g - current.g));
      const b = Math.round(current.b + ratio * (next.b - current.b));
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  return `rgba(128, 0, 128, ${opacity})`;
};

export const interpolatePM25Color = (value: number | null): string => {
  const opacity = 0.85;
  if (value === null || isNaN(value)) {
    return `rgba(160, 174, 192, ${opacity})`; 
  }

  const ranges = [
    { max: 0, r: 0, g: 204, b: 0 },     
    { max: 15.4, r: 1, g: 51, b: 255 },  
    { max: 55.4, r: 255, g: 201, b: 0 }, 
    { max: 150.4, r: 255, g: 0, b: 0 },   
    { max: 250.4, r: 34, g: 34, b: 34 },  
  ];

  for (let i = 0; i < ranges.length - 1; i++) {
    const current = ranges[i];
    const next = ranges[i + 1];
    if (value <= next.max) {
      const ratio = (value - current.max) / (next.max - current.max);
      const r = Math.round(current.r + ratio * (next.r - current.r));
      const g = Math.round(current.g + ratio * (next.g - current.g));
      const b = Math.round(current.b + ratio * (next.b - current.b));
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  // Default untuk nilai <= 15.4
  return `rgba(0, 204, 0, ${opacity})`;
};

export const staticPM25Color = (value: number | null): string => {
  const opacity = 0.7;
  if (value === null || isNaN(value)) {
    return `rgba(160, 174, 192, ${opacity})`; // untuk data yg gaada
  }
  if (value <= 15.4) return `rgba(0, 204, 0, ${opacity})`; 
  if (value <= 55.4) return `rgba(1, 51, 255, ${opacity})`; 
  if (value <= 150.4) return `rgba(255, 201, 0, ${opacity})`; 
  if (value <= 250.4) return `rgba(255, 0, 0, ${opacity})`; 
  return `rgba(34, 34, 34, ${opacity})`; 
};