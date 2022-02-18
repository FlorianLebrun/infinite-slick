import React from 'react'
import monaco from "monaco-editor"
import { JSONSchema } from 'core/typing/schema'

export default function JSONEditor(props: {
  typing: JSONSchema
  value: any
  onChange?: (value: any) => void
}) {
  return <pre>
    {JSON.stringify(props.value, null, 2)}
  </pre>
}
