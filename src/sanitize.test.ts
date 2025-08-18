import { test, describe } from 'node:test'
import { strict as assert } from 'node:assert'
import { sanitizeString, sanitizeComment, sanitizeVariable } from './sanitize.ts'

describe('sanitize', () => {

  test('should sanitize string', () => {
    //Should escape backslash and escape quote 
    assert.equal(sanitizeString("f\no\\'o"), "f\\no\\\\\\'o")
  })

  test('should sanitize comments', () => {
    assert.equal(sanitizeComment("blah 1 !@£$%^&*(JaJa 😍"), "blah 1 !@$%^&*(JaJa ")
  })

  test('should sanitize variable names', () => {
    assert.equal(sanitizeVariable("1blah blah 1 !@£$%^&*(JaJa 😍"), "var1blahblah1JaJa")
  })

})
