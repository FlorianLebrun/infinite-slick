import React from 'react'
import Schema, { JSONSchema, TypingMap, PropertiesTyping, PropertiesDocumentation } from 'core/typing/schema'
import ValueInput from '../../components/ValueInput'
import "./index.scss"

type SectionsMap = {
  [key: string]: JSONSchema
}[]

function createTypingMap(keys: string[], typings: PropertiesTyping): TypingMap {
  return null
}

function createSectionMap(keys: string[], typings: TypingMap, documentation?: PropertiesDocumentation): SectionsMap {
  return null
}

export function PropertyRow(props: {
  name: string
  typing: JSONSchema
  value: any
  onChange: (value: any) => void
}) {
  const { name, typing, value, onChange } = props
  const [expanded, setExpanded] = React.useState(null)
  return <>
    <div className="Line">
      <span className="PropertyName">{name}</span>
      <span className="PropertyValue">
        <ValueInput
          value={value}
          typing={typing}
          onExpand={setExpanded}
          onChange={onChange}
        />
      </span>
    </div>
    {expanded &&
      <div className="ExpandLine">
        {expanded}
      </div>
    }
  </>
}

export function PropertiesTable(props: {
  values: { [name: string]: any }
  typings: PropertiesTyping
  documentation?: PropertiesDocumentation
  onChange?: (values: { [name: string]: any }) => void
}) {
  const { values, typings } = props

  const onChange = React.useCallback((name) => (value) => {
    props.onChange?.({
      ...props.values,
      [name]: value,
    })
  }, null)

  //const sections = createSectionMap(Object.keys(values), typings, props.documentation)
  return (<div className="InSlick-PropertiesTable">
    {values && Object.keys(values).map((name, i) => {
      return <PropertyRow
        key={i}
        name={name}
        typing={Schema.getPropertyTyping(name, typings)}
        value={values[name]}
        onChange={onChange(name)}
      />
    })}
  </div>)
}
