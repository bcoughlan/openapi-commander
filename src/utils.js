
function trimDescription(str) {
  if (!str) return ''
  const lines = str.split('\n')
  let line = lines[0]

  if (lines.length > 1) return lines[0] + '...'
  return lines[0]
}

module.exports = {trimDescription}