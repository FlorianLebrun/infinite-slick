import React from 'react'
import { PropsType, registerInput } from "../../base"
import { CommonTypes, JSONSchema } from 'core/typing/schema'
import ValueEditor from '../../components/ValueEditor'

function ProgramInput(props: PropsType) {
  return (<div>
    {"program-input"}
  </div>)
}

function ProgramEditor(props: PropsType) {
  const { value, typing } = props
  return (<div>
    {"program-editor"}
    <ValueEditor value={value.content} typing={CommonTypes.element} />
  </div>)
}

registerInput({
  icon: "value/program",
  input: ProgramInput,
  editor: ProgramEditor,
  matchType(schema: JSONSchema): boolean {
    return false
  },
  matchValue(value: any): boolean {
    if (value instanceof Object) {
      if (value.type === "component") return true
      if (value.type === "program") return true
      if (value.type === "inline") return true
    }
    return false
  },
})
