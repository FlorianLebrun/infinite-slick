import React from 'react'
import { PropsType, registerInput } from "../../base"
import { CommonTypes, JSONSchema } from 'core/typing/schema'
import { ExpandableInputHOC } from '../../modules/ExpandableInput'

function ConstantEditor(props: PropsType) {
  const { value, typing, onChange } = props
  return (<pre>
    {JSON.stringify(value?.value, null, 2)}
  </pre>)
}

registerInput({
  icon: "value/constant",
  input: ExpandableInputHOC("Constant", ConstantEditor),
  editor: ConstantEditor,
  matchType(schema: JSONSchema): boolean {
    return true
  },
  matchValue(value: any): boolean {
    if (value instanceof Object && value.type === "constant") return true
    return false
  },
})
