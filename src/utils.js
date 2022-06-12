
function trimDescription(str) {
  if (!str) return ''
  const lines = str.split('\n')

  if (lines.length > 1) return lines[0] + '...'
  return lines[0]
}

module.exports = {trimDescription}