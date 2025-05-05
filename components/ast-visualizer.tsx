"use client"
import type { ASTNode } from "@/lib/compiler/types"
import { Tree, TreeNode } from "react-organizational-chart"
import { Card, CardContent } from "@/components/ui/card"

interface AstVisualizerProps {
  ast: ASTNode
}

interface NodeProps {
  node: ASTNode
}

const ASTNodeComponent = ({ node }: NodeProps) => {
  return (
    <Card className="inline-block">
      <CardContent className="p-2 text-xs">
        <div className="font-bold">{node.type}</div>
        {node.value && <div>{node.value}</div>}
      </CardContent>
    </Card>
  )
}

const renderNode = (node: ASTNode) => {
  return (
    <TreeNode label={<ASTNodeComponent node={node} />}>
      {node.children && node.children.map((child, index) => <div key={index}>{renderNode(child)}</div>)}
    </TreeNode>
  )
}

export default function AstVisualizer({ ast }: AstVisualizerProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Abstract Syntax Tree</h3>
      <p className="text-sm text-muted-foreground">Visual representation of the program structure after parsing.</p>

      <div className="overflow-auto p-4 border rounded-md bg-muted/20 min-h-[400px]">
        <Tree lineWidth="2px" lineColor="#888" lineBorderRadius="10px" label={<ASTNodeComponent node={ast} />}>
          {ast.children && ast.children.map((child, index) => <div key={index}>{renderNode(child)}</div>)}
        </Tree>
      </div>
    </div>
  )
}
