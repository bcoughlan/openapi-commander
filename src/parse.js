const SwaggerParser = require('@apidevtools/swagger-parser')

async function parseSpec(specLocation) {
  const parsed = await SwaggerParser.parse(specLocation)
  if (parsed.swagger === '2.0') {
    const openapi = await convertSwaggerToOpenAPI(JSON.parse(JSON.stringify(parsed)))
    return SwaggerParser.dereference(openapi)
  }
  return SwaggerParser.dereference(parsed)
}

async function convertSwaggerToOpenAPI(swagger) {
  const converter = require('swagger2openapi')
  let options = { patch: true, warnOnly: true }
  return new Promise((resolve, reject) => {
    converter.convertObj(swagger, options, function (err, options) {
      if (err) {
        reject(err)
      } else {
        resolve(options.openapi)
      }
    })
  })
}

module.exports = { parseSpec }