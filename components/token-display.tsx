import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Token } from "@/lib/compiler/types"
import { Badge } from "@/components/ui/badge"

interface TokenDisplayProps {
  tokens: Token[]
}

export default function TokenDisplay({ tokens }: TokenDisplayProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Lexical Analysis Output</h3>
      <p className="text-sm text-muted-foreground">The lexer has identified {tokens.length} tokens in your code.</p>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Line</TableHead>
              <TableHead className="w-[100px]">Column</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token, index) => (
              <TableRow key={index}>
                <TableCell>{token.line}</TableCell>
                <TableCell>{token.column}</TableCell>
                <TableCell>
                  <Badge variant="outline">{token.type}</Badge>
                </TableCell>
                <TableCell>
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">{token.value}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
