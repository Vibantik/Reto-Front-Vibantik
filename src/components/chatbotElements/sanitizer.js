
// prompt injection /jailbreaks del usuario
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /olvida\s+(todas?\s+)?(las\s+)?instrucciones?\s+anteriores?/i,
  /act\s+as(\s+if\s+you\s+(are|were))?/i,
  /actúa\s+como/i,
  /you\s+are\s+now/i,
  /ahora\s+(eres?|serás?)/i,
  /new\s+system\s+prompt/i,
  /nuevo\s+system[\s_]?prompt/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /finge\s+(que\s+eres?|ser)/i,
  /do\s+anything\s+now/i,
  /DAN/,                            
  /developer\s+mode/i,
  /modo\s+desarrollador/i,

  // delimiter injection
  /\[INST\]/i,
  /<\|.*?\|>/,                            // <|im_start|> style tokens
  /###\s*(system|instruction|prompt)/i,
  /```\s*system/i,

  // mostrar datos
  /intenta\s+acceder\s+a?(?:\s+base)?(?:\s+dato)?/i,      
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /muestra\s+(tu\s+)?prompt/i,
  /what\s+(are\s+)?your\s+instructions/i,
  /cuáles\s+son\s+tus\s+instrucciones/i,
  /repeat\s+(everything|all)\s+(above|before)/i,
];

// SQL 
const SQL_PATTERNS = [
  /'\s*(OR|AND)\s+'?\d/i,           // ' OR '1'='1
  /;\s*(DROP|DELETE|INSERT|UPDATE|SELECT|EXEC|UNION)\b/i, //con ;
  /['"]?\s*(select|union|insert|update|delete|replace|truncate|drop)\b/i, //con "" o '' antes de sql
  /--\s/,                           // SQL comment
  /\/\*.*?\*\//s,                   // block comment
  /xp_cmdshell/i,
  /\bexec(?:\s|\+)+(xp|sp)\w+/i, 
  /(\%27)|(\-\-)|(\%23)/i,           // Encoded SQL meta-characters (%27=quote, --=comment, %23=hash)
  /(=|%3D)[^\n]*([‘"%;]|--|\bOR\b|\bAND\b)/i, // = or %3D followed by SQL payload
  /(?:[‘"])\s*(OR|AND)\s+[‘"]?\d/i, // quote-gated OR/AND injection (won’t catch "mayor", "del", etc.)
];


// acceso con tags de HTML
function stripHtml(text) {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "") 
    // .replace(/<\s*script\b[^>]*>[^<]+<\s*\s*script\s*>/g, "")
    .replace(/<[^>]+>/g, "")                           
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// quitar zero-width Unicode chars para instrucciones ocultas

function removeInvisible(text) {
  return text.replace(
    /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g,
    ""
  );
}

// trim y normaliza espacios
function normalizeWhitespace(text) {
  return text
    .replace(/[^\S\n]+/g, " ")   
    .replace(/\n{3,}/g, "\n\n")  
    .trim();
}


export function sanitize(rawInput) {
  if (rawInput.length > 2000) {
    return {
      safe: false,
      text: "",
      reason: "Tu mensaje es demasiado largo. Por favor, sé más breve.",
    };
  }

  //checks de seguridad
  let text = removeInvisible(rawInput);
  text = stripHtml(text);
  text = normalizeWhitespace(text);

  // si esta vaico después de limpiar
  if (!text) {
    return {
      safe: false,
      text: "",
      reason: "El mensaje se eliminó después de su revisión, intenta mandar otro.",
    };
  }


  //prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        text: "",
        reason:
          "Lo siento, ese tipo de mensajes no está permitido. ¿En qué te puedo ayudar?",
      };
    }
  }

  //SQL injection
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        text: "",
        reason:
          "Lo siento, ese tipo de mensajes no está permitido. ¿En qué otra cosa te puedo ayudar?",
      };
    }
  }

  return { safe: true, text }; // text: string, reason?: string

}
