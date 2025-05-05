"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function IntegrationGuide() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Integrating C++ Compiler with Next.js Interface</CardTitle>
        <CardDescription>Learn how to connect your C++ compiler implementation with the web interface</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <h3 className="text-lg font-medium">Overview</h3>
            <p>This web interface provides a visual frontend for your C++ compiler implementation. It allows you to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Write code in the custom language</li>
              <li>Visualize the compilation process step by step</li>
              <li>See the output of each phase: lexical, syntax, semantic analysis, IR, and code generation</li>
              <li>Test your compiler with different inputs</li>
            </ul>
            <p>
              The interface is designed to work with your existing C++ compiler code, which you've already implemented.
            </p>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <h3 className="text-lg font-medium">Setup Instructions</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Build your C++ compiler:</strong> Make sure your compiler is built and executable.
                <pre className="bg-muted p-2 rounded-md mt-1">make</pre>
              </li>
              <li>
                <strong>Configure the API endpoint:</strong> Update the <code>app/api/compile/route.ts</code> file to
                call your compiler executable.
              </li>
              <li>
                <strong>Set up environment:</strong> Make sure your compiler is in the PATH or specify the full path in
                the API route.
              </li>
              <li>
                <strong>Test the integration:</strong> Use the interface to compile a simple program and verify all
                phases work correctly.
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <h3 className="text-lg font-medium">Integration Details</h3>
            <p>
              The web interface communicates with your C++ compiler through the API route in{" "}
              <code>app/api/compile/route.ts</code>. Here's how to modify it to work with your compiler:
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">1. Update the runParser function</h4>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`async function runParser(inputFile: string) {
  // Call your C++ compiler with appropriate flags
  const { stdout, stderr } = await execPromise(
    \`./bin/compiler \${inputFile} --dump-tokens --dump-ast\`
  )
  
  // Parse the output to extract tokens and AST
  const tokens = parseTokensFromOutput(stdout)
  const ast = parseASTFromOutput(stdout)
  const errors = parseErrorsFromOutput(stderr)
  
  return { tokens, ast, errors }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">2. Update the runSemanticAnalysis function</h4>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`async function runSemanticAnalysis(inputFile: string) {
  // Call your C++ compiler with appropriate flags
  const { stdout, stderr } = await execPromise(
    \`./bin/compiler \${inputFile} --dump-symbols\`
  )
  
  // Parse the output to extract symbol table
  const symbolTable = parseSymbolTableFromOutput(stdout)
  const errors = parseErrorsFromOutput(stderr)
  
  return { symbolTable, errors }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">3. Update the generateIR function</h4>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`async function generateIR(inputFile: string) {
  // Call your C++ compiler with appropriate flags
  const { stdout, stderr } = await execPromise(
    \`./bin/compiler \${inputFile} --dump-ir -O2\`
  )
  
  // Parse the output to extract IR and optimized IR
  const ir = parseIRFromOutput(stdout, false)
  const optimizedIr = parseIRFromOutput(stdout, true)
  const errors = parseErrorsFromOutput(stderr)
  
  return { ir, optimizedIr, errors }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">4. Update the generateAssembly function</h4>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`async function generateAssembly(inputFile: string) {
  // Call your C++ compiler with appropriate flags
  const { stdout, stderr } = await execPromise(
    \`./bin/compiler \${inputFile} -S --dump-asm\`
  )
  
  // Read the generated assembly file
  const asmFile = inputFile + '.s'
  const assembly = await fs.readFile(asmFile, 'utf-8')
  const errors = parseErrorsFromOutput(stderr)
  
  return { assembly, errors }
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <h3 className="text-lg font-medium">Testing Your Integration</h3>
            <p>
              After integrating your C++ compiler with the web interface, you should test it with various programs to
              ensure all phases work correctly.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">1. Test Lexical and Syntax Analysis</h4>
                <p>Write a program with various tokens and syntax constructs to verify the lexer and parser.</p>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`// Test lexical and syntax analysis
int main() {
  int a = 5;
  float b = 3.14;
  bool c = true;
  
  if (a > 0) {
    print(a);
  }
  
  return 0;
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">2. Test Semantic Analysis</h4>
                <p>Write a program with various semantic constructs to verify the semantic analyzer.</p>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`// Test semantic analysis
int add(int a, int b) {
  return a + b;
}

int main() {
  int x = 5;
  int y = 10;
  int z = add(x, y);
  
  // This should generate a semantic error
  // float error = add(x, 3.14);
  
  return 0;
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">3. Test IR Generation and Optimization</h4>
                <p>Write a program with opportunities for optimization to verify the IR generator and optimizer.</p>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`// Test IR generation and optimization
int main() {
  int a = 5;
  int b = 10;
  int c = a + b;  // This should be optimized to c = 15
  
  int i = 0;
  int sum = 0;
  
  while (i < 10) {
    sum = sum + i;
    i = i + 1;
  }
  
  return 0;
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">4. Test Code Generation</h4>
                <p>Write a program to verify the code generator produces correct assembly.</p>
                <pre className="bg-muted p-2 rounded-md mt-1 text-sm">
                  {`// Test code generation
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
}`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
