# OpenAPI Commander

<!-- generated with "markdown-toc -i README.md" -->
<!-- toc -->

- [Overview](#overview)
- [Features](#features)
- [Setup](#setup)
- [Examples](#examples)
  * [Commands grouped by tag](#commands-grouped-by-tag)
  * [Basic GET example](#basic-get-example)
  * [Global options](#global-options)
    + [Custom server](#custom-server)
    + [Set Authorization header](#set-authorization-header)
    + [Print request without sending](#print-request-without-sending)
    + [Print a curl command of the request](#print-a-curl-command-of-the-request)
  * [Print example request bodies](#print-example-request-bodies)
- [Build standalone binaries](#build-standalone-binaries)
- [A very incomplete TODO list...](#a-very-incomplete-todo-list)
- [Contributing](#contributing)

<!-- tocstop -->

# Overview

Generate a Node.js command line tool from an OpenAPI definition using the
[commander](https://www.npmjs.com/package/commander) library.

It can be used as a starter for writing command line tools that talk to APIs,
or as an alternative to using curl to work with APIs.

# Features

- Generate clean code from your spec.
- Supports Swagger 2, OpenAPI 3.0 and 3.1.
- Show examples of request bodies, using examples from the spec or generated with [openapi-sampler](https://github.com/Redocly/openapi-sampler).
- Verbose mode to see response headers.
- Print a curl command of the request.

# Setup

1. Create an npm project with `npm init` or use an existing one. Your Node.js version must be 16+

2. Install dependencies

```
npm install commander@9
npm install --save-dev openapi-commander
```

3. Generate the CLI code

```
npx openapi-commander generate <path or URL to spec> <output file>
```

e.g.

```
npx openapi-commander generate https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml petstore.js
```

4. Run

```
node petstore.js ...
```
# Examples

## Subcommands

The commands are grouped by their first tag in the OpenAPI spec (the same logic
that Swagger UI uses). Operations

```
~/petstore$ node petstore.js

Usage: petstore [options] [command]

Options:
  -p, --print <mode>     Print the HTTP request instead of sending it. (choices: "curl", "plain")
  -s, --server <server>  Server to use
  -a, --auth <auth>      Authorization header to send
  -h, --help             display help for command

Commands:
  pet                    Everything about your Pets
  store
  user                   Operations about user
  help [command]         display help for command
```

```
~/petstore$ node petstore.js pet
Usage: petstore pet [options] [command]

Everything about your Pets

Options:
  -h, --help                           display help for command

Commands:
  updatePet [options] <body>           Update an existing pet
  addPet [options] <body>              Add a new pet to the store
  findPetsByStatus [options]           Finds Pets by status
  findPetsByTags [options]             *DEPRECATED* Finds Pets by tags
  getPetById <petId>                   Find pet by ID
  updatePetWithForm [options] <petId>  Updates a pet in the store with form data
  deletePet [options] <petId>          Deletes a pet
  uploadFile [options] <petId>         uploads an image
  help [command]                       display help for command
```


## Basic GET example

```
~/petstore$ node petstore.js pet getPetById 1
Status: 200
{
  "id": 1,
  "category": {
    "id": 1,
    "name": "Hola"
  },
  "name": "Perrito",
  "photoUrls": [
    "/tmp/inflector995596007222725944.tmp"
  ],
  "tags": [
    {
      "id": 1,
      "name": "Bizcocho"
    }
  ],
  "status": "available"
}
```

You can also add the `-v` flag to show response headers.

## Global options

### Custom server

```
~/petstore$ node petstore.js -s https://mypetstore.example pet getPetById 1
```

Alternatively you can override it by setting the environment variable `{COMMANDNAME}_SERVER`, e.g. `PETSTORE_SERVER`.

### Set Authorization header

```
~/petstore$ node petstore.js -a 'Bearer mytoken' getPetById 1
```

Alternatively you can override it by setting the environment variable `{COMMANDNAME}_AUTH`, e.g. `PETSTORE_AUTH`.

### Print request without sending

```
~/petstore$ node petstore.js pet -a 'Bearer mytoken' -s https://mypetstore.example getPetById 1 --print plain
GET https://mypetstore.example/pet/1
Authorization: Bearer mytoken
Accept: application/json
```

### Print a curl command of the request

```
~/petstore$ node petstore.js pet -a 'Bearer mytoken' -s https://mypetstore.example getPetById 1 --print curl
curl -X GET -H 'Authorization: Bearer mytoken' -H 'Accept: application/json' 'https://mypetstore.example/pet/1'
```

## Print example request bodies

```
~/petstore$ node petstore.js pet updatePet examples
Example for application/json:
{
  "id": 10,
  "name": "doggie",
  "category": {
    "id": 1,
    "name": "Dogs"
  },
  "photoUrls": [
    "string"
  ],
  "tags": [
    {
      "id": 0,
      "name": "string"
    }
  ],
  "status": "available"
}
```

# Build standalone binaries

To build multi-platform standalone binaries platform I recommend [vercel/pkg](https://github.com/vercel/pkg).

# A very incomplete TODO list...

The top priority is to beef up the test suite.

- Syntax highlighting of examples
- Implement different security/auth types.
- Auto-detect request body type from file.
- Show JSON & YAML examples with comments for field descriptions.
  -> Strip comments from JSON when passing in
- Strip html/markdown from description
- More serialization options https://swagger.io/docs/specification/serialization/
- application/x-www-form-urlencoded content types.
- Server templating.
- Autocomplete.

# Contributing

This is a hobby side project so I have limited time to work on issues but I will 
do my best to discuss issues, review PRs and keep the project maintained. Please
open an issue for discussion before opening any significant PRs to avoid any
disappointment about project scope.
