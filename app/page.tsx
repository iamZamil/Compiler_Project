import CompilerInterface from "@/components/compiler-interface"
import IntegrationGuide from "@/components/integration-guide"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compiler Construction Project",
  description: "A web-based compiler for a custom programming language",
}

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-2">Compiler Construction Project</h1>
        <p className="text-muted-foreground mb-8">An interactive compiler for a custom programming language</p>

        <IntegrationGuide />

        <div className="h-8"></div>

        <CompilerInterface />
      </div>
    </main>
  )
}
