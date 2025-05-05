import type { ASTNode, SymbolTable, Symbol, CompilerError } from "./types"

export function analyze(ast: ASTNode): { symbolTable: SymbolTable; errors: CompilerError[] } {
  const symbolTable: SymbolTable = {
    scopes: {
      global: {
        parent: null,
        symbols: {},
      },
    },
    currentScope: "global",
  }

  const errors: CompilerError[] = []

  // Helper functions
  const enterScope = (scopeName: string) => {
    symbolTable.scopes[scopeName] = {
      parent: symbolTable.currentScope,
      symbols: {},
    }
    symbolTable.currentScope = scopeName
  }

  const exitScope = () => {
    const currentScope = symbolTable.scopes[symbolTable.currentScope]
    symbolTable.currentScope = currentScope.parent || "global"
  }

  const declareSymbol = (
    name: string,
    type: string,
    kind: "variable" | "function" | "parameter",
    node: ASTNode,
    params?: { name: string; type: string }[],
    returnType?: string,
  ) => {
    const scope = symbolTable.scopes[symbolTable.currentScope]

    // Check for redeclaration in the same scope
    if (scope.symbols[name]) {
      errors.push({
        message: `Redeclaration of '${name}'. It was already declared at line ${scope.symbols[name].line}, column ${scope.symbols[name].column}`,
        line: node.line || 0,
        column: node.column || 0,
      })
      return
    }

    scope.symbols[name] = {
      name,
      type,
      kind,
      line: node.line || 0,
      column: node.column || 0,
      initialized: kind === "parameter" || kind === "function",
      params,
      returnType,
    }
  }

  const resolveSymbol = (name: string, node: ASTNode): Symbol | null => {
    let currentScopeName = symbolTable.currentScope

    while (currentScopeName) {
      const scope = symbolTable.scopes[currentScopeName]
      if (scope.symbols[name]) {
        return scope.symbols[name]
      }

      currentScopeName = scope.parent || ""
    }

    errors.push({
      message: `Undefined symbol '${name}'`,
      line: node.line || 0,
      column: node.column || 0,
    })

    return null
  }

  const getTypeOfNode = (node: ASTNode): string => {
    switch (node.type) {
      case "NumberLiteral":
        return node.value?.includes(".") ? "float" : "int"
      case "StringLiteral":
        return "string"
      case "BooleanLiteral":
        return "bool"
      case "Identifier":
        const symbol = resolveSymbol(node.value || "", node)
        return symbol ? symbol.type : "unknown"
      case "Addition":
      case "Subtraction":
      case "Multiplication":
      case "Division":
      case "Modulo":
        const leftType = getTypeOfNode(node.children![0])
        const rightType = getTypeOfNode(node.children![1])

        // Type checking for arithmetic operations
        if (leftType === "int" && rightType === "int") {
          return "int"
        } else if ((leftType === "int" || leftType === "float") && (rightType === "int" || rightType === "float")) {
          return "float"
        } else {
          errors.push({
            message: `Invalid operand types for ${node.type.toLowerCase()}: ${leftType} and ${rightType}`,
            line: node.line || 0,
            column: node.column || 0,
          })
          return "unknown"
        }
      case "Equal":
      case "NotEqual":
      case "LessThan":
      case "GreaterThan":
      case "LessThanEqual":
      case "GreaterThanEqual":
        return "bool"
      case "LogicalAnd":
      case "LogicalOr":
      case "LogicalNot":
        return "bool"
      case "Negation":
        const exprType = getTypeOfNode(node.children![0])
        if (exprType !== "int" && exprType !== "float") {
          errors.push({
            message: `Cannot negate type ${exprType}`,
            line: node.line || 0,
            column: node.column || 0,
          })
        }
        return exprType
      case "FunctionCall":
        const funcName = (node.children![0] as ASTNode).value || ""
        const funcSymbol = resolveSymbol(funcName, node)

        if (funcSymbol && funcSymbol.kind === "function") {
          // Check argument count
          const expectedArgCount = funcSymbol.params?.length || 0
          const actualArgCount = node.children!.length - 1 // Subtract the function name node

          if (expectedArgCount !== actualArgCount) {
            errors.push({
              message: `Function '${funcName}' expects ${expectedArgCount} arguments, but got ${actualArgCount}`,
              line: node.line || 0,
              column: node.column || 0,
            })
          } else {
            // Check argument types
            for (let i = 0; i < actualArgCount; i++) {
              const expectedType = funcSymbol.params![i].type
              const actualType = getTypeOfNode(node.children![i + 1])

              if (expectedType !== actualType && !(expectedType === "float" && actualType === "int")) {
                errors.push({
                  message: `Argument ${i + 1} of function '${funcName}' expects type ${expectedType}, but got ${actualType}`,
                  line: node.children![i + 1].line || 0,
                  column: node.children![i + 1].column || 0,
                })
              }
            }
          }

          return funcSymbol.returnType || "void"
        }

        return "unknown"
      default:
        return "unknown"
    }
  }

  // Visitor pattern for AST traversal
  const visitNode = (node: ASTNode) => {
    switch (node.type) {
      case "Program":
        visitChildren(node)

        // Check if main function exists
        const mainSymbol = symbolTable.scopes["global"].symbols["main"]
        if (!mainSymbol || mainSymbol.kind !== "function") {
          errors.push({
            message: "Program must have a main function",
            line: 0,
            column: 0,
          })
        }
        break

      case "FunctionDeclaration":
        const returnType = node.children![0].value || "void"
        const funcName = node.children![1].value || ""
        const paramsNode = node.children![2]

        // Extract parameter information
        const params: { name: string; type: string }[] = []
        paramsNode.children?.forEach((paramNode) => {
          const paramType = paramNode.children![0].value || ""
          const paramName = paramNode.children![1].value || ""
          params.push({ name: paramName, type: paramType })
        })

        // Declare function in current scope
        declareSymbol(funcName, "function", "function", node.children![1], params, returnType)

        // Create a new scope for the function
        enterScope(`function_${funcName}`)

        // Declare parameters in the function scope
        paramsNode.children?.forEach((paramNode) => {
          const paramType = paramNode.children![0].value || ""
          const paramName = paramNode.children![1].value || ""
          declareSymbol(paramName, paramType, "parameter", paramNode.children![1])
        })

        // Visit function body
        if (node.children!.length > 3) {
          visitNode(node.children![3])
        }

        // Check return statements
        if (returnType !== "void") {
          // TODO: Implement return statement checking
        }

        exitScope()
        break

      case "VariableDeclaration":
        const varType = node.children![0].value || ""
        const varName = node.children![1].value || ""

        // Declare variable in current scope
        declareSymbol(varName, varType, "variable", node.children![1])

        // Check initialization
        if (node.children!.length > 2) {
          const initExpr = node.children![2]
          const exprType = getTypeOfNode(initExpr)

          // Type checking for initialization
          if (varType !== exprType && !(varType === "float" && exprType === "int")) {
            errors.push({
              message: `Cannot initialize variable of type '${varType}' with value of type '${exprType}'`,
              line: initExpr.line || 0,
              column: initExpr.column || 0,
            })
          }

          // Mark as initialized
          const symbol = symbolTable.scopes[symbolTable.currentScope].symbols[varName]
          if (symbol) {
            symbol.initialized = true
          }
        }
        break

      case "Block":
        // Create a new scope for the block
        const blockId = `block_${Math.random().toString(36).substr(2, 9)}`
        enterScope(blockId)

        visitChildren(node)

        exitScope()
        break

      case "IfStatement":
      case "WhileStatement":
      case "ForStatement":
        // Check condition type
        const conditionNode = node.children![0]
        const conditionType = getTypeOfNode(conditionNode)

        if (conditionType !== "bool") {
          errors.push({
            message: `Condition must be of type 'bool', but got '${conditionType}'`,
            line: conditionNode.line || 0,
            column: conditionNode.column || 0,
          })
        }

        visitChildren(node)
        break

      case "ReturnStatement":
        // Get current function return type
        let currentScopeName = symbolTable.currentScope
        let functionScope = null

        while (currentScopeName) {
          if (currentScopeName.startsWith("function_")) {
            functionScope = currentScopeName
            break
          }

          const scope = symbolTable.scopes[currentScopeName]
          currentScopeName = scope.parent || ""
        }

        if (functionScope) {
          const functionName = functionScope.substring(9) // Remove 'function_' prefix
          const functionSymbol = symbolTable.scopes["global"].symbols[functionName]

          if (functionSymbol) {
            const expectedReturnType = functionSymbol.returnType || "void"

            // Check return value
            if (node.children!.length > 0) {
              const returnExpr = node.children![0]
              const actualReturnType = getTypeOfNode(returnExpr)

              if (expectedReturnType === "void") {
                errors.push({
                  message: `Function '${functionName}' has void return type but returns a value`,
                  line: node.line || 0,
                  column: node.column || 0,
                })
              } else if (
                expectedReturnType !== actualReturnType &&
                !(expectedReturnType === "float" && actualReturnType === "int")
              ) {
                errors.push({
                  message: `Function '${functionName}' expects return type '${expectedReturnType}', but got '${actualReturnType}'`,
                  line: returnExpr.line || 0,
                  column: returnExpr.column || 0,
                })
              }
            } else if (expectedReturnType !== "void") {
              errors.push({
                message: `Function '${functionName}' expects return type '${expectedReturnType}', but no value is returned`,
                line: node.line || 0,
                column: node.column || 0,
              })
            }
          }
        }

        visitChildren(node)
        break

      case "Assignment":
        const leftNode = node.children![0]
        const rightNode = node.children![1]

        // Check if left side is an identifier
        if (leftNode.type !== "Identifier") {
          errors.push({
            message: "Left side of assignment must be a variable",
            line: leftNode.line || 0,
            column: leftNode.column || 0,
          })
        } else {
          const varName = leftNode.value || ""
          const symbol = resolveSymbol(varName, leftNode)

          if (symbol) {
            if (symbol.kind !== "variable" && symbol.kind !== "parameter") {
              errors.push({
                message: `Cannot assign to '${varName}' because it is not a variable`,
                line: leftNode.line || 0,
                column: leftNode.column || 0,
              })
            } else {
              // Type checking for assignment
              const leftType = symbol.type
              const rightType = getTypeOfNode(rightNode)

              if (leftType !== rightType && !(leftType === "float" && rightType === "int")) {
                errors.push({
                  message: `Cannot assign value of type '${rightType}' to variable of type '${leftType}'`,
                  line: node.line || 0,
                  column: node.column || 0,
                })
              }

              // Mark as initialized
              symbol.initialized = true
            }
          }
        }

        visitChildren(node)
        break

      case "PrintStatement":
        visitChildren(node)
        break

      default:
        visitChildren(node)
        break
    }
  }

  const visitChildren = (node: ASTNode) => {
    if (node.children) {
      node.children.forEach((child) => visitNode(child))
    }
  }

  // Start semantic analysis
  visitNode(ast)

  return { symbolTable, errors }
}
