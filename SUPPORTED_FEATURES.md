Assessment of missing OAS features...


| Category | Feature | Supported |
|----------|---------|-----------|
|  jsonSchemaDialect | | No |
| WebHooks |         | No        |
| Servers  | Server Variables | |
| Schema composition  | oneOf | No |
|   | allOf | No |
|   | anyOf | No |
|   | discriminator | No |
| examples  |  | Yes |
| path-item properties  | parameters | ? |
| path-item properties  | servers | ? |
| deprecated  |  | Yes. Shown in the CLI help |
| Security |  | ? |
| MarkDown fields |  | No. Currently rendered as raw markdown |
| External docs (operation level) |  | No |
| required |  | Yes. This is used to distinguish CLI arguments and options. |
| mediaType | application/x-www-form-urlencoded | No |
| | multipart | No |
| | binary file upload | No |
| Parameter Serialization | path - style/explode | No. Arrays in path params are not supported at all |
|  | query - style/explode | Partial. Only style=true && explode=false is supported |
|  | query - allowReserved | No |
|  | header - explode | No |
|  | cookie - explode | No |
| Cookie paramaters | | Somewhat supported but can't think of a practical use case. |
| JSON schema | const | Won't support unless someone has a use case. |
|    | readonly | No |




# Schema description

The tool isn't concerned with schema validation as it's focused on example generation and description rather than validation.

Describing requests has yet to be implemented. We can use https://www.npmjs.com/package/@openapi-contrib/openapi-schema-to-json-schema to normalise OAS 3.0 and 3.1.

# Priorities

