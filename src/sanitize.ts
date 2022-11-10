
/*
 * Sanitize a variable for use in a single-quote Javascript string
 */
export function sanitizeString(str : string | number | undefined | null | false) : string {
  if (typeof str === 'number') return str.toString()
  if (!str) return ''
  return str.replace(/\\/, '\\\\').replace(/'/g, "\\'").replace(/\r\n/g, "\\n").replace(/\n/g, "\\n")
}

/*
 * Sanitize a string for use in a Javascript comment
 */
export function sanitizeComment(str : string ) : string {
  return keepChars(str, ['space', 'newline', 'quote', 'symbol', 'letter', 'number'])
}

/*
 * Sanitize a String for use as a Javascript variable name
 */
export function sanitizeVariable(str : string ) : string {
  const name = keepChars(str, ['letter', 'number'])
  return (classify(name[0]) === 'letter') ? name : 'var' + name
}

function classify(c : string) {
  if (c === ' ') return 'space'
  if (c === '\n') return 'newline'
  if (c === "'" || c === '"') return 'quote'

  if (c >= '0' && c <= '9') return 'number'
  if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') return 'letter'
  //this ASCII range includes letters & numbers so this line has to come after those
  if (c >= '!' && c <= '~') return 'symbol'
  return 'other'
}

function filterChars(str : string, keepPredicate : (s : string) => boolean) : string {
  return str.split('').filter(keepPredicate).join('')
}

function keepChars(str : string, classes : string[]) {
  return filterChars(str, c => classes.includes(classify(c)))
}
