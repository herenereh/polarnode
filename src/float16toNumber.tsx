export function float16ToNumber(h: number) {
    const sign = (h & 0x8000) >> 15;
    const exp  = (h & 0x7C00) >> 10;
    const frac = h & 0x03FF;
      
    if (exp === 0) {
      return (sign ? -1 : 1) * Math.pow(2, -14) * (frac / 1024);
        }
      
        if (exp === 0x1F) {
          return frac ? NaN : (sign ? -Infinity : Infinity);
        }
      
        return (sign ? -1 : 1) *
               Math.pow(2, exp - 15) *
               (1 + frac / 1024);
              }