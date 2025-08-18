import { sanitizeString, sanitizeComment, sanitizeVariable } from './sanitize.ts'

describe('sanitize', () => {

  it('should sanitize string', () => {
    //Should escape backslash and escape quote 
    expect(sanitizeString("f\no\\'o")).toBe("f\\no\\\\\\'o")
  })

  it('should sanitize comments', () => {
    expect(sanitizeComment("blah 1 !@£$%^&*(JaJa 😍")).toBe("blah 1 !@$%^&*(JaJa ")
  })

  it('should sanitize variable names', () => {
    expect(sanitizeVariable("1blah blah 1 !@£$%^&*(JaJa 😍")).toBe("var1BlahBlah1JaJa")
  })

})
