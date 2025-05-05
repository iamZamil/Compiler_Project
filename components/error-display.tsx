import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { CompilerError } from "@/lib/compiler/types"
import { AlertCircle } from "lucide-react"

interface ErrorDisplayProps {
  title: string
  errors: CompilerError[]
}

export default function ErrorDisplay({ title, errors }: ErrorDisplayProps) {
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-lg font-medium text-destructive">{title}</h3>
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.line > 0 ? `Error at line ${error.line}, column ${error.column}` : "Compilation Error"}
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
