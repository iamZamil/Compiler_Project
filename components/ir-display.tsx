"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { IRInstruction } from "@/lib/compiler/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface IRDisplayProps {
  ir: IRInstruction[]
  optimizedIr: IRInstruction[]
}

export default function IRDisplay({ ir, optimizedIr }: IRDisplayProps) {
  const [showDiff, setShowDiff] = useState(false)

  const renderIRTable = (instructions: IRInstruction[], isOptimized = false) => {
    return (
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Index</TableHead>
              <TableHead className="w-[120px]">Operation</TableHead>
              <TableHead className="w-[120px]">Result</TableHead>
              <TableHead className="w-[120px]">Operand 1</TableHead>
              <TableHead className="w-[120px]">Operand 2</TableHead>
              {showDiff && isOptimized && <TableHead className="w-[100px]">Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructions.map((instr, index) => {
              // For optimized IR, check if this instruction was modified
              let status = null
              if (showDiff && isOptimized) {
                const originalInstr = ir[index]
                if (!originalInstr) {
                  status = "added"
                } else if (
                  originalInstr.op !== instr.op ||
                  originalInstr.result !== instr.result ||
                  originalInstr.arg1 !== instr.arg1 ||
                  originalInstr.arg2 !== instr.arg2
                ) {
                  status = "modified"
                }
              }

              return (
                <TableRow
                  key={index}
                  className={
                    status === "added"
                      ? "bg-green-50 dark:bg-green-950/20"
                      : status === "modified"
                        ? "bg-yellow-50 dark:bg-yellow-950/20"
                        : ""
                  }
                >
                  <TableCell>{index}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{instr.op}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">{instr.result || "-"}</code>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">{instr.arg1 || "-"}</code>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">{instr.arg2 || "-"}</code>
                  </TableCell>
                  {showDiff && isOptimized && (
                    <TableCell>
                      {status && <Badge variant={status === "added" ? "default" : "secondary"}>{status}</Badge>}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Intermediate Representation</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="show-diff" className="text-sm">
            Show differences
          </label>
          <input
            id="show-diff"
            type="checkbox"
            checked={showDiff}
            onChange={(e) => setShowDiff(e.target.checked)}
            className="rounded border-gray-300"
          />
        </div>
      </div>

      <Tabs defaultValue="original">
        <TabsList>
          <TabsTrigger value="original">Original IR</TabsTrigger>
          <TabsTrigger value="optimized">Optimized IR</TabsTrigger>
        </TabsList>

        <TabsContent value="original">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Three-address code representation of your program.</p>
            {renderIRTable(ir)}
          </div>
        </TabsContent>

        <TabsContent value="optimized">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Optimized IR after applying transformations like constant folding and dead code elimination.
            </p>
            {renderIRTable(optimizedIr, true)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
