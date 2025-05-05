import type { IRInstruction } from "./types"

export function generateAssembly(ir: IRInstruction[]): string {
  let assembly = ""
  const registers: Record<string, string> = {}
  const variables: Set<string> = new Set()

  // Helper function to get a register for a variable
  const getRegister = (variable: string): string => {
    if (registers[variable]) {
      return registers[variable]
    }

    // Simple register allocation strategy
    const reg = `r${(Object.keys(registers).length % 6) + 1}`
    registers[variable] = reg
    return reg
  }

  // Helper function to free a register
  const freeRegister = (variable: string): void => {
    delete registers[variable]
  }

  // Helper function to get the assembly representation of an operand
  const getOperand = (operand: string | undefined): string => {
    if (!operand) return ""

    if (isNumeric(operand)) {
      return operand
    } else if (operand.startsWith("L")) {
      return operand
    } else if (registers[operand]) {
      return registers[operand]
    } else {
      variables.add(operand)
      return `[${operand}]`
    }
  }

  // Add data section for variables
  assembly += "; Generated x86 Assembly\n"
  assembly += "section .data\n"

  // Process IR instructions
  assembly += "\nsection .text\n"
  assembly += "global _start\n\n"

  for (let i = 0; i < ir.length; i++) {
    const instr = ir[i]

    switch (instr.op) {
      case "LABEL":
        assembly += `${instr.result}:\n`
        break

      case "ENTER":
        assembly += "    push ebp\n"
        assembly += "    mov ebp, esp\n"
        break

      case "LEAVE":
        assembly += "    mov esp, ebp\n"
        assembly += "    pop ebp\n"
        break

      case "RET":
        if (instr.arg1) {
          const reg = getRegister(instr.arg1)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          freeRegister(instr.arg1)
        }
        assembly += "    ret\n"
        break

      case "ASSIGN":
        if (instr.result && instr.arg1) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov ${resultReg}, ${getOperand(instr.arg1)}\n`
        }
        break

      case "ADD":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov ${resultReg}, ${getOperand(instr.arg1)}\n`
          assembly += `    add ${resultReg}, ${getOperand(instr.arg2)}\n`
        }
        break

      case "SUB":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov ${resultReg}, ${getOperand(instr.arg1)}\n`
          assembly += `    sub ${resultReg}, ${getOperand(instr.arg2)}\n`
        }
        break

      case "MUL":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    imul eax, ${getOperand(instr.arg2)}\n`
          assembly += `    mov ${resultReg}, eax\n`
        }
        break

      case "DIV":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cdq\n`
          assembly += `    mov ebx, ${getOperand(instr.arg2)}\n`
          assembly += `    idiv ebx\n`
          assembly += `    mov ${resultReg}, eax\n`
        }
        break

      case "MOD":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cdq\n`
          assembly += `    mov ebx, ${getOperand(instr.arg2)}\n`
          assembly += `    idiv ebx\n`
          assembly += `    mov ${resultReg}, edx\n` // Remainder is in edx
        }
        break

      case "EQ":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    sete al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "NE":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    setne al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "LT":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    setl al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "GT":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    setg al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "LE":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    setle al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "GE":
        if (instr.result && instr.arg1 && instr.arg2) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov eax, ${getOperand(instr.arg1)}\n`
          assembly += `    cmp eax, ${getOperand(instr.arg2)}\n`
          assembly += `    setge al\n`
          assembly += `    movzx ${resultReg}, al\n`
        }
        break

      case "NOT":
        if (instr.result && instr.arg1) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov ${resultReg}, ${getOperand(instr.arg1)}\n`
          assembly += `    xor ${resultReg}, 1\n` // Toggle the lowest bit
        }
        break

      case "NEG":
        if (instr.result && instr.arg1) {
          const resultReg = getRegister(instr.result)
          assembly += `    mov ${resultReg}, ${getOperand(instr.arg1)}\n`
          assembly += `    neg ${resultReg}\n`
        }
        break

      case "JUMP":
        if (instr.result) {
          assembly += `    jmp ${instr.result}\n`
        }
        break

      case "JUMPTRUE":
        if (instr.arg1 && instr.result) {
          assembly += `    cmp ${getOperand(instr.arg1)}, 0\n`
          assembly += `    jne ${instr.result}\n`
        }
        break

      case "JUMPFALSE":
        if (instr.arg1 && instr.result) {
          assembly += `    cmp ${getOperand(instr.arg1)}, 0\n`
          assembly += `    je ${instr.result}\n`
        }
        break

      case "PARAM":
        if (instr.arg1) {
          assembly += `    push ${getOperand(instr.arg1)}\n`
        }
        break

      case "CALL":
        if (instr.arg1) {
          assembly += `    call ${instr.arg1}\n`

          // Clean up stack if there are parameters
          if (instr.arg2 && Number.parseInt(instr.arg2) > 0) {
            assembly += `    add esp, ${Number.parseInt(instr.arg2) * 4}\n`
          }

          // Store return value if needed
          if (instr.result) {
            const resultReg = getRegister(instr.result)
            assembly += `    mov ${resultReg}, eax\n`
          }
        }
        break

      case "PRINT":
        if (instr.arg1) {
          assembly += `    ; Print value in ${getOperand(instr.arg1)}\n`
          assembly += `    push ${getOperand(instr.arg1)}\n`
          assembly += `    call printf\n`
          assembly += `    add esp, 4\n`
        }
        break
    }
  }

  // Add data section for variables
  let dataSection = "section .data\n"
  variables.forEach((variable) => {
    dataSection += `    ${variable} dd 0\n`
  })

  // Add format string for printf
  dataSection += '    fmt db "%d", 10, 0\n'

  // Add _start function
  assembly += "\n_start:\n"
  assembly += "    call main\n"
  assembly += "    mov ebx, 0\n"
  assembly += "    mov eax, 1\n"
  assembly += "    int 0x80\n"

  // Add printf function
  assembly += "\nprintf:\n"
  assembly += "    push ebp\n"
  assembly += "    mov ebp, esp\n"
  assembly += "    push dword [ebp+8]\n"
  assembly += "    push fmt\n"
  assembly += "    call _printf\n"
  assembly += "    add esp, 8\n"
  assembly += "    pop ebp\n"
  assembly += "    ret\n"

  // Combine sections
  return dataSection + "\n" + assembly
}

// Helper function to check if a string is a numeric constant
function isNumeric(str: string): boolean {
  return !isNaN(Number.parseFloat(str)) && isFinite(Number.parseFloat(str))
}
