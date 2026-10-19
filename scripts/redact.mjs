/** UI-level concealment of all source saving DC labels for non-GMs. */
export function redactDC(content){
 return String(content??'')
  .replace(/\bDC\s*[—:\-()\s]*\d{1,3}\b/gi,'DC: GM only')
  .replace(/\b(Save|Saving Throw)\s*[—:\-()\s]+(?:DC\s*)?\d{1,3}\b/gi,'$1 (DC: GM only)')
  .replace(/\b(Saving Throw)\s*\(\s*\d{1,3}\s*\)/gi,'$1 (DC: GM only)');
}