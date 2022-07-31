
function trimDescription(str) {
  if (!str) return ''
  const lines = str.split('\n')

  if (lines.length > 1) return lines[0] + '...'
  return lines[0]
}

/** Escape arg for shell */
function shellEscape(str) {
  return "'" + str.replace("'", "'\\''") + "'"
}

module.exports = {trimDescription, shellEscape}