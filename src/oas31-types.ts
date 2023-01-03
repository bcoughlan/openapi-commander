/**
 * Modified from here: https://github.com/kogosoftwarellc/open-api/tree/master/packages/openapi-types#readme
 * 
 * - Keeping only the OAS 3.1 types to make them more readable
 * - Removed the generics parameter for extensions (can add it in again later if it becomes needed).
 * - Introduce a version without 'ReferenceObject' to make it easier to work with dereffed specs.
 */

/* eslint-disabletypescript-eslint/no-explicit-any */

export namespace OAS31 {

  export interface Document {
    openapi: string;
    info: InfoObject;
    externalDocs?: ExternalDocumentationObject;
    servers?: ServerObject[];
    jsonSchemaDialect?: string;
    paths: PathsObject;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    webhooks?: Record<string, PathItemObject | ReferenceObject>;
  }


  export interface InfoObject {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    summary?: string;
    license?: LicenseObject;
    version: string;
  }

  export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
  }

  export interface LicenseObject {
    name: string;
    url?: string;
    identifier?: string;
  }

  export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
  }

  export interface ServerVariableObject {
    enum?: [string, ...string[]];
    default: string;
    description?: string;
  }

  export type PathsObject = Record<
    string,
    PathItemObject | undefined
  >;

  // All HTTP methods allowed by OpenAPI 3 spec
  // See https://swagger.io/specification/#path-item-object
  // You can use keys or values from it in TypeScript code like this:
  //     for (const method of Object.values(OpenAPIV3.HttpMethods)) { … }
  export enum HttpMethods {
    GET = 'get',
    PUT = 'put',
    POST = 'post',
    DELETE = 'delete',
    OPTIONS = 'options',
    HEAD = 'head',
    PATCH = 'patch',
    TRACE = 'trace',
  }

  export type PathItemObject = {
    $ref?: string;
    summary?: string;
    description?: string;
    servers?: ServerObject[];
    parameters?: (ReferenceObject | ParameterObject)[];
  } & {
    [method in HttpMethods]?: OperationObject;
  };

  export type OperationObject = {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ReferenceObject | ParameterObject)[];
    requestBody?: ReferenceObject | RequestBodyObject;
    responses: ResponsesObject;
    callbacks?: Record<string, ReferenceObject | CallbackObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
  }

  export interface ExternalDocumentationObject {
    description?: string;
    url: string;
  }

  export interface ParameterObject extends ParameterBaseObject {
    name: string;
    in: string;
  }

  export interface HeaderObject extends ParameterBaseObject {}
  
  export interface ParameterBaseObject {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: ReferenceObject | SchemaObject;
    example?: any;
    examples?: { [media: string]: ReferenceObject | ExampleObject };
    content?: { [media: string]: MediaTypeObject };
  }

  export type NonArraySchemaObjectType =
    | 'boolean'
    | 'object'
    | 'number'
    | 'string'
    | 'integer'
    | 'null';
  export type ArraySchemaObjectType = 'array';

  /**
   * There is no way to tell typescript to require items when type is either 'array' or array containing 'array' type
   * 'items' will be always visible as optional
   * Casting schema object to ArraySchemaObject or NonArraySchemaObject will work fine
   */
  export type SchemaObject =
    | ArraySchemaObject
    | NonArraySchemaObject
    | MixedSchemaObject;

  export interface ArraySchemaObject extends BaseSchemaObject {
    type: ArraySchemaObjectType;
    items: ReferenceObject | SchemaObject;
  }

  export interface NonArraySchemaObject extends BaseSchemaObject {
    type?: NonArraySchemaObjectType;
  }

  interface MixedSchemaObject extends BaseSchemaObject {
    type?: (ArraySchemaObjectType | NonArraySchemaObjectType)[];
    items?: ReferenceObject | SchemaObject;
  }

  export interface BaseSchemaObject {
    $schema?: string;
    title?: string;
    description?: string;
    format?: string;
    default?: any;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean | number;
    minimum?: number;
    exclusiveMinimum?: boolean | number;
    contentMediaType?: string;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalProperties?: boolean | ReferenceObject | SchemaObject;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    properties?: {
      [name: string]: ReferenceObject | SchemaObject;
    };
    allOf?: (ReferenceObject | SchemaObject)[];
    oneOf?: (ReferenceObject | SchemaObject)[];
    anyOf?: (ReferenceObject | SchemaObject)[];
    not?: ReferenceObject | SchemaObject;

    // OpenAPI-specific properties
    nullable?: boolean;
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    examples?: BaseSchemaObject['example'][]
    deprecated?: boolean;
    const?: any;
  }

  export interface DiscriminatorObject {
    propertyName: string;
    mapping?: { [value: string]: string };
  }

  export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  }

  export interface ReferenceObject {
    $ref: string;
    summary?: string;
    description?: string;
  }

  export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
  }

  export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: Record<string, ReferenceObject | ExampleObject>;
    encoding?: { [media: string]: EncodingObject };
  }

  export interface EncodingObject {
    contentType?: string;
    headers?: { [header: string]: ReferenceObject | HeaderObject };
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
  }

  export interface RequestBodyObject {
    description?: string;
    content: { [media: string]: MediaTypeObject };
    required?: boolean;
  }

  export type ResponsesObject = Record<
    string,
    ReferenceObject | ResponseObject
  >;

  export interface ResponseObject {
    description: string;
    headers?: { [header: string]: ReferenceObject | HeaderObject };
    content?: { [media: string]: MediaTypeObject };
    links?: { [link: string]: ReferenceObject | LinkObject };
  }

  export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: { [parameter: string]: any };
    requestBody?: any;
    description?: string;
    server?: ServerObject;
  }

  export type CallbackObject = Record<string, PathItemObject | ReferenceObject>;

  export interface SecurityRequirementObject {
    [name: string]: string[];
  }


  export interface ComponentsObject {
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ReferenceObject | ResponseObject>;
    parameters?: Record<string, ReferenceObject | ParameterObject>;
    examples?: Record<string, ReferenceObject | ExampleObject>;
    requestBodies?: Record<string, ReferenceObject | RequestBodyObject>;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    securitySchemes?: Record<string, ReferenceObject | SecuritySchemeObject>;
    links?: Record<string, ReferenceObject | LinkObject>;
    callbacks?: Record<string, ReferenceObject | CallbackObject>;
    pathItems?: Record<string, ReferenceObject | PathItemObject>;
  }

  export type SecuritySchemeObject =
    | HttpSecurityScheme
    | ApiKeySecurityScheme
    | OAuth2SecurityScheme
    | OpenIdSecurityScheme;

  export interface HttpSecurityScheme {
    type: 'http';
    description?: string;
    scheme: string;
    bearerFormat?: string;
  }

  export interface ApiKeySecurityScheme {
    type: 'apiKey';
    description?: string;
    name: string;
    in: string;
  }

  export interface OAuth2SecurityScheme {
    type: 'oauth2';
    description?: string;
    flows: {
      implicit?: {
        authorizationUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      password?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      clientCredentials?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
    };
  }

  export interface OpenIdSecurityScheme {
    type: 'openIdConnect';
    description?: string;
    openIdConnectUrl: string;
  }

  export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
  }
}

/**
 * Types for a fully dereferenced spec
 */
export namespace OAS31Flat {

  export interface Document {
    openapi: string;
    info: InfoObject;
    externalDocs?: ExternalDocumentationObject;
    servers?: ServerObject[];
    jsonSchemaDialect?: string;
    paths: PathsObject;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    webhooks?: Record<string, PathItemObject>;
  }


  export interface InfoObject {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    summary?: string;
    license?: LicenseObject;
    version: string;
  }

  export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
  }

  export interface LicenseObject {
    name: string;
    url?: string;
    identifier?: string;
  }

  export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
  }

  export interface ServerVariableObject {
    enum?: [string, ...string[]];
    default: string;
    description?: string;
  }

  export type PathsObject = Record<
    string,
    PathItemObject | undefined
  >;

  // All HTTP methods allowed by OpenAPI 3 spec
  // See https://swagger.io/specification/#path-item-object
  // You can use keys or values from it in TypeScript code like this:
  //     for (const method of Object.values(OpenAPIV3.HttpMethods)) { … }
  export enum HttpMethods {
    GET = 'get',
    PUT = 'put',
    POST = 'post',
    DELETE = 'delete',
    OPTIONS = 'options',
    HEAD = 'head',
    PATCH = 'patch',
    TRACE = 'trace',
  }

  export type PathItemObject = {
    $ref?: string;
    summary?: string;
    description?: string;
    servers?: ServerObject[];
    parameters?: ParameterObject[];
  } & {
    [method in HttpMethods]?: OperationObject;
  };

  export type OperationObject = {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: ParameterObject[];
    requestBody?: RequestBodyObject;
    responses: ResponsesObject;
    callbacks?: Record<string, CallbackObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
  }

  export interface ExternalDocumentationObject {
    description?: string;
    url: string;
  }

  export interface ParameterObject extends ParameterBaseObject {
    name: string;
    in: ParameterType;
  }

  export type ParameterType = 'path' | 'query' | 'header' | 'cookie';

  export interface HeaderObject extends ParameterBaseObject {}
  
  export interface ParameterBaseObject {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject;
    example?: any;
    examples?: { [media: string]: ExampleObject };
    content?: { [media: string]: MediaTypeObject };
  }

  export type NonArraySchemaObjectType =
    | 'boolean'
    | 'object'
    | 'number'
    | 'string'
    | 'integer'
    | 'null';
  export type ArraySchemaObjectType = 'array';

  /**
   * There is no way to tell typescript to require items when type is either 'array' or array containing 'array' type
   * 'items' will be always visible as optional
   * Casting schema object to ArraySchemaObject or NonArraySchemaObject will work fine
   */
  export type SchemaObject =
    | ArraySchemaObject
    | NonArraySchemaObject
    | MixedSchemaObject;

  export interface ArraySchemaObject extends BaseSchemaObject {
    type: ArraySchemaObjectType;
    items: SchemaObject;
  }

  export interface NonArraySchemaObject extends BaseSchemaObject {
    type?: NonArraySchemaObjectType;
  }

  interface MixedSchemaObject extends BaseSchemaObject {
    type?: (ArraySchemaObjectType | NonArraySchemaObjectType)[];
    items?: SchemaObject;
  }

  export interface BaseSchemaObject {
    $schema?: string;
    title?: string;
    description?: string;
    format?: string;
    default?: any;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean | number;
    minimum?: number;
    exclusiveMinimum?: boolean | number;
    contentMediaType?: string;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalProperties?: boolean  | SchemaObject;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    properties?: {
      [name: string]: SchemaObject;
    };
    allOf?: SchemaObject[];
    oneOf?: SchemaObject[];
    anyOf?: SchemaObject[];
    not?: SchemaObject;

    // OpenAPI-specific properties
    nullable?: boolean;
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    examples?: BaseSchemaObject['example'][]
    deprecated?: boolean;
    const?: any;
  }

  export interface DiscriminatorObject {
    propertyName: string;
    mapping?: { [value: string]: string };
  }

  export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  }

  export interface ReferenceObject {
    $ref: string;
    summary?: string;
    description?: string;
  }

  export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
  }

  export interface MediaTypeObject {
    schema?: SchemaObject ;
    example?: any;
    examples?: Record<string, ExampleObject>;
    encoding?: { [media: string]: EncodingObject };
  }

  export interface EncodingObject {
    contentType?: string;
    headers?: { [header: string]: HeaderObject };
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
  }

  export interface RequestBodyObject {
    description?: string;
    content: { [media: string]: MediaTypeObject };
    required?: boolean;
  }

  export type ResponsesObject = Record<
    string,
    ResponseObject
  >;

  export interface ResponseObject {
    description: string;
    headers?: { [header: string]: HeaderObject };
    content?: { [media: string]: MediaTypeObject };
    links?: { [link: string]: LinkObject };
  }

  export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: { [parameter: string]: any };
    requestBody?: any;
    description?: string;
    server?: ServerObject;
  }

  export type CallbackObject = Record<string, PathItemObject >;

  export interface SecurityRequirementObject {
    [name: string]: string[];
  }


  export interface ComponentsObject {
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ResponseObject>;
    parameters?: Record<string, ParameterObject>;
    examples?: Record<string, ExampleObject>;
    requestBodies?: Record<string, RequestBodyObject>;
    headers?: Record<string, HeaderObject>;
    securitySchemes?: Record<string, SecuritySchemeObject>;
    links?: Record<string, LinkObject>;
    callbacks?: Record<string, CallbackObject>;
    pathItems?: Record<string, PathItemObject>;
  }

  export type SecuritySchemeObject =
    | HttpSecurityScheme
    | ApiKeySecurityScheme
    | OAuth2SecurityScheme
    | OpenIdSecurityScheme;

  export interface HttpSecurityScheme {
    type: 'http';
    description?: string;
    scheme: string;
    bearerFormat?: string;
  }

  export interface ApiKeySecurityScheme {
    type: 'apiKey';
    description?: string;
    name: string;
    in: string;
  }

  export interface OAuth2SecurityScheme {
    type: 'oauth2';
    description?: string;
    flows: {
      implicit?: {
        authorizationUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      password?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      clientCredentials?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
      authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        refreshUrl?: string;
        scopes: { [scope: string]: string };
      };
    };
  }

  export interface OpenIdSecurityScheme {
    type: 'openIdConnect';
    description?: string;
    openIdConnectUrl: string;
  }

  export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
  }
}
