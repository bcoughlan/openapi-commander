/**
 * This module is used to convert the OpenAPI spec to an intermediate data structure representing
 * the command line program. Having a common intermediate structure (will) allow us to generate related
 * artifacts such as autocomplete files and documentation without duplicating logic.
 */

import { getExamples } from "./spec-utils";
import kebabCase from "lodash/kebabCase";
import camelCase from "lodash/camelCase";
import { CLI } from './intermediate-model'
import { OAS31Flat } from "./oas31-types"
import { trimDescription, UniqueNameGenerator } from "./utils";

const GLOBAL_FLAGS = ['v', 'verbose', 'p', 'print', 's', 'server', 'h', 'header']
const FORBIDDEN_HEADERS = ['accept', 'content-type', 'authorization']

export function convertToIntermediate(spec: OAS31Flat.Document, cmdName: string): CLI.Program {
  const grouped = groupEndpointsByFirstTag(spec)
  const tags = getOrderedTags(spec, grouped)

  const program: CLI.Program = {
    name: cmdName,
    helpText: spec.info.description,
    defaultServer: spec.servers?.[0]?.url,
    commands: []
  }

  //commands with no tags just become root-level commands
  for (const endpoint of grouped[''] ?? []) {
    program.commands.push(createCommand(endpoint));
  }

  for (const tag of tags) {
    const group: CLI.CommandGroup = {
      type: 'group',
      name: tag.name,
      summary: trimDescription(tag.description),
      description: tag.description,
      subcommands: (grouped[tag.name] ?? []).map(createCommand)
    }
    program.commands.push(group)
  }

  return program
}

function createCommand(endpoint: Endpoint): CLI.Command {
  const { operation, method, path } = endpoint

  let name
  if (!operation.operationId) {
    name = camelCase(`${method.toLowerCase()}=${path.replace(/\//g, '_')}`)
  } else {
    name = camelCase(operation.operationId)
  }

  const deprecated = operation.deprecated ? '*DEPRECATED* ': ''
  const summary = deprecated + (operation.summary || operation.description)
  const description = deprecated + (operation.description || operation.summary)

  return {
    type: 'command',
    name,
    summary: summary ?? trimDescription(description),
    description,
    arguments: getArguments(endpoint),
    examples: getExamples(endpoint.operation),
    api: {
      method,
      path
    }
  }
}

function getArguments(endpoint: Endpoint) : CLI.Argument[] {
  const args : CLI.Argument[] = []

  const unique = UniqueNameGenerator(GLOBAL_FLAGS)

  //Parameters
  for (const p of endpoint.allParameters) {
    //OpenAPI spec: If 'in' is "header" and the name field is "Accept", "Content-Type"
    // or "Authorization", it shall be ignored.
    if (p.in === 'header' && FORBIDDEN_HEADERS.includes(p.name?.toLowerCase())) {
      continue
    }

    //Ignore unknown parameter types
    if (!['path', 'header', 'cookie', 'query'].includes(p.in)) {
      console.error('WARNING: Ignoring unknown parameter type:', p.in)
      continue
    }

    const valueType = p.schema?.type === 'array' ? 'multi' : 'single'
    const description = ((p.deprecated ? '*DEPRECATED* ' : '') +
      (valueType === 'multi' ? 'Comma-separated list. ': '') + 
      (p.description ?? '')).trim()
    
    const argBase : CLI.ArgumentBase = {
      name: unique.get(kebabCase(p.name)),
      description,
      choices: p.schema?.enum,
      valueType: 'multi',
      mapping: { type: 'parameter', definition: p }
    }

    const isOption = p.schema?.type === 'array' || !p.required || p.schema?.default !== undefined
    if (isOption) {
      args.push({ ...argBase, 
        type: 'option',
        flag: unique.isUsed(argBase.name[0]) ? undefined : argBase.name[0],
        default: p.schema?.default
      })
    } else {
      args.push({ ...argBase, type: 'positional' })
    }
  }

  //Request body and content-type arguments
  const requestBody = endpoint.operation.requestBody
  if (requestBody) {
    const contentTypes = Object.keys(requestBody.content)
    const hasWildcardType = contentTypes.some(t => t.includes('*'))
    let defaultContentType = undefined
    if (!hasWildcardType) {
      defaultContentType = contentTypes[0]
    }

    args.push({
      type: requestBody.required ? 'positional' : 'option',
      name: unique.get('body'),
      description: 'Path to a file containing the request body.',
      valueType: 'single',
      mapping: {type: 'requestBody', defaultContentType},
      flag: undefined,
      default: undefined
    })

    const types = Object.keys(requestBody.content)
    if (hasWildcardType || types.length > 1) {
      args.push({
        //content-type is required if it doesn't have a default
        type: (requestBody.required && defaultContentType === undefined) ? 'positional' : 'option',
        name: unique.get('content-type'),
        //This is just to make the CLI output more readable
        valueName: 'type',
        description: 'Content type of the request body.',
        //Wildcard types - being a bit lazy and just not enforcing choices in that case
        choices: hasWildcardType? undefined : types,
        valueType: 'single',
        mapping: {type: 'contentType'},
        flag: undefined,
        default: defaultContentType
      })
    }
  }

  return args
}


type Endpoint = {
  path: string,
  method: string,
  operation: OAS31Flat.OperationObject,
  /** Path-level paramaeters and operation paramaters */
  allParameters: OAS31Flat.ParameterObject[]
}
type GroupedEndpoints = {[tag: string]: Endpoint[]}

function groupEndpointsByFirstTag(api: OAS31Flat.Document) {
  const grouped: GroupedEndpoints = {}

  for (const [path, pathItem] of Object.entries(api.paths)) {
    for (const method of Object.values(OAS31Flat.HttpMethods)) {
      if (pathItem && method in pathItem) {
        const operation = pathItem?.[method]
        if (operation) {
          const allParameters = (pathItem?.parameters ?? []).concat(operation.parameters ?? [])
          const tag = operation.tags?.[0] ?? ''
          grouped[tag] = grouped[tag] || []
          grouped[tag].push({ allParameters, path, method, operation })
        }
      }
    }
  }
  return grouped
}

/**
 * Tags don't have to be defined in the 'tags' part of the spec, but if they are we want the tags
 * to be defined in the order that the user has defined.
 */
function getOrderedTags(doc: OAS31Flat.Document, endpointsByTag: GroupedEndpoints): OAS31Flat.TagObject[] {
  //filter tags that are not referenced by any operations
  const usedTagNames = Object.keys(endpointsByTag).filter(t => t.length > 0)
  const tags = (doc.tags ?? []).filter(e => usedTagNames.includes(e.name))
  //add any tags defined in operations but not defined in the 'tags' OpenAPI section
  const definedTagNames = new Set((doc.tags ?? []).map(e => e.name))
  for (const tag of usedTagNames) {
    if (!definedTagNames.has(tag)) tags.push({ name: tag })
  }
  return tags
}
