import type { ASTNode, IRInstruction } from "./types"

let tempCounter = 0
let labelCounter = 0

export function generateIR(ast: ASTNode): IRInstruction[] {
  const instructions: IRInstruction[] = []

  // Reset counters
  tempCounter = 0
  labelCounter = 0

  // Helper functions
  const newTemp = (): string => {
    return `t${tempCounter++}`
  }

  const newLabel = (): string => {
    return `L${labelCounter++}`
  }

  // Visitor pattern for AST traversal
  const visitNode = (node: ASTNode): string | null => {
    switch (node.type) {
      case "Program":
        visitChildren(node)
        return null

      case "FunctionDeclaration":
        const funcName = node.children![1].value || ""

        // Function label
        instructions.push({
          op: "LABEL",
          result: funcName,
        })

        // Function prologue
        instructions.push({
          op: "ENTER",
        })

        // Visit function body
        if (node.children!.length > 3) {
          visitNode(node.children![3])
        }

        // Function epilogue
        instructions.push({
          op: "LEAVE",
        })

        instructions.push({
          op: "RET",
        })

        return null

      case "VariableDeclaration":
        const varName = node.children![1].value || ""

        // Check initialization
        if (node.children!.length > 2) {
          const exprResult = visitNode(node.children![2])

          if (exprResult) {
            instructions.push({
              op: "ASSIGN",
              result: varName,
              arg1: exprResult,
            })
          }
        }

        return null

      case "Block":
        visitChildren(node)
        return null

      case "IfStatement":
        const condition = visitNode(node.children![0])
        const elseLabel = newLabel()
        const endLabel = newLabel()

        // Jump to else if condition is false
        instructions.push({
          op: "JUMPFALSE",
          arg1: condition || "",
          result: elseLabel,
        })

        // Then branch
        visitNode(node.children![1])

        // Jump to end after then branch
        instructions.push({
          op: "JUMP",
          result: endLabel,
        })

        // Else branch
        instructions.push({
          op: "LABEL",
          result: elseLabel,
        })

        if (node.children!.length > 2) {
          visitNode(node.children![2])
        }

        // End label
        instructions.push({
          op: "LABEL",
          result: endLabel,
        })

        return null

      case "WhileStatement":
        const startLabel = newLabel()
        const whileEndLabel = newLabel()

        // Start label
        instructions.push({
          op: "LABEL",
          result: startLabel,
        })

        // Condition
        const whileCondition = visitNode(node.children![0])

        // Jump to end if condition is false
        instructions.push({
          op: "JUMPFALSE",
          arg1: whileCondition || "",
          result: whileEndLabel,
        })

        // Body
        visitNode(node.children![1])

        // Jump back to start
        instructions.push({
          op: "JUMP",
          result: startLabel,
        })

        // End label
        instructions.push({
          op: "LABEL",
          result: whileEndLabel,
        })

        return null

      case "ForStatement":
        // Initialization
        if (node.children![0].type !== "Empty") {
          visitNode(node.children![0])
        }

        const forStartLabel = newLabel()
        const forEndLabel = newLabel()

        // Start label
        instructions.push({
          op: "LABEL",
          result: forStartLabel,
        })

        // Condition
        if (node.children![1].type !== "Empty") {
          const forCondition = visitNode(node.children![1])

          // Jump to end if condition is false
          instructions.push({
            op: "JUMPFALSE",
            arg1: forCondition || "",
            result: forEndLabel,
          })
        }

        // Body
        visitNode(node.children![3])

        // Increment
        if (node.children![2].type !== "Empty") {
          visitNode(node.children![2])
        }

        // Jump back to start
        instructions.push({
          op: "JUMP",
          result: forStartLabel,
        })

        // End label
        instructions.push({
          op: "LABEL",
          result: forEndLabel,
        })

        return null

      case "ReturnStatement":
        if (node.children!.length > 0) {
          const returnValue = visitNode(node.children![0])

          instructions.push({
            op: "RET",
            arg1: returnValue || "",
          })
        } else {
          instructions.push({
            op: "RET",
          })
        }

        return null

      case "PrintStatement":
        const printArg = visitNode(node.children![0])

        instructions.push({
          op: "PRINT",
          arg1: printArg || "",
        })

        return null

      case "Assignment":
        const rightValue = visitNode(node.children![1])
        const leftName = node.children![0].value || ""

        instructions.push({
          op: "ASSIGN",
          result: leftName,
          arg1: rightValue || "",
        })

        return leftName

      case "LogicalOr":
        const orTemp = newTemp()
        const orRightLabel = newLabel()
        const orEndLabel = newLabel()

        const orLeft = visitNode(node.children![0])

        // Short-circuit: if left is true, skip right evaluation
        instructions.push({
          op: "ASSIGN",
          result: orTemp,
          arg1: orLeft || "",
        })

        instructions.push({
          op: "JUMPTRUE",
          arg1: orTemp,
          result: orEndLabel,
        })

        // Evaluate right side
        const orRight = visitNode(node.children![1])

        instructions.push({
          op: "ASSIGN",
          result: orTemp,
          arg1: orRight || "",
        })

        // End label
        instructions.push({
          op: "LABEL",
          result: orEndLabel,
        })

        return orTemp

      case "LogicalAnd":
        const andTemp = newTemp()
        const andRightLabel = newLabel()
        const andEndLabel = newLabel()

        const andLeft = visitNode(node.children![0])

        // Short-circuit: if left is false, skip right evaluation
        instructions.push({
          op: "ASSIGN",
          result: andTemp,
          arg1: andLeft || "",
        })

        instructions.push({
          op: "JUMPFALSE",
          arg1: andTemp,
          result: andEndLabel,
        })

        // Evaluate right side
        const andRight = visitNode(node.children![1])

        instructions.push({
          op: "ASSIGN",
          result: andTemp,
          arg1: andRight || "",
        })

        // End label
        instructions.push({
          op: "LABEL",
          result: andEndLabel,
        })

        return andTemp

      case "Equal":
        const equalLeft = visitNode(node.children![0])
        const equalRight = visitNode(node.children![1])
        const equalTemp = newTemp()

        instructions.push({
          op: "EQ",
          result: equalTemp,
          arg1: equalLeft || "",
          arg2: equalRight || "",
        })

        return equalTemp

      case "NotEqual":
        const neLeft = visitNode(node.children![0])
        const neRight = visitNode(node.children![1])
        const neTemp = newTemp()

        instructions.push({
          op: "NE",
          result: neTemp,
          arg1: neLeft || "",
          arg2: neRight || "",
        })

        return neTemp

      case "LessThan":
        const ltLeft = visitNode(node.children![0])
        const ltRight = visitNode(node.children![1])
        const ltTemp = newTemp()

        instructions.push({
          op: "LT",
          result: ltTemp,
          arg1: ltLeft || "",
          arg2: ltRight || "",
        })

        return ltTemp

      case "GreaterThan":
        const gtLeft = visitNode(node.children![0])
        const gtRight = visitNode(node.children![1])
        const gtTemp = newTemp()

        instructions.push({
          op: "GT",
          result: gtTemp,
          arg1: gtLeft || "",
          arg2: gtRight || "",
        })

        return gtTemp

      case "LessThanEqual":
        const leLeft = visitNode(node.children![0])
        const leRight = visitNode(node.children![1])
        const leTemp = newTemp()

        instructions.push({
          op: "LE",
          result: leTemp,
          arg1: leLeft || "",
          arg2: leRight || "",
        })

        return leTemp

      case "GreaterThanEqual":
        const geLeft = visitNode(node.children![0])
        const geRight = visitNode(node.children![1])
        const geTemp = newTemp()

        instructions.push({
          op: "GE",
          result: geTemp,
          arg1: geLeft || "",
          arg2: geRight || "",
        })

        return geTemp

      case "Addition":
        const addLeft = visitNode(node.children![0])
        const addRight = visitNode(node.children![1])
        const addTemp = newTemp()

        instructions.push({
          op: "ADD",
          result: addTemp,
          arg1: addLeft || "",
          arg2: addRight || "",
        })

        return addTemp

      case "Subtraction":
        const subLeft = visitNode(node.children![0])
        const subRight = visitNode(node.children![1])
        const subTemp = newTemp()

        instructions.push({
          op: "SUB",
          result: subTemp,
          arg1: subLeft || "",
          arg2: subRight || "",
        })

        return subTemp

      case "Multiplication":
        const mulLeft = visitNode(node.children![0])
        const mulRight = visitNode(node.children![1])
        const mulTemp = newTemp()

        instructions.push({
          op: "MUL",
          result: mulTemp,
          arg1: mulLeft || "",
          arg2: mulRight || "",
        })

        return mulTemp

      case "Division":
        const divLeft = visitNode(node.children![0])
        const divRight = visitNode(node.children![1])
        const divTemp = newTemp()

        instructions.push({
          op: "DIV",
          result: divTemp,
          arg1: divLeft || "",
          arg2: divRight || "",
        })

        return divTemp

      case "Modulo":
        const modLeft = visitNode(node.children![0])
        const modRight = visitNode(node.children![1])
        const modTemp = newTemp()

        instructions.push({
          op: "MOD",
          result: modTemp,
          arg1: modLeft || "",
          arg2: modRight || "",
        })

        return modTemp

      case "LogicalNot":
        const notExpr = visitNode(node.children![0])
        const notTemp = newTemp()

        instructions.push({
          op: "NOT",
          result: notTemp,
          arg1: notExpr || "",
        })

        return notTemp

      case "Negation":
        const negExpr = visitNode(node.children![0])
        const negTemp = newTemp()

        instructions.push({
          op: "NEG",
          result: negTemp,
          arg1: negExpr || "",
        })

        return negTemp

      case "FunctionCall":
        const funcCallName = node.children![0].value || ""
        const args: string[] = []

        // Evaluate arguments
        for (let i = 1; i < node.children!.length; i++) {
          const argResult = visitNode(node.children![i])
          if (argResult) {
            args.push(argResult)
          }
        }

        // Push arguments
        for (let i = 0; i < args.length; i++) {
          instructions.push({
            op: "PARAM",
            arg1: args[i],
          })
        }

        // Call function
        const callTemp = newTemp()

        instructions.push({
          op: "CALL",
          result: callTemp,
          arg1: funcCallName,
          arg2: args.length.toString(),
        })

        return callTemp

      case "NumberLiteral":
        return node.value || "0"

      case "StringLiteral":
        return node.value || '""'

      case "BooleanLiteral":
        return node.value || "false"

      case "Identifier":
        return node.value || ""

      case "Grouping":
        return visitNode(node.children![0])

      default:
        visitChildren(node)
        return null
    }
  }

  const visitChildren = (node: ASTNode): void => {
    if (node.children) {
      node.children.forEach((child) => visitNode(child))
    }
  }

  // Start IR generation
  visitNode(ast)

  return instructions
}
