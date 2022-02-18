import React from 'react'
import Icon from 'components/Icon'
import ValueInput from '../../components/ValueInput'
import { JSONSchema } from 'core/typing/schema'
import "./index.scss"

export function ArrayRow(props: {
  value: any
  typing: JSONSchema
  onChange: (value: any) => void
}) {
  const { typing, value, onChange } = props
  const [expanded, setExpanded] = React.useState(null)
  return <>
    <div className="Line">
      <Icon name="action/gripper" />
      <ValueInput
        value={value}
        typing={typing}
        onExpand={setExpanded}
        onChange={onChange}
      />
    </div>
    {expanded &&
      <div className="ExpandLine">
        {expanded}
      </div>
    }
  </>
}

export function ArrayTable(props: {
  items: any[]
  itemTyping: any
  documentation?: any
  onChange?: (values: any[]) => void
}) {
  const { items, itemTyping } = props

  const onChange = React.useCallback((index) => (value) => {
    const newValue = props.items ? [...props.items] : []
    newValue[index] = value
    props.onChange?.(newValue)
  }, null)

  return (<div className="InSlick-ArrayTable">
    {items && items.map((value, i) => {
      return <ArrayRow
        key={i}
        value={value}
        typing={itemTyping}
        onChange={onChange(i)}
      />
    })}
  </div>)
}
