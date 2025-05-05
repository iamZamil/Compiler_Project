import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SymbolTable as SymbolTableType, Symbol } from "@/lib/compiler/types"
import { Badge } from "@/components/ui/badge"

interface SymbolTableProps {
  table: SymbolTableType
}

export default function SymbolTable({ table }: SymbolTableProps) {
  // Flatten the symbol table for display
  const flattenedSymbols: (Symbol & { scope: string })[] = []

  Object.entries(table.scopes).forEach(([scopeName, scope]) => {
    Object.values(scope.symbols).forEach((symbol) => {
      flattenedSymbols.push({
        ...symbol,
        scope: scopeName,
      })
    })
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Symbol Table</h3>
      <p className="text-sm text-muted-foreground">
        The semantic analyzer has identified {flattenedSymbols.length} symbols in your code.
      </p>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Name</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[150px]">Kind</TableHead>
              <TableHead className="w-[150px]">Scope</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedSymbols.map((symbol, index) => (
              <TableRow key={index}>
                <TableCell>
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">{symbol.name}</code>
                </TableCell>
                <TableCell>{symbol.type}</TableCell>
                <TableCell>
                  <Badge variant="outline">{symbol.kind}</Badge>
                </TableCell>
                <TableCell>{symbol.scope}</TableCell>
                <TableCell>
                  {symbol.kind === "function" && symbol.params && (
                    <span>Params: {symbol.params.map((p) => p.type).join(", ")}</span>
                  )}
                  {symbol.kind === "variable" && symbol.initialized !== undefined && (
                    <span>Initialized: {symbol.initialized ? "Yes" : "No"}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
