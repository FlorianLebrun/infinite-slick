import React from 'react'
import { PropsType, registerInput } from "../../base"
import { JSONSchema } from 'core/typing/schema'
import { PropertiesTable } from '../../modules/PropertiesTable'
import { ExpandableInputHOC } from '../../modules/ExpandableInput'

function ObjectEditor(props: PropsType) {
  const { value, typing, onChange } = props
  return (<PropertiesTable
    values={value?.values}
    typings={typing}
    onChange={(values) => onChange({ ...value, values })}
  />)
}

registerInput({
  icon: "value/object",
  input: ExpandableInputHOC("Object", ObjectEditor),
  editor: ObjectEditor,
  matchType(schema: JSONSchema): boolean {
    if (schema.type === "object") return true
    if (!schema.type && schema.properties) return true
    return false
  },
  matchValue(value: any): boolean {
    if (value instanceof Object && value.type === "collection") return true
    return false
  },
})
