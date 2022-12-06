const fs = require('fs/promises')
const path = require('path')
const { sanitizeCommand, sanitizeComment, sanitizeString, sanitizeVariable } = require('./sanitize')
const { groupEndpointsByFirstTag, getExamples, getTags } = require('./spec-utils')
const { trimDescription } = require('./utils')
const _ = require('lodash')
const { parseSpec } = require('./parse')

const globalFlags = new Set(['v', 'verbose', 'p', 'print', 's', 'server', 'c', 'accept'])

const reservedKeywords = [
  "break",  "case",  "catch",  "class",  "const",  "continue",  "debugger",  "default",  "delete",  "do",  "else", 
  "export",  "extends",  "finally",  "for",  "function",  "if",  "import",  "in",  "instanceof",  "new",  "return",
  "super",  "switch",  "this",  "throw",  "try",  "typeof",  "var",  "void",  "while",  "with",  "yield",
  "enum",  "implements",  "interface",  "let",  "package",  "private",  "protected",  "public",  "static",  "await"
]

//Generate Javascript variable names from any string that don't clash with other variable names
function UniqueVarGenerator(initial) {
  const used = new Set(initial) ?? new Set()

  return {
    var: (name) => {
      name = sanitizeVariable(name)

      if (!used.has(name) && !reservedKeywords.includes(name)) {
        used.add(name)
        return name
      }

      for (let i = 1; ; i++) {
        if (!used.has(name + i)) {
          used.add(name + i)
          return name + i
        }
      }
    },
    isUsed: (name) => used.has(name)
  }
}

function Generator(specLocation, cmdName) {

  const output = []
  function write(...args) { output.push(...args) }

  async function generate() {
    const api = await parseSpec(specLocation)

    write((await fs.readFile(path.join(__dirname, '../resources/header.js'), 'utf8'))
      .replace('COMMAND_NAME_TO_BE_REPLACED', sanitizeString(cmdName))
      .replace('COMMAND_NAME_ENV_VARS_TO_BE_REPLACED', sanitizeString(_.snakeCase(cmdName).toUpperCase())))
    write(`const defaultServer = '${sanitizeString(api.servers?.[0]?.url)}'\n\n`)

    const rootUniqueVars = new UniqueVarGenerator()
    const endpointsByTag = groupEndpointsByFirstTag(api)
    for (const tag of getTags(api, endpointsByTag)) {

      write(`/* ============== ${sanitizeComment(tag.name)} ============== */\n`)
      const cmdVar = rootUniqueVars.var(tag.name)
      generateTagCommand(cmdVar, tag.description)

      for (let { parameters, path, method, operation } of endpointsByTag[tag.name]) {
        try {
          //OpenAPI spec: If in is "header" and the name field is "Accept", "Content-Type" or "Authorization",
          //              it shall be ignored.
          parameters = parameters.filter(p =>!(p.in === 'header' && ['accept', 'content-type', 'authorization'].includes(p.name?.toLowerCase())))

          if (!operation.operationId) {
            operation.operationId = _.camelCase(`${method.toLowerCase()}_${path.replace(/\//g, '_')}`)
          }

          const examples = getExamples(operation)
          const commandName = rootUniqueVars.var(operation.operationId)

          const isArgument = p => p.schema?.type !== 'array' && p.required && !Object.prototype.hasOwnProperty.call(p, 'default')
          const options = parameters.filter(p => !isArgument(p))
          const args = parameters.filter(p => isArgument(p))

          const defaultContentType = Object.keys(operation.requestBody?.content ?? {})?.[0]

          generateCommand(commandName, cmdVar, operation, examples)
          generateArguments(args)
          if (operation.requestBody) generateBody(operation.requestBody)
          generateOptions(options)
          const paramByType = getParameterReferences(args, operation, options)
          generateAction(paramByType, options, method, path, defaultContentType)
        } catch (err) {
          //Add context for errors
          if (err.message) err.message = `Error processing ${method.toUpperCase()} ${path}: ${err.message}`
          throw err
        }
      }
    }

    write(
      `if (require.main === module) {\n`,
      `  program.parseAsync(process.argv)\n`,
      `} else {\n`,
      `  module.exports = program\n`,
      `}\n`
    )
    return output.join('')
  }

  function generateTagCommand(cmdVar, tagDescription) {
    write(`const ${cmdVar} = program.command('${cmdVar}')\n`)
    if (tagDescription) {
      const summary = sanitizeString(trimDescription(tagDescription))
      const description = sanitizeString(tagDescription)
      if (summary !== description) {
        write(`  .summary('${summary}')\n`)
      }
      write(`  .description('${description}')\n\n`)
    }
  }

  function generateCommand(commandName, cmdVar, operation, examples) {
    write(`const ${commandName} = ${cmdVar}.command('${sanitizeCommand(operation.operationId)}')\n`)
    if (Object.keys(examples).length) {
      write(`${commandName}.command('examples').action(() => { printExamples(${JSON.stringify(examples)}) })\n`)
    }

    const deprecated = operation.deprecated ? '*DEPRECATED* ' : ''
    const summary = sanitizeString(trimDescription(deprecated + (operation.summary || operation.description)))
    const description = sanitizeString(deprecated + (operation.description || operation.summary))
    write(`${commandName}\n`)
    if (summary !== description) {
      write(`  .summary('${summary}')\n`)
    }
    write(`  .description('${description}')\n`)
  }

  function generateBody(requestBody) {
    const types = Object.keys(requestBody.content)
    if (types.some(t => t.includes('*'))) {
      //Wildcard types - being a bit lazy and just not enforcing choices in that case
      write(`  .addArgument(new Argument('<bodyType>', 'Content type of the request body.'))\n`)
    } else if (types.length > 1) {
      write(`  .addOption(new Option('--body-type <bodyType>', 'Content type of the request body.')`, 
        `.choices(${JSON.stringify(types)}).default('${sanitizeString(types[0])}'))\n`)
    }

    if (requestBody.required) {
      write(`  .addArgument(new Argument('<body>', 'Path to a file containing the request body.'))\n`)
    } else {
      write(`  .addOption(new Option('--body <body>', 'Path to a file containing the request body.'))\n`)
    }
  }

  function generateAction(codeRefs, options, method, path, defaultContentType) {
    write(
      `  .action(async function(...args) {\n`,
    )

    if (codeRefs.body || options.length > 0) {
      write(
        // commands passes (arg1, arg2, ... argN, options, commander object)
        `    const opt = args[args.length - 2]\n`,
      )
    }

    write(`    const headers = {}\n`,)
    for (const {key, ref} of codeRefs['header']) {
      write(`    if (${ref} !== undefined && ${ref} !== null) headers['${key}'] = ${ref}\n`)
    }

    write(`    const pathParams = {\n`)
    for (const {key, ref} of codeRefs['path']) {
      write(`      '${key}': ${ref},\n`)
    }
    write(`    }\n`)

    write(`    const queryParams = []\n`)
    for (const {key, ref, definition} of codeRefs['query']) {
      if (definition.schema?.type === 'array' && definition.explode !== false) {
        write(`    if (${ref}) ${ref}.forEach(p => queryParams.push(['${key}', p]))\n`)
      } else {
        write(`    queryParams.push(['${key}', ${ref}])\n`)
      }
    }

    write(
      `    await request('${sanitizeString(method)}', defaultServer, '${sanitizeString(path)}', {\n`,
      `      pathParams, queryParams, headers`
    )

    if (codeRefs.body) {
      write(
        `,\n      body: !${codeRefs.body} ? undefined : await fs.readFile(${codeRefs.body}, 'utf-8'),\n`,
        `      contentType: !${codeRefs.body} ? undefined : (${codeRefs.contentType} || '${sanitizeString(defaultContentType)}')\n`,
        `    })\n\n`,
      )
    } else {
      write(`})\n\n`)
    }
    write(`  })\n\n`)
  }

  function generateArguments(args) {
    for (const argument of args) {
      const name = sanitizeString(argument.name)
      const description = sanitizeString(argument.description)
      write(`  .addArgument(new Argument('<${name}>', '${description}')`)
      if (argument.schema?.enum) {
        write(`.choices([${argument.schema.enum.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
      }
      write(')\n')
    }
  }

  function generateOptions(options) {
    const uniqueOptions = new UniqueVarGenerator(globalFlags)

    for (const option of options) {
      const name = uniqueOptions.var(option.name)
      const shortName = uniqueOptions.isUsed(option.name[0]) ? '' : `-${option.name[0]} `
      const description = sanitizeString(option.description)

      if (option.schema?.type === 'array') {
        const choices = option.schema?.items?.enum ? 'choices: ' + option.schema.items.enum.map(e => sanitizeString(e)).join(',') : ''
        write(`  .addOption(new Option('${shortName}--${name} <${name}>', 'Comma-separated list. ${description} ${choices}').argParser(v => v.split(','))`)
        //TODO 'choices' doesn't work together with 'argParser'
        // if (option.schema?.items?.enum) {
          //write(`.choices([${option.schema.items.enum.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
        // }
      } else {
        write(`  .addOption(new Option('${shortName}--${name} <${name}>', '${description}')`)
        if (option.schema?.enum) {
          write(`.choices([${option.schema.enum.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
        }
      }
      write(')\n')
    }
  }

  /**
   * Build a data structure describing each argument type to its reference in
   * the generated code (e.g. "args[0]", "params['id']")
   */
  function getParameterReferences(args, operation, options) {
    const codeRefs = { 'body': null, 'bodyType': null, 'query': [], 'path': [], 'header': [], 'cookie': [] }

    if (operation.requestBody) {
      //TODO need a nice way to dedupe this logic from generateBody()

      const contentTypeIsArg = Object.keys(operation.requestBody.content).some(t => t.includes('*'))
      const bodyIsArg = operation.requestBody.required
      if (contentTypeIsArg) {
        codeRefs.contentType = `args[args.length - ${bodyIsArg ? '4' : '3'}]`
      } else {
        codeRefs.contentType = 'opt.bodyType'
      }

      if (operation.requestBody.required) {
        codeRefs.body = `args[args.length - 3]`
      } else {
        codeRefs.body = "opt['body']"
      }
    }

    for (const [i, arg] of args.entries()) {
      if (!codeRefs[arg.in]) {
        console.log('WARNING: Ignoring unknown parameter type:', arg.in)
      } else {
        codeRefs[arg.in].push({ key: sanitizeString(arg.name), ref: `args[${i}]`, definition: arg })
      }
    }
    for (const opt of options) {
      const sanitizedOpt = sanitizeString(opt.name)
      if (!codeRefs[opt.in]) {
        console.log('WARNING: Ignoring unknown parameter type:', opt.in)
      } else {
        codeRefs[opt.in].push({ key: sanitizedOpt, ref: `opt['${sanitizedOpt}']`, definition: opt })
      }
    }
    return codeRefs
  }


  return { generate }
}

module.exports = { Generator }
