import React from 'react'
import { PropsType, registerInput } from "../../base"
import { JSONSchema } from 'core/typing/schema'
import Icon from 'components/Icon'

function DefaultInput(props: PropsType) {
  const { value, typing } = props
  return (<div>
    {"default-error"}
  </div>)
}
registerInput({
  icon: "value/element",
  input: DefaultInput,
  matchType(schema: JSONSchema): boolean {
    return false
  },
  matchValue(value: any): boolean {
    return false
  },
  isDefaultInput: true,
})
