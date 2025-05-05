"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface AssemblyOutputProps {
  assembly: string
}

export default function AssemblyOutput({ assembly }: AssemblyOutputProps) {
  const [output, setOutput] = useState<string>("")
  const [running, setRunning] = useState(false)

  const runAssembly = async () => {
    setRunning(true)
    try {
      // In a real implementation, this would send the assembly to a server
      // that would compile and run it, then return the output
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOutput("120\n") // Simulated output for factorial(5)
    } catch (error) {
      console.error("Error running assembly:", error)
      setOutput("Error running program")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Assembly Output</h3>
        <Button size="sm" onClick={runAssembly} disabled={running}>
          <Play className="mr-2 h-4 w-4" />
          Run Program
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <pre className="p-4 bg-muted/20 overflow-auto text-sm h-[300px]">{assembly}</pre>
      </div>

      {output && (
        <div className="space-y-2">
          <h4 className="text-md font-medium">Program Output</h4>
          <div className="border rounded-md overflow-hidden">
            <pre className="p-4 bg-black text-green-400 font-mono text-sm">{output}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
