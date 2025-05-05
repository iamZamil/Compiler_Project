import type { Token, CompilerError } from "./types"

// Token types
const TOKEN_TYPES = {
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  STRING: "STRING",
  OPERATOR: "OPERATOR",
  PUNCTUATION: "PUNCTUATION",
  COMMENT: "COMMENT",
  WHITESPACE: "WHITESPACE",
}

// Keywords in our language
const KEYWORDS = [
  "int",
  "float",
  "bool",
  "void",
  "if",
  "else",
  "while",
  "for",
  "return",
  "true",
  "false",
  "print",
  "read",
  "switch",
  "case",
  "default",
  "break",
]

// Operators
const OPERATORS = ["+", "-", "*", "/", "%", "=", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!"]

// Punctuation
const PUNCTUATION = ["(", ")", "{", "}", "[", "]", ";", ",", "."]

// Regular expressions for token patterns
const PATTERNS = {
  WHITESPACE: /^\s+/,
  COMMENT_SINGLE: /^\/\/.*$/,
  COMMENT_MULTI: /^\/\*[\s\S]*?\*\//,
  NUMBER: /^[0-9]+(\.[0-9]+)?/,
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*/,
  STRING: /^"([^"\\]|\\.)*"/,
  OPERATOR: new RegExp(`^(${OPERATORS.map((op) => op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`),
  PUNCTUATION: new RegExp(`^(${PUNCTUATION.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`),
}

export function tokenize(input: string): { tokens: Token[]; errors: CompilerError[] } {
  const tokens: Token[] = []
  const errors: CompilerError[] = []

  let line = 1
  let column = 1
  let pos = 0

  while (pos < input.length) {
    let matched = false
    const currentInput = input.slice(pos)

    // Skip whitespace but track line/column
    const whitespaceMatch = currentInput.match(PATTERNS.WHITESPACE)
    if (whitespaceMatch) {
      const whitespace = whitespaceMatch[0]
      for (let i = 0; i < whitespace.length; i++) {
        if (whitespace[i] === "\n") {
          line++
          column = 1
        } else {
          column++
        }
      }
      pos += whitespace.length
      matched = true
      continue
    }

    // Skip comments
    const singleCommentMatch = currentInput.match(PATTERNS.COMMENT_SINGLE)
    if (singleCommentMatch) {
      const comment = singleCommentMatch[0]
      pos += comment.length
      line++
      column = 1
      matched = true
      continue
    }

    const multiCommentMatch = currentInput.match(PATTERNS.COMMENT_MULTI)
    if (multiCommentMatch) {
      const comment = multiCommentMatch[0]
      const lines = comment.split("\n")
      line += lines.length - 1
      if (lines.length > 1) {
        column = lines[lines.length - 1].length + 1
      } else {
        column += comment.length
      }
      pos += comment.length
      matched = true
      continue
    }

    // Match identifiers and keywords
    const identifierMatch = currentInput.match(PATTERNS.IDENTIFIER)
    if (identifierMatch) {
      const value = identifierMatch[0]
      const type = KEYWORDS.includes(value) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER
      tokens.push({ type, value, line, column })
      pos += value.length

      column += value.length
      matched = true
      continue
    }

    // Match numbers
    const numberMatch = currentInput.match(PATTERNS.NUMBER)
    if (numberMatch) {
      const value = numberMatch[0]
      tokens.push({ type: TOKEN_TYPES.NUMBER, value, line, column })
      pos += value.length
      column += value.length
      matched = true
      continue
    }

    // Match strings
    const stringMatch = currentInput.match(PATTERNS.STRING)
    if (stringMatch) {
      const value = stringMatch[0]
      tokens.push({ type: TOKEN_TYPES.STRING, value, line, column })
      pos += value.length
      column += value.length
      matched = true
      continue
    }

    // Match operators
    const operatorMatch = currentInput.match(PATTERNS.OPERATOR)
    if (operatorMatch) {
      const value = operatorMatch[0]
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value, line, column })
      pos += value.length
      column += value.length
      matched = true
      continue
    }

    // Match punctuation
    const punctuationMatch = currentInput.match(PATTERNS.PUNCTUATION)
    if (punctuationMatch) {
      const value = punctuationMatch[0]
      tokens.push({ type: TOKEN_TYPES.PUNCTUATION, value, line, column })
      pos += value.length
      column += value.length
      matched = true
      continue
    }

    // If no match was found, report an error
    if (!matched) {
      errors.push({
        message: `Unexpected character: ${input[pos]}`,
        line,
        column,
      })
      pos++
      column++
    }
  }

  return { tokens, errors }
}
