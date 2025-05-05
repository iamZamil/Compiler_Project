import type { CompilationResult } from "./types"

export async function compileCode(code: string): Promise<CompilationResult> {
  try {
    const response = await fetch("/api/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })

    // Parse the JSON response
    const data = await response.json()

    // Check if the response contains an error
    if (data.error) {
      throw new Error(data.details || data.error || "Unknown compilation error")
    }

    return data
  } catch (error) {
    console.error("Compilation error:", error)

    // Return a properly formatted error result
    return {
      tokens: [],
      ast: null,
      symbolTable: null,
      ir: [],
      optimizedIr: [],
      assembly: "",
      errors: {
        lexical: [{ message: error.message, line: 0, column: 0 }],
        syntax: [],
        semantic: [],
      },
    }
  }
}
