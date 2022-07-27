const { camelCase } = require('lodash')


/*
 * Sanitize a variable for use in a single-quote Javascript string
 */
function sanitizeString(str) {
  if (typeof str === 'number') return str.toString()
  if (!str) return ''
  return str.replace(/\\/, '\\\\').replace(/'/g, "\\'").replace(/\n/g, "\\n")
}

/*
 * Sanitize a string for use in a Javascript comment
 */
function sanitizeComment(str) {
  return keepChars(str, ['space', 'newline', 'quote', 'symbol', 'letter', 'number'])
}

/*
 * Sanitize a commander.js command name
 */
function sanitizeCommand(str) {
  return keepChars(camelCase(str), ['letter', 'number'])
}

/*
 * Sanitize a String for use as a Javascript variable name
 */
function sanitizeVariable(str) {
  const name = keepChars(camelCase(str), ['letter', 'number'])
  return (classify(name[0]) === 'letter') ? name : 'var' + name
}

function classify(c) {
  if (c === ' ') return 'space'
  if (c === '\n') return 'newline'
  if (c === "'" || c === '"') return 'quote'

  if (c >= '0' && c <= '9') return 'number'
  if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') return 'letter'
  //this ASCII range includes letters & numbers so this line has to come after those
  if (c >= '!' && c <= '~') return 'symbol'
  return 'other'
}

function filterChars(str, keepPredicate) {
  return str.split('').filter(keepPredicate).join('')
}

function keepChars(str, classes) {
  return filterChars(str, c => classes.includes(classify(c)))
}

module.exports = { sanitizeCommand, sanitizeComment, sanitizeString, sanitizeVariable }