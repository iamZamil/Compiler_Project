"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import CodeEditor from "@/components/code-editor"
import TokenDisplay from "@/components/token-display"
import AstVisualizer from "@/components/ast-visualizer"
import SymbolTable from "@/components/symbol-table"
import IRDisplay from "@/components/ir-display"
import AssemblyOutput from "@/components/assembly-output"
import { compileCode } from "@/lib/compiler/compiler"
import type { CompilationResult } from "@/lib/compiler/types"
import { Loader2 } from "lucide-react"
import ErrorDisplay from "@/components/error-display"
import ExampleSelector from "@/components/example-selector"

export default function CompilerInterface() {
  const [code, setCode] = useState<string>(`// Example program
int factorial(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

int main() {
  int result = factorial(5);
  print(result);
  return 0;
}`)
  const [compiling, setCompiling] = useState(false)
  const [result, setResult] = useState<CompilationResult | null>(null)
  const [activeTab, setActiveTab] = useState("code")

  const handleCompile = async () => {
    setCompiling(true)
    try {
      const compilationResult = await compileCode(code)
      setResult(compilationResult)

      // If compilation is successful and there are no lexical errors, move to the tokens tab
      if (compilationResult && !compilationResult.errors.lexical.length) {
        setActiveTab("tokens")
      }
    } catch (error) {
      console.error("Compilation error:", error)
      // Set a minimal result with the error
      setResult({
        tokens: [],
        ast: null,
        symbolTable: null,
        ir: [],
        optimizedIr: [],
        assembly: "",
        errors: {
          lexical: [{ message: `Error: ${error.message}`, line: 0, column: 0 }],
          syntax: [],
          semantic: [],
        },
      })
    } finally {
      setCompiling(false)
    }
  }

  const handleExampleSelect = (exampleCode: string) => {
    setCode(exampleCode)
    setResult(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Compiler Playground</h2>
          <p className="text-sm text-muted-foreground">
            Write code in our custom language and see the compilation process
          </p>
        </div>
        <div className="flex gap-2">
          <ExampleSelector onSelect={handleExampleSelect} />
          <Button onClick={handleCompile} disabled={compiling}>
            {compiling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Compiling
              </>
            ) : (
              "Compile Code"
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="tokens" disabled={!result}>
            Tokens
          </TabsTrigger>
          <TabsTrigger value="ast" disabled={!result?.ast}>
            AST
          </TabsTrigger>
          <TabsTrigger value="semantic" disabled={!result?.symbolTable}>
            Semantic
          </TabsTrigger>
          <TabsTrigger value="ir" disabled={!result?.ir}>
            IR
          </TabsTrigger>
          <TabsTrigger value="assembly" disabled={!result?.assembly}>
            Assembly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <Card>
            <CardContent className="p-4">
              <CodeEditor value={code} onChange={setCode} />
            </CardContent>
          </Card>
          {result?.errors.lexical.length > 0 && <ErrorDisplay title="Lexical Errors" errors={result.errors.lexical} />}
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardContent className="p-4">
              {result && <TokenDisplay tokens={result.tokens} />}
              {result?.errors.syntax.length > 0 && <ErrorDisplay title="Syntax Errors" errors={result.errors.syntax} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ast">
          <Card>
            <CardContent className="p-4">{result?.ast && <AstVisualizer ast={result.ast} />}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semantic">
          <Card>
            <CardContent className="p-4">
              {result?.symbolTable && <SymbolTable table={result.symbolTable} />}
              {result?.errors.semantic.length > 0 && (
                <ErrorDisplay title="Semantic Errors" errors={result.errors.semantic} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ir">
          <Card>
            <CardContent className="p-4">
              {result?.ir && <IRDisplay ir={result.ir} optimizedIr={result.optimizedIr} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assembly">
          <Card>
            <CardContent className="p-4">
              {result?.assembly && <AssemblyOutput assembly={result.assembly} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
