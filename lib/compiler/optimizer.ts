import type { IRInstruction } from "./types"

export function optimizeIR(ir: IRInstruction[]): IRInstruction[] {
  // Make a deep copy of the IR
  const optimizedIr: IRInstruction[] = JSON.parse(JSON.stringify(ir))

  // Apply optimizations
  constantFolding(optimizedIr)
  constantPropagation(optimizedIr)
  deadCodeElimination(optimizedIr)

  return optimizedIr
}

// Constant folding: evaluate constant expressions at compile time
function constantFolding(ir: IRInstruction[]): void {
  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    // Only process arithmetic operations
    if (["ADD", "SUB", "MUL", "DIV", "MOD"].includes(instr.op)) {
      const arg1 = instr.arg1 || ""
      const arg2 = instr.arg2 || ""

      // Check if both operands are numeric constants
      if (isNumeric(arg1) && isNumeric(arg2)) {
        const num1 = Number.parseFloat(arg1)
        const num2 = Number.parseFloat(arg2)
        let result: number

        switch (instr.op) {
          case "ADD":
            result = num1 + num2
            break
          case "SUB":
            result = num1 - num2
            break
          case "MUL":
            result = num1 * num2
            break
          case "DIV":
            if (num2 === 0) continue // Avoid division by zero
            result = num1 / num2
            break
          case "MOD":
            if (num2 === 0) continue // Avoid modulo by zero
            result = num1 % num2
            break
          default:
            continue
        }

        // Replace the instruction with a direct assignment
        ir[i] = {
          op: "ASSIGN",
          result: instr.result,
          arg1: result.toString(),
        }
      }
    }

    // Fold logical operations
    if (["EQ", "NE", "LT", "GT", "LE", "GE"].includes(instr.op)) {
      const arg1 = instr.arg1 || ""
      const arg2 = instr.arg2 || ""

      // Check if both operands are numeric constants
      if (isNumeric(arg1) && isNumeric(arg2)) {
        const num1 = Number.parseFloat(arg1)
        const num2 = Number.parseFloat(arg2)
        let result: boolean

        switch (instr.op) {
          case "EQ":
            result = num1 === num2
            break
          case "NE":
            result = num1 !== num2
            break
          case "LT":
            result = num1 < num2
            break
          case "GT":
            result = num1 > num2
            break
          case "LE":
            result = num1 <= num2
            break
          case "GE":
            result = num1 >= num2
            break
          default:
            continue
        }

        // Replace the instruction with a direct assignment
        ir[i] = {
          op: "ASSIGN",
          result: instr.result,
          arg1: result.toString(),
        }
      }
    }
  }
}

// Constant propagation: replace variables with their constant values
function constantPropagation(ir: IRInstruction[]): void {
  const constants: Record<string, string> = {}

  // First pass: identify constants
  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    if (instr.op === "ASSIGN" && instr.result && instr.arg1 && isNumeric(instr.arg1)) {
      constants[instr.result] = instr.arg1
    } else if (instr.op === "ASSIGN" && instr.result && instr.arg1 && constants[instr.arg1]) {
      // Propagate constants through assignments
      constants[instr.result] = constants[instr.arg1]
    } else if (instr.result) {
      // If a variable is assigned a non-constant value, it's no longer a constant
      delete constants[instr.result]
    }
  }

  // Second pass: replace variables with their constant values
  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    if (instr.arg1 && constants[instr.arg1]) {
      instr.arg1 = constants[instr.arg1]
    }

    if (instr.arg2 && constants[instr.arg2]) {
      instr.arg2 = constants[instr.arg2]
    }
  }
}

// Dead code elimination: remove unused variables and unreachable code
function deadCodeElimination(ir: IRInstruction[]): void {
  // Track variable usage
  const used: Record<string, boolean> = {}

  // First pass: mark used variables
  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    if (instr.arg1 && !isNumeric(instr.arg1) && !instr.arg1.startsWith("L")) {
      used[instr.arg1] = true
    }

    if (instr.arg2 && !isNumeric(instr.arg2) && !instr.arg2.startsWith("L")) {
      used[instr.arg2] = true
    }
  }

  // Second pass: remove assignments to unused variables
  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    if (instr.op === "ASSIGN" && instr.result && !used[instr.result]) {
      // Skip this instruction (mark for removal)
      ir[i] = { op: "NOP" }
    }
  }

  // Remove NOPs
  for (let i = 0; i < ir.length; i++) {
    if (ir[i].op === "NOP") {
      ir.splice(i, 1)
      i--
    }
  }
}

// Helper function to check if a string is a numeric constant
function isNumeric(str: string): boolean {
  return !isNaN(Number.parseFloat(str)) && isFinite(Number.parseFloat(str))
}
