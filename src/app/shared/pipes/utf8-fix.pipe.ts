import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utf8Fix',
  standalone: true
})
export class Utf8FixPipe implements PipeTransform {
  transform(value: string): string {
    if (!value || typeof value !== 'string') return value;
    
    try {
      // Reparar cadenas corruptas como CaÃ±ete -> Cañete
      // Esto ocurre cuando UTF-8 multibyte se interpreta incorrectamente
      const charArray = value.split('');
      let result = '';
      let i = 0;
      
      while (i < charArray.length) {
        const char = charArray[i];
        const code = char.charCodeAt(0);
        
        // Si encontramos caracteres problemáticos (Ã, etc.)
        if (code >= 0xC0 && code <= 0xFF && i + 1 < charArray.length) {
          const nextCode = charArray[i + 1].charCodeAt(0);
          if (nextCode >= 0x80 && nextCode <= 0xBF) {
            // Intentar decodificar como UTF-8 multibyte
            try {
              const byte1 = code;
              const byte2 = nextCode;
              if ((byte1 & 0xE0) === 0xC0) {
                const decoded = String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
                result += decoded;
                i += 2;
                continue;
              }
            } catch (e) {
              // Ignorar errores
            }
          }
        }
        
        result += char;
        i++;
      }
      
      return result;
    } catch (e) {
      return value;
    }
  }
}
