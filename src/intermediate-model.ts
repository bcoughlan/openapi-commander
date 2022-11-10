import { OAS31Flat } from "./oas31-types"
/**
 * To avoid terminology confusion we use "argument" and "option" to
 * refer to CLI arguments (and also arguments to functions in other places),
 * and "parameter" to refer to the spec definition and HTTP request.
 */
export namespace CLI {
  export interface Program {
    name: string,
    helpText?: string,
    defaultServer?: string,
    commands: (Command | CommandGroup)[],
  }

  export interface CommandGroup {
    type: 'group',
    name: string,
    /** 
     * The short summary shown on the help page of the parent command.
     * It will use the first line of the 'description' field of the tag
     * in the spec.
     */
    summary?: string,
    /** 
     * The description shown on the help page of this command.
     */
    description?: string,
    subcommands: Command[]
  }

  export interface Command {
    type: 'command',
    /** 
     * Name of the command for CLI usage. This is the camel-cased operationId.
     * If the operationId is not present it is constructed from the method
     * and the path objects.
     */
    name: string,
    /** 
     * The short summary shown on the help page of the parent command.
     * This will be trimmed to max 100 characters. It will use the 'summary'
     * field in the spec, and fall back to the 'description' if unavailable.
     */
    summary: string,
    /** 
     * The description shown on the help page of this command.
     */
    description: string,
    /** All arguments to the CLI tool, including flags and options */
    arguments: Argument[],
    /** Examples of request bodies */
    examples: {[contentType: string]: string[]},
    /** Info from the OpenAPI spec needed to make the request. */
    api: ApiCall,
  }

  export interface ApiCall {
    method: string,
    path: string
  }

  export interface ArgumentBase {
    /** 
     * The name of the argument in the CLI.
     * Parameter names in the spec are converted to kebab-case.
     * Option arguments won't include the leading '--' in this variable.
     */
    name: string,
    description?: string,
    choices?: string[],
    /**
     * The type of the value passed to this argument.
     * single: a single value is passed to this argument in the CLI.
     * multi:  a comma-separated list of values is passed
     */
    valueType: 'single' | 'multi',
    mapping: ArgMapping
  }

  export type Argument = PositionalArgument | Option

  export interface PositionalArgument extends ArgumentBase {
    type: 'positional'
  }

  export interface Option extends ArgumentBase {
    type: 'option',
    /**
     * A single letter shorthand flag, e.g. -i in place of --id.
     * The '-' is not included in the string.
     * This won't be set if it conflicts with another option's flag.
     */
    flag?: string,
    /** Default value for this option if none is specified */
    default?: string,
    /**
     * An optional shorter name to display in the option's help, i.e. --{name} <{valueName}>.
     */
    valueName?: string
  }

  export type ArgMapping = ParameterMapping | RequestBodyMapping | ContentTypeMapping
  
  export interface ParameterMapping {
    type: 'parameter',
    definition: OAS31Flat.ParameterObject
  }

  export interface RequestBodyMapping {
    type: 'requestBody',
    defaultContentType?: string
  }

  export interface ContentTypeMapping {
    type: 'contentType'
  }

}
