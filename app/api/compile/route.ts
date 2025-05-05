import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // Create a mock compilation result for demonstration
    // In a real implementation, this would call your C++ compiler
    const compilationResult = mockCompileCode(code)

    return NextResponse.json(compilationResult)
  } catch (error) {
    console.error("Compilation error:", error)

    // Return a properly formatted JSON error response
    return NextResponse.json(
      {
        error: "Compilation failed",
        details: error.message,
        tokens: [],
        ast: null,
        symbolTable: null,
        ir: [],
        optimizedIr: [],
        assembly: "",
        errors: {
          lexical: [{ message: "API error: " + error.message, line: 0, column: 0 }],
          syntax: [],
          semantic: [],
        },
      },
      { status: 500 },
    )
  }
}

// Mock compilation function that simulates the compiler output
function mockCompileCode(code) {
  // Simulate tokens
  const tokens = simulateTokens(code)

  // Simulate AST
  const ast = simulateAST(code)

  // Simulate symbol table
  const symbolTable = simulateSymbolTable(code)

  // Simulate IR
  const ir = simulateIR(code)

  // Simulate optimized IR
  const optimizedIr = simulateOptimizedIR(ir)

  // Simulate assembly
  const assembly = simulateAssembly(code)

  return {
    tokens,
    ast,
    symbolTable,
    ir,
    optimizedIr,
    assembly,
    errors: {
      lexical: [],
      syntax: [],
      semantic: [],
    },
  }
}

// Helper functions to simulate compiler phases
function simulateTokens(code) {
  const tokens = []
  const lines = code.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("//")) continue

    // Simple tokenization
    const words = line.split(/\s+|([;{}()=+\-*/])/g).filter(Boolean)

    for (let j = 0; j < words.length; j++) {
      const word = words[j]
      let type = "IDENTIFIER"

      if (["int", "float", "if", "else", "return", "while", "for", "print"].includes(word)) {
        type = "KEYWORD"
      } else if (/^[0-9]+(\.[0-9]+)?$/.test(word)) {
        type = "NUMBER"
      } else if ([";", "{", "}", "(", ")", "=", "+", "-", "*", "/"].includes(word)) {
        type = word === ";" || word === "{" || word === "}" || word === "(" || word === ")" ? "PUNCTUATION" : "OPERATOR"
      }

      tokens.push({
        type,
        value: word,
        line: i + 1,
        column: line.indexOf(word) + 1,
      })
    }
  }

  return tokens
}

function simulateAST(code) {
  // Simple AST simulation
  return {
    type: "Program",
    children: [
      {
        type: "FunctionDeclaration",
        children: [
          { type: "Type", value: "int" },
          { type: "Identifier", value: "main" },
          {
            type: "Parameters",
            children: [],
          },
          {
            type: "Block",
            children: [
              {
                type: "ReturnStatement",
                children: [{ type: "NumberLiteral", value: "0" }],
              },
            ],
          },
        ],
      },
    ],
  }
}

function simulateSymbolTable(code) {
  return {
    scopes: {
      global: {
        parent: null,
        symbols: {
          main: {
            name: "main",
            type: "int",
            kind: "function",
            line: 1,
            column: 5,
            params: [],
          },
        },
      },
      function_main: {
        parent: "global",
        symbols: {},
      },
    },
    currentScope: "global",
  }
}

function simulateIR(code) {
  return [
    { op: "FUNCTION_START", result: "main", arg1: "", arg2: "" },
    { op: "RETURN", result: "", arg1: "0", arg2: "" },
    { op: "FUNCTION_END", result: "main", arg1: "", arg2: "" },
  ]
}

function simulateOptimizedIR(ir) {
  // Just return the same IR for now
  return [...ir]
}

function simulateAssembly(code) {
  return `; Generated x86-64 Assembly
section .text
    global main

main:
    push rbp
    mov rbp, rsp
    
    ; Return 0
    mov eax, 0
    
    pop rbp
    ret
`
}
