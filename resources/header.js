/*
 * This code is generated. Do not modify this file.
 */

/* eslint-disable no-unused-vars */

const fs = require('fs/promises')
const { Command, Argument, Option } = require('commander')
const program = new Command()

function httpRequest(url, {method, body, headers}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http')
    const request = client.request(url, {headers, method}, (response) => {
      const body = []
      response.on('data', (chunk) => body.push(chunk))
      response.on('end', () => {
        resolve({body: body.join(''), status: response.statusCode, headers: response.headers})
      })
    })
    request.on('aborted', (err) => reject(err))
    request.on('error', (err) => reject(err))
    if (body) request.write(body)
    request.end()
  })
}

async function request(method, baseUrl, path, { pathParams, queryParams, headers, body, contentType }, requestImpl) {
  try {
    var fullUrl = new URL(baseUrl)
  } catch (err) {
    err.message = `Invalid base URL: ${baseUrl}`
    throw err
  }

  const definedParams = Object.entries(queryParams).filter(e => e[1] !== undefined)
  fullUrl.search = new URLSearchParams(definedParams).toString()
  if (!fullUrl.pathname.endsWith('/')) fullUrl.pathname += '/'
  fullUrl.pathname += path.split('/').map(part => {
    if (part.startsWith('{') && part.endsWith('}')) {
      return pathParams[part.substring(1, part.length - 1)]
    }
    return part
  }).join('/').slice(1)

  if (body) headers['Content-Type'] = contentType
  headers['Accept'] = 'application/json'

  if (requestImpl === 'debug') {
    console.log(method.toUpperCase(), fullUrl.toString())
    for (const [name, value] of Object.entries(headers)) {
      console.log(`${name}: ${value}`)
    }
    if (body) {
      console.log()
      console.log(body)
    }
  } else {
    // eslint-disable-next-line no-undef
    const response = await httpRequest(fullUrl.toString(), {method, body, headers})
    console.error("Status:", response.status) //stderr so body can be piped
    
    if (response.headers['content-type']?.startsWith('application/json')) {
      try {
        console.log(JSON.stringify(JSON.parse(response.body), null, 2))
      } catch (e) {
        //For misbehaving APIs
        console.log(response.body)
      }
    } else {
      console.log(response.body)
    }
  }
}

function printExamples(examplesMapping) {
  for (const [type, examples] of Object.entries(examplesMapping)) {
    for (const example of examples) {
      console.log(`Example for ${type}:`)
      console.log(example)
    }
  }
}

function getGlobalOptions() {
  return program.opts()
}

program.option('-d, --debug', 'Print the HTTP request instead of sending it')
program.option('-s, --server <server>', 'Server to use')
program.option('-a, --auth <auth>', 'Authorization header to send')
