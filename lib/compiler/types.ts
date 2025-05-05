// Token types
export interface Token {
  type: string
  value: string
  line: number
  column: number
}

// AST types
export interface ASTNode {
  type: string
  value?: string
  line?: number
  column?: number
  children?: ASTNode[]
}

// Symbol table types
export interface Symbol {
  name: string
  type: string
  kind: "variable" | "function" | "parameter"
  line: number
  column: number
  initialized?: boolean
  params?: { name: string; type: string }[]
  returnType?: string
}

export interface Scope {
  parent: string | null
  symbols: Record<string, Symbol>
}

export interface SymbolTable {
  scopes: Record<string, Scope>
  currentScope: string
}

// IR types
export interface IRInstruction {
  op: string
  result?: string
  arg1?: string
  arg2?: string
}

// Error types
export interface CompilerError {
  message: string
  line: number
  column: number
}

export interface CompilationErrors {
  lexical: CompilerError[]
  syntax: CompilerError[]
  semantic: CompilerError[]
}

// Compilation result
export interface CompilationResult {
  tokens: Token[]
  ast: ASTNode | null
  symbolTable: SymbolTable | null
  ir: IRInstruction[]
  optimizedIr: IRInstruction[]
  assembly: string
  errors: CompilationErrors
}
