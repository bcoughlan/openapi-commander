import * as OpenAPISampler from 'openapi-sampler'
import jsYaml from 'js-yaml'
import { OAS31Flat } from "./oas31-types"
import type { JSONSchema7 } from 'json-schema'

export function getExamples(operation : OAS31Flat.OperationObject) : {[contentType: string]: string[]} {
  function renderExample(example : object | string, contentType : string) : string | null {
    if (typeof example === 'string') {
      return example
    } else if (contentType === 'application/json') {
      return JSON.stringify(example, null, 2)
    } else if (contentType === 'application/yaml') {
      return jsYaml.dump(example)
    }

    //TODO application/xml
    //TODO application/x-www-form-urlencoded
    return null
  }

  const content = operation?.requestBody?.content
  if (!content) return {}

  const examples : Record<string, string[]> = {}
  let found = false
  for (const [contentType, mediaType] of Object.entries(content)) {
    const ex = Object.values(mediaType.examples || {})
    if (ex.length) {
      examples[contentType] = examples[contentType] || []
      const example = renderExample(ex, contentType)
      if (example) {
        examples[contentType].push(example)
      }
      found = true
    }
  }
  if (found) return examples

  //Auto-generate examples for specs that don't define examples
  const sampler : Record<string, string[]> = {}
  for (const [contentType, mediaType] of Object.entries(content)) {
    if (mediaType.schema) {
      const example = renderExample(OpenAPISampler.sample(mediaType.schema as JSONSchema7) as string, contentType)
      if (example) {
        sampler[contentType] = [example]
      }
    }
  }
  
  return sampler
}