"use client"

import { useRef } from "react"
import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  return (
    <div className="h-[500px] border rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="c"
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
