import React from 'react'
import { WindowComponent } from 'components/Application/layout'
import { WindowDescriptor } from 'components/Application/layout/Window'
import ValueEdition from 'components/ValueEdition'
import { DevPlugin, ValueSelection } from '../main'
import { Program } from 'core/program/program'
import { CommonTypes } from 'core/typing/schema'

const ex_value = {
  a: "hello",
  b: 123,
  c: {
    type: "element",
    from: "div",
  },
}

export class SelectionPanel extends WindowComponent<DevPlugin> {
  static Descriptor: WindowDescriptor = {
    layouting: "fitted",
    defaultTitle: "Editor",
    defaultIcon: "bug",
    defaultDockId: "right",
    parameters: {
      program: true,
      selection: true,
    }
  }
  props: {
    program: Program
    selection: ValueSelection
  }
  setNewValue = (value) => {
    const { program, selection } = this.props
    selection.setDescriptor(value)
    console.log("new value", value)
  }
  render() {
    const { program, selection } = this.props
    if (selection) {
      return (<ValueEdition.Panel
        value={selection.descriptor}
        typing={CommonTypes.any}
        onChange={this.setNewValue}
      />)
    }
    else {
      return "Select something"
    }
  }
}
