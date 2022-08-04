const OpenAPISampler = require('openapi-sampler')
const { highlight } = require('cli-highlight')
const jsYaml = require('js-yaml')

//Tags don't have to be defined on the root level, but if they are we want to display the
//endpoints in that order like Swagger UI does.
function getTags(api, endpointsByTag) {
  const usedTagNames = Object.keys(endpointsByTag)
  const tags = (api.tags ?? []).filter(e => usedTagNames.includes(e.name))
  const definedTagNames = new Set((api.tags ?? []).map(e => e.name))
  for (const tag of usedTagNames) {
    if (!definedTagNames.has(tag)) tags.push({ name: tag })
  }
  return tags
}

/**
 * Syntax highlighting regardless of terminal settings.
 * TODO: This FORCE_COLOR override trick does not work.
 */
function alwaysHighlight(str, opts) {
  //chalk library disables color if it's piped or not a TTY stream
  const old = process.env['FORCE_COLOR']
  process.env['FORCE_COLOR'] = '2'
  const ret = highlight(str, opts)
  process.env['FORCE_COLOR'] = old
  return ret
}


function getExamples(operation) {
  function renderExample(example, contentType) {
    if (typeof ex === 'string') {
      return example
    } else if (contentType === 'application/json') {
      return alwaysHighlight(JSON.stringify(example, null, 2), { language: 'json' })
    } else if (contentType === 'application/yaml') {
      return alwaysHighlight(jsYaml.dump(example), { language: 'yaml' })
    }
    //TODO application/xml
    //TODO application/x-www-form-urlencoded
    return example
  }

  const content = operation?.requestBody?.content
  if (!content) return {}

  const examples = {}
  let found = false
  for (const [contentType, mediaType] of Object.entries(content)) {
    const ex = Object.values(mediaType.examples || {})
    if (ex.length) {
      examples[contentType] = examples[contentType] || []
      examples[contentType].push(renderExample(ex, contentType))
      found = true
    }
  }
  if (found) return examples

  //Auto-generate examples for specs that don't define examples
  const sampler = {}
  for (const [contentType, mediaType] of Object.entries(content)) {
    if (mediaType.schema) {
      sampler[contentType] = [renderExample(OpenAPISampler.sample(mediaType.schema), contentType)]
    }
  }
  
  return sampler
}

const validMethods = ['get', 'post', 'put', 'patch', 'delete']
function groupEndpointsByFirstTag(api) {
  const endpointsByTag = {}
  for (const [path, methods] of Object.entries(api.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const parameters = (methods.parameters ?? []).concat(operation.parameters ?? [])
      if (validMethods.includes(method)) {
        const tag = (operation.tags && operation.tags[0]) ?? 'Uncategorized'
        endpointsByTag[tag] = endpointsByTag[tag] || []
        endpointsByTag[tag].push({ parameters, path, method, operation })
      }
    }
  }
  return endpointsByTag
}

module.exports = { groupEndpointsByFirstTag, getExamples, getTags }