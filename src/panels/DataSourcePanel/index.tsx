import React from 'react'
import { WindowComponent } from 'components/Application/layout'
import { DevPlugin, ValueSelection } from '../main'
import { Program, Value } from 'core'
import "./index.scss"
import Icon from 'components/Icon'
import { WindowDescriptor } from 'components/Application/layout/Window'

function ExpendableNode(props: {
  title?: string
  label?: any
  children?: React.ReactNode | (() => React.ReactNode)
}) {
  const { title, label, children } = props
  const [open, setOpen] = React.useState(false)
  const swapOpen = children && (() => setOpen(!open))

  let iconName
  if (!children) iconName = "tree/empty"
  else if (open) iconName = "tree/closable"
  else iconName = "tree/openable"

  return (<div className="InSlick-ExpendableNode">
    <span className="Label" title={title}>
      <Icon name={iconName} onClick={swapOpen} />
      {label}
    </span>
    {open && <div className="Content">
      {children instanceof Function ? children() : children}
    </div>}
  </div>)
}

function DataSourceNode(props: {
  value: Value
  onSelect: (value: Value) => void
}) {
  const { value, onSelect } = props
  const onClick = React.useCallback(() => onSelect(value), [value])
  let list
  for (let i = 0; i < value.users.length; i += 2) {
    const subvalue = value.users[i] as Value
    if (subvalue.isSource()) {
      if (!list) list = []
      list.push(<DataSourceNode
        key={list.length}
        value={subvalue}
        onSelect={onSelect}
      />)
    }
  }
  return <ExpendableNode
    label={<span onClick={onClick}>{value.getTitle()}</span>}
    children={list}
  />
}

export class DataSourcePanel extends WindowComponent<DevPlugin> {
  static Descriptor: WindowDescriptor = {
    userOpenable: true,
    layouting: "flexible",
    defaultTitle: "Source",
    defaultIcon: "bug",
    defaultDockId: "left",
    parameters: {
      dev: true,
      program: true,
      selection: true,
    }
  }
  props: {
    program: Program
    selection: ValueSelection
  }
  selectValue = (value: Value) => {
    const { program } = this.props
    //const descriptor = value.descriptor
    //this.plugin.select(value.descriptor)
  }
  render() {
    const { program, selection } = this.props
    return <>
      <DataSourceNode value={program.props} onSelect={this.selectValue} />
    </>
  }
}
