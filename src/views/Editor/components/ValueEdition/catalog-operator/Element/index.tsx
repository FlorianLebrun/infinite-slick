import React from 'react'
import { PropsType, registerInput } from "../../base"
import { CommonTypes, JSONSchema } from 'core/typing/schema'
import ValueEditor from '../../components/ValueEditor'
import { PropertiesTable } from '../../modules/PropertiesTable'
import { ExpandableInputHOC } from '../../modules/ExpandableInput'

function ElementEditor(props: PropsType) {
  const { value, typing } = props
  return (<>
    <PropertiesTable
      values={value?.props}
      typings={{}}
      onChange={(x) => props?.onChange({ ...value, props: x })}
    />
  </>)
}

registerInput({
  icon: "value/element",
  input: ExpandableInputHOC("Element", ElementEditor),
  editor: ElementEditor,
  matchType(schema: JSONSchema): boolean {
    if (schema.type === "element") return true
    return false
  },
  matchValue(value: any): boolean {
    if (value instanceof Object) {
      if (value.type === "element") return true
    }
    return false
  }
})
