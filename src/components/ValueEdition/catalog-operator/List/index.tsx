import React from 'react'
import { PropsType, registerInput } from "../../base"
import { CommonTypes, JSONSchema } from 'core/typing/schema'
import { PropertiesTable } from '../../modules/PropertiesTable'
import { ExpandableInputHOC } from '../../modules/ExpandableInput'
import { ArrayTable } from '../../modules/ArrayTable'

function ListEditor(props: PropsType) {
  const { value, typing, onChange } = props
  return (<ArrayTable
    items={value?.items}
    itemTyping={typing?.items || CommonTypes.any}
    onChange={(items) => onChange({ ...value, items })}
  />)
}

registerInput({
  icon: "value/list",
  input: ExpandableInputHOC("List", ListEditor),
  editor: ListEditor,
  matchType(schema: JSONSchema): boolean {
    if (schema.type === "array") return true
    if (!schema.type && schema.properties) return true
    return false
  },
  matchValue(value: any): boolean {
    if (value instanceof Object && value.type === "list") return true
    return false
  },
})
