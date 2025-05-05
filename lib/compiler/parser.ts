import type { Token, ASTNode, CompilerError } from "./types"

export function parse(tokens: Token[]): { ast: ASTNode | null; errors: CompilerError[] } {
  let currentTokenIndex = 0
  const errors: CompilerError[] = []

  // Helper functions
  const peek = (): Token | null => {
    return currentTokenIndex < tokens.length ? tokens[currentTokenIndex] : null
  }

  const consume = (): Token | null => {
    return currentTokenIndex < tokens.length ? tokens[currentTokenIndex++] : null
  }

  const match = (type: string, value?: string): boolean => {
    const token = peek()
    if (!token) return false
    if (token.type === type && (!value || token.value === value)) {
      consume()
      return true
    }
    return false
  }

  const expect = (type: string, value?: string, errorMessage?: string): Token | null => {
    const token = peek()
    if (!token) {
      errors.push({
        message: errorMessage || `Expected ${type}${value ? ` '${value}'` : ""}, but got end of input`,
        line: tokens[tokens.length - 1]?.line || 0,
        column: tokens[tokens.length - 1]?.column || 0,
      })
      return null
    }

    if (token.type === type && (!value || token.value === value)) {
      return consume()
    }

    errors.push({
      message: errorMessage || `Expected ${type}${value ? ` '${value}'` : ""}, but got ${token.type} '${token.value}'`,
      line: token.line,
      column: token.column,
    })
    return null
  }

  // Grammar rules
  const parseProgram = (): ASTNode => {
    const program: ASTNode = {
      type: "Program",
      children: [],
    }

    while (peek()) {
      const declaration = parseDeclaration()
      if (declaration) {
        program.children!.push(declaration)
      } else {
        // Skip to the next semicolon or closing brace to recover from errors
        while (peek() && !match("PUNCTUATION", ";") && !match("PUNCTUATION", "}")) {
          consume()
        }
      }
    }

    return program
  }

  const parseDeclaration = (): ASTNode | null => {
    const token = peek()
    if (!token) return null

    // Function declaration
    if (token.type === "KEYWORD" && ["int", "float", "bool", "void"].includes(token.value)) {
      const typeToken = consume()!
      const identifierToken = expect("IDENTIFIER", undefined, "Expected function or variable name")

      if (!identifierToken) return null

      // Check if it's a function declaration
      if (peek()?.type === "PUNCTUATION" && peek()?.value === "(") {
        return parseFunctionDeclaration(typeToken, identifierToken)
      }

      // Otherwise, it's a variable declaration
      return parseVariableDeclaration(typeToken, identifierToken)
    }

    errors.push({
      message: `Expected declaration, but got ${token.type} '${token.value}'`,
      line: token.line,
      column: token.column,
    })
    return null
  }

  const parseFunctionDeclaration = (typeToken: Token, identifierToken: Token): ASTNode | null => {
    const functionNode: ASTNode = {
      type: "FunctionDeclaration",
      children: [
        {
          type: "Type",
          value: typeToken.value,
          line: typeToken.line,
          column: typeToken.column,
        },
        {
          type: "Identifier",
          value: identifierToken.value,
          line: identifierToken.line,
          column: identifierToken.column,
        },
      ],
    }

    // Parse parameters
    expect("PUNCTUATION", "(", "Expected opening parenthesis")
    const parameters: ASTNode = {
      type: "Parameters",
      children: [],
    }

    // Parse parameter list
    if (!match("PUNCTUATION", ")")) {
      do {
        const paramType = expect("KEYWORD", undefined, "Expected parameter type")
        const paramName = expect("IDENTIFIER", undefined, "Expected parameter name")

        if (paramType && paramName) {
          parameters.children!.push({
            type: "Parameter",
            children: [
              {
                type: "Type",
                value: paramType.value,
                line: paramType.line,
                column: paramType.column,
              },
              {
                type: "Identifier",
                value: paramName.value,
                line: paramName.line,
                column: paramName.column,
              },
            ],
          })
        }
      } while (match("PUNCTUATION", ","))

      expect("PUNCTUATION", ")", "Expected closing parenthesis or comma")
    }

    functionNode.children!.push(parameters)

    // Parse function body
    const body = parseBlock()
    if (body) {
      functionNode.children!.push(body)
    }

    return functionNode
  }

  const parseVariableDeclaration = (typeToken: Token, identifierToken: Token): ASTNode | null => {
    const variableNode: ASTNode = {
      type: "VariableDeclaration",
      children: [
        {
          type: "Type",
          value: typeToken.value,
          line: typeToken.line,
          column: typeToken.column,
        },
        {
          type: "Identifier",
          value: identifierToken.value,
          line: identifierToken.line,
          column: identifierToken.column,
        },
      ],
    }

    // Check for initialization
    if (match("OPERATOR", "=")) {
      const expression = parseExpression()
      if (expression) {
        variableNode.children!.push(expression)
      }
    }

    expect("PUNCTUATION", ";", "Expected semicolon after variable declaration")

    return variableNode
  }

  const parseBlock = (): ASTNode | null => {
    if (!match("PUNCTUATION", "{")) {
      errors.push({
        message: "Expected opening brace",
        line: peek()?.line || 0,
        column: peek()?.column || 0,
      })
      return null
    }

    const blockNode: ASTNode = {
      type: "Block",
      children: [],
    }

    while (peek() && peek()?.value !== "}") {
      const statement = parseStatement()
      if (statement) {
        blockNode.children!.push(statement)
      } else {
        // Skip to the next semicolon or closing brace to recover from errors
        while (peek() && !match("PUNCTUATION", ";") && !match("PUNCTUATION", "}")) {
          consume()
        }
      }
    }

    expect("PUNCTUATION", "}", "Expected closing brace")

    return blockNode
  }

  const parseStatement = (): ASTNode | null => {
    const token = peek()
    if (!token) return null

    // Block statement
    if (token.type === "PUNCTUATION" && token.value === "{") {
      return parseBlock()
    }

    // If statement
    if (token.type === "KEYWORD" && token.value === "if") {
      return parseIfStatement()
    }

    // While statement
    if (token.type === "KEYWORD" && token.value === "while") {
      return parseWhileStatement()
    }

    // For statement
    if (token.type === "KEYWORD" && token.value === "for") {
      return parseForStatement()
    }

    // Return statement
    if (token.type === "KEYWORD" && token.value === "return") {
      return parseReturnStatement()
    }

    // Print statement
    if (token.type === "KEYWORD" && token.value === "print") {
      return parsePrintStatement()
    }

    // Variable declaration
    if (token.type === "KEYWORD" && ["int", "float", "bool"].includes(token.value)) {
      const typeToken = consume()!
      const identifierToken = expect("IDENTIFIER", undefined, "Expected variable name")

      if (!identifierToken) return null

      return parseVariableDeclaration(typeToken, identifierToken)
    }

    // Expression statement (assignment or function call)
    return parseExpressionStatement()
  }

  const parseIfStatement = (): ASTNode | null => {
    consume() // Consume 'if'

    const ifNode: ASTNode = {
      type: "IfStatement",
      children: [],
    }

    expect("PUNCTUATION", "(", "Expected opening parenthesis after if")

    const condition = parseExpression()
    if (condition) {
      ifNode.children!.push(condition)
    }

    expect("PUNCTUATION", ")", "Expected closing parenthesis after condition")

    const thenBranch = parseStatement()
    if (thenBranch) {
      ifNode.children!.push(thenBranch)
    }

    // Check for else branch
    if (match("KEYWORD", "else")) {
      const elseBranch = parseStatement()
      if (elseBranch) {
        ifNode.children!.push(elseBranch)
      }
    }

    return ifNode
  }

  const parseWhileStatement = (): ASTNode | null => {
    consume() // Consume 'while'

    const whileNode: ASTNode = {
      type: "WhileStatement",
      children: [],
    }

    expect("PUNCTUATION", "(", "Expected opening parenthesis after while")

    const condition = parseExpression()
    if (condition) {
      whileNode.children!.push(condition)
    }

    expect("PUNCTUATION", ")", "Expected closing parenthesis after condition")

    const body = parseStatement()
    if (body) {
      whileNode.children!.push(body)
    }

    return whileNode
  }

  const parseForStatement = (): ASTNode | null => {
    consume() // Consume 'for'

    const forNode: ASTNode = {
      type: "ForStatement",
      children: [],
    }

    expect("PUNCTUATION", "(", "Expected opening parenthesis after for")

    // Initialization
    if (!match("PUNCTUATION", ";")) {
      const initialization = parseStatement()
      if (initialization) {
        forNode.children!.push(initialization)
      }
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    // Condition
    if (!match("PUNCTUATION", ";")) {
      const condition = parseExpression()
      if (condition) {
        forNode.children!.push(condition)
      }
      expect("PUNCTUATION", ";", "Expected semicolon after for condition")
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    // Increment
    if (!match("PUNCTUATION", ")")) {
      const increment = parseExpression()
      if (increment) {
        forNode.children!.push(increment)
      }
      expect("PUNCTUATION", ")", "Expected closing parenthesis after for increment")
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    const body = parseStatement()
    if (body) {
      forNode.children!.push(body)
    }

    return forNode
  }

  const parseReturnStatement = (): ASTNode | null => {
    const returnToken = consume()! // Consume 'return'

    const returnNode: ASTNode = {
      type: "ReturnStatement",
      line: returnToken.line,
      column: returnToken.column,
      children: [],
    }

    if (!match("PUNCTUATION", ";")) {
      const expression = parseExpression()
      if (expression) {
        returnNode.children!.push(expression)
      }
      expect("PUNCTUATION", ";", "Expected semicolon after return statement")
    }

    return returnNode
  }

  const parsePrintStatement = (): ASTNode | null => {
    const printToken = consume()! // Consume 'print'

    const printNode: ASTNode = {
      type: "PrintStatement",
      line: printToken.line,
      column: printToken.column,
      children: [],
    }

    expect("PUNCTUATION", "(", "Expected opening parenthesis after print")

    const expression = parseExpression()
    if (expression) {
      printNode.children!.push(expression)
    }

    expect("PUNCTUATION", ")", "Expected closing parenthesis after print argument")
    expect("PUNCTUATION", ";", "Expected semicolon after print statement")

    return printNode
  }

  const parseExpressionStatement = (): ASTNode | null => {
    const expression = parseExpression()

    if (!expression) return null

    expect("PUNCTUATION", ";", "Expected semicolon after expression")

    return {
      type: "ExpressionStatement",
      children: [expression],
    }
  }

  const parseExpression = (): ASTNode | null => {
    return parseAssignment()
  }

  const parseAssignment = (): ASTNode | null => {
    const left = parseLogicalOr()

    if (!left) return null

    if (match("OPERATOR", "=")) {
      const right = parseAssignment()

      if (!right) return null

      return {
        type: "Assignment",
        children: [left, right],
      }
    }

    return left
  }

  const parseLogicalOr = (): ASTNode | null => {
    let expr = parseLogicalAnd()

    while (match("OPERATOR", "||")) {
      const right = parseLogicalAnd()

      if (!right) return null

      expr = {
        type: "LogicalOr",
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseLogicalAnd = (): ASTNode | null => {
    let expr = parseEquality()

    while (match("OPERATOR", "&&")) {
      const right = parseEquality()

      if (!right) return null

      expr = {
        type: "LogicalAnd",
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseEquality = (): ASTNode | null => {
    let expr = parseComparison()

    while (match("OPERATOR", "==") || match("OPERATOR", "!=")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseComparison()

      if (!right) return null

      expr = {
        type: operator === "==" ? "Equal" : "NotEqual",
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseComparison = (): ASTNode | null => {
    let expr = parseTerm()

    while (match("OPERATOR", "<") || match("OPERATOR", ">") || match("OPERATOR", "<=") || match("OPERATOR", ">=")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseTerm()

      if (!right) return null

      let type
      switch (operator) {
        case "<":
          type = "LessThan"
          break
        case ">":
          type = "GreaterThan"
          break
        case "<=":
          type = "LessThanEqual"
          break
        case ">=":
          type = "GreaterThanEqual"
          break
      }

      expr = {
        type,
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseTerm = (): ASTNode | null => {
    let expr = parseFactor()

    while (match("OPERATOR", "+") || match("OPERATOR", "-")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseFactor()

      if (!right) return null

      expr = {
        type: operator === "+" ? "Addition" : "Subtraction",
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseFactor = (): ASTNode | null => {
    let expr = parseUnary()

    while (match("OPERATOR", "*") || match("OPERATOR", "/") || match("OPERATOR", "%")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseUnary()

      if (!right) return null

      let type
      switch (operator) {
        case "*":
          type = "Multiplication"
          break
        case "/":
          type = "Division"
          break
        case "%":
          type = "Modulo"
          break
      }

      expr = {
        type,
        children: [expr!, right],
      }
    }

    return expr
  }

  const parseUnary = (): ASTNode | null => {
    if (match("OPERATOR", "!") || match("OPERATOR", "-")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseUnary()

      if (!right) return null

      return {
        type: operator === "!" ? "LogicalNot" : "Negation",
        children: [right],
      }
    }

    return parseCall()
  }

  const parseCall = (): ASTNode | null => {
    let expr = parsePrimary()

    if (!expr) return null

    while (true) {
      if (match("PUNCTUATION", "(")) {
        expr = finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  const finishCall = (callee: ASTNode): ASTNode => {
    const args: ASTNode[] = []

    if (!match("PUNCTUATION", ")")) {
      do {
        const arg = parseExpression()
        if (arg) args.push(arg)
      } while (match("PUNCTUATION", ","))

      expect("PUNCTUATION", ")", "Expected closing parenthesis after arguments")
    }

    return {
      type: "FunctionCall",
      children: [callee, ...args],
    }
  }

  const parsePrimary = (): ASTNode | null => {
    const token = peek()
    if (!token) return null

    // Literals
    if (token.type === "NUMBER") {
      const numberToken = consume()!
      return {
        type: "NumberLiteral",
        value: numberToken.value,
        line: numberToken.line,
        column: numberToken.column,
      }
    }

    if (token.type === "STRING") {
      const stringToken = consume()!
      return {
        type: "StringLiteral",
        value: stringToken.value,
        line: stringToken.line,
        column: stringToken.column,
      }
    }

    if (token.type === "KEYWORD" && (token.value === "true" || token.value === "false")) {
      const boolToken = consume()!
      return {
        type: "BooleanLiteral",
        value: boolToken.value,
        line: boolToken.line,
        column: boolToken.column,
      }
    }

    // Identifiers
    if (token.type === "IDENTIFIER") {
      const identifierToken = consume()!
      return {
        type: "Identifier",
        value: identifierToken.value,
        line: identifierToken.line,
        column: identifierToken.column,
      }
    }

    // Grouping
    if (token.type === "PUNCTUATION" && token.value === "(") {
      consume() // Consume '('
      const expr = parseExpression()
      expect("PUNCTUATION", ")", "Expected closing parenthesis")

      if (!expr) return null

      return {
        type: "Grouping",
        children: [expr],
      }
    }

    errors.push({
      message: `Expected expression, but got ${token.type} '${token.value}'`,
      line: token.line,
      column: token.column,
    })

    return null
  }

  // Start parsing
  const ast = parseProgram()

  return { ast, errors }
}
