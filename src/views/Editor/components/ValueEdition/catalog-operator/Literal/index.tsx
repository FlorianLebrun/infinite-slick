import React from 'react'
import TextInput from "../../modules/TextInput"
import { PropsType, registerInput } from "../../base"
import { JSONSchema } from 'core/typing/schema'

function LiteralInput(props: PropsType) {
  const { value, typing, onChange } = props
  return (<>
    <TextInput value={value.toString()} onChange={onChange} />
  </>)
}

registerInput({
  icon: "value/literal",
  input: LiteralInput,
  matchType(schema: JSONSchema): boolean {
    const type = schema.type
    if (type === "string") return true
    if (type === "number") return true
    if (type === "boolean") return true
    return false
  },
  matchValue(value: any): boolean {
    const type = typeof value
    if (type === "string") return true
    if (type === "number") return true
    if (type === "boolean") return true
    return false
  },
})
