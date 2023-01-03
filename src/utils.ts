import { camelCase } from "lodash"

export function trimDescription(str : string | undefined) : string | undefined {
  if (!str) return undefined
  const lines = str.split('\n')

  if (lines.length > 1) return lines[0] + '...'
  return lines[0]
}

/** Escape arg for shell */
export function shellEscape(str : string) : string {
  return "'" + str.replace("'", "'\\''") + "'"
}

//Generate non-clashing names. Adds a number (1, 2, 3, ...) to the end if already used.
export function UniqueNameGenerator(initial? : string[]) {
  const used = new Set(initial) ?? new Set()

  return {
    get: (name : string) => {
      if (!used.has(name)) {
        used.add(name)
        return name
      }

      for (let i = 1; ; i++) {
        if (!used.has(name + i)) {
          used.add(name + i)
          return name + i
        }
      }
    },
    isUsed: (name : string) => used.has(name)
  }
}

const reservedKeywords = [
  "break",  "case",  "catch",  "class",  "const",  "continue",  "debugger",  "default",  "delete",  "do",  "else", 
  "export",  "extends",  "finally",  "for",  "function",  "if",  "import",  "in",  "instanceof",  "new",  "return",
  "super",  "switch",  "this",  "throw",  "try",  "typeof",  "var",  "void",  "while",  "with",  "yield",
  "enum",  "implements",  "interface",  "let",  "package",  "private",  "protected",  "public",  "static",  "await"
]

//Generate non-clashing variable names. Adds a number (1, 2, 3, ...) to the end if already used.
export function UniqueVarGenerator() {
  const gen = UniqueNameGenerator(reservedKeywords)
  
  return {
    get: (name : string) => {
      return gen.get(camelCase(name))
    }
  }
}