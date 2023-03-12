import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPI, OpenAPIV2 } from "openapi-types"
import { OAS31Flat } from "./oas31-types"
import path from 'path'


/**
 * @returns a fully dereferenced OpenAPI 3.1 model
 * @param specLocation File path containing a Swagger 2, OpenAPI 3.0 or OpenAPI 3.1 YAML or JSON.
 */
export async function parseSpec(specLocation: string): Promise<OAS31Flat.Document> {
  const parsed = await SwaggerParser.parse(specLocation)

  //TODO convert OpenAPI 3.0 to OpenAPI 3.1 so we can work with a consistent format

  if ((parsed as OpenAPIV2.Document).swagger === '2.0') {
    const openapi = await convertSwaggerToOpenAPI(JSON.parse(JSON.stringify(parsed)))
    return dereference(specLocation, openapi as OpenAPI.Document)
  }
  return dereference(specLocation, parsed)

}

async function dereference(specLocation: string, spec: OpenAPI.Document) : Promise<OAS31Flat.Document> {
  if (specLocation.startsWith('http://') || specLocation.startsWith('https://')) {
    return SwaggerParser.dereference(spec) as Promise<OAS31Flat.Document>
  }

  //Seems like SwaggerParser does not work with paths
  //relative to the spec file, so we need to change the cwd
  //as a workaround. 
  const absoluteDir = path.dirname(path.resolve(specLocation))
  const oldCwd = process.cwd()
  try {
    process.chdir(absoluteDir)
    return SwaggerParser.dereference(spec) as Promise<OAS31Flat.Document>
  } finally {
    process.chdir(oldCwd)
  }
}

async function convertSwaggerToOpenAPI(swagger: object) {
  const converter = await import('swagger2openapi')
  const options = { patch: true, warnOnly: true }
  return new Promise((resolve, reject) => {
    converter.convertObj(swagger, options, (err: Error, options: { openapi: unknown }) => {
      if (err) {
        reject(err)
      } else {
        resolve(options.openapi)
      }
    })
  })
}
