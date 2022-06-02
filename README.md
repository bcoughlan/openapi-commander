# openapi-commander

Generate a CLI tool from an OpenAPI definition using the Node.js [commander](https://www.npmjs.com/package/commander) library.

[![asciicast](https://asciinema.org/a/15qeq95z4k9AG1TaDJ98RhDRW.svg)](https://asciinema.org/a/15qeq95z4k9AG1TaDJ98RhDRW)

# Setup

1. Create an npm project with `npm init` or use an existing one. Your Node.js version must be 18+

2. Install the `commander` dependency.

```
npm install commander@9
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
node petstore.js pet getPetById 1
```

# A very incomplete TODO list...

- Create a boilerplate repo or 'npx openapi-commander init' that people can clone/fork as a starter project.
- Replace fetch() with a HTTP client dependency because of experimental warnings.
- Make compatible with at least node 16.
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

This is a hobby side project so I probably won't fix so my only promise is I will do my best to discuss issues, review PRs
and keep the project maintained. Please open an issue for discussion before opening any significant PRs to avoid any disappointment
about project scope.
