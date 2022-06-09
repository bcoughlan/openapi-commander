# openapi-commander

Generate a CLI tool from an OpenAPI definition using the Node.js [commander](https://www.npmjs.com/package/commander) library.

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

# Setup

1. Create an npm project with `npm init` or use an existing one. Your Node.js version must be 18+

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

# Build standalone binaries

To build standalone binaries for each platform I recommend [vercel/pkg](https://github.com/vercel/pkg).

# A very incomplete TODO list...

- Fix GitHub actions build
- Make global options like --server configurable in file, e.g. `node cli.js settings server https://example.com`.
- Auto-detect request body type from file.
- Show JSON & YAML examples with comments for field descriptions.
  -> Strip comments from JSON when passing in
- Ability to print out a curl command instead of fetching e.g. --debug=curl https://github.com/xxorax/node-shell-escape/blob/master/README.md
- Strip html/markdown from description
- Path parameters containing arrays and objects https://swagger.io/docs/specification/serialization/
- application/x-www-form-urlencoded content types.
- Server templating.
- Autocomplete.

# Contributing

This is a hobby side project so I probably won't fix and bugs but I will do my best to discuss issues, review PRs
and keep the project maintained. Please open an issue for discussion before opening any significant PRs to avoid any disappointment
about project scope.
