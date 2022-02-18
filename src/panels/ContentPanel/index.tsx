import React from 'react'
import InSlick, { Program, ValueController, ValueDesc } from 'core'
import DevEnv from 'core/development'
import { CommonTypes } from 'core/typing/schema'
import { InstrumentationSupport, InstrumentationZone } from 'core/instrumentation'
import Listener from "components/Listener"
import connector from '../editor-connector'
import './index.scss'
import ValueEdition from 'components/ValueEdition'
import { WindowComponent } from 'components/Application/layout'
import { DevPlugin } from '../main'
import { WindowDescriptor } from 'components/Application/layout/Window'
import Icon from 'components/Icon'
import Button from 'components/Button'

function convertToDataDescriptor(data): ValueDesc {
  if (typeof data === "object") {
    if (Array.isArray(data)) return {
      type: "list",
      items: data.map(convertToDataDescriptor)
    }
    else return {
      type: "collection",
      values: Object.keys(data).reduce((prev, key) => {
        prev[key] = convertToDataDescriptor(data[key])
        return prev
      }, {})
    }
  }
  return data
}

const propertiesDefault = {
  x: { a: "hello", b: "world" }
}

type DropDataType = {
  type: "inslick-move"
  from: string
  content: any
} | {
  type: "inslick-component"
  id: string
}

export class ContentPanel extends WindowComponent<DevPlugin> {
  static Descriptor: WindowDescriptor = {
    userOpenable: true,
    layouting: "flexible",
    defaultTitle: "Content",
    defaultIcon: "bug",
    defaultDockId: "center",
    parameters: {
      program: true,
      Component: true,
    }
  }
  props: {
    program: Program
    Component: React.ComponentType<any>
  }
  state = {
    pos: true,
    propertiesDesc: convertToDataDescriptor(propertiesDefault),
    propertiesValue: propertiesDefault,
  }
  setPropertiesValue = (desc) => {
    this.setState({
      propertiesDesc: desc,
      propertiesValue: InSlick.evalValue(desc),
    })
  }
  onReload = () => {
  }
  onSelect = (target: InstrumentationZone, event: MouseEvent) => {
    const controller = target.getController()
    this.plugin.select(controller.getData())
  }
  dragData = (target: InstrumentationZone) => {
    const { datamaps } = this.plugin
    const content = target.getController().getData()
    return {
      type: "inslick-move",
      from: datamaps.getPath(content),
      content: content
    }
  }
  dropData = async (target: InstrumentationZone, data: DropDataType | any, variation: string) => {
    const controller = target.getController() as ValueController
    const { datamaps } = this.plugin
    let content
    if (data.type === "inslick-move") {
      content = datamaps.getDataAt(data.from)
      datamaps.setData(content, undefined)
    }
    else if (data.type === "inslick-component") {
      content = await DevEnv.createElement(data.id)
    }
    if (content) {
      const sibling = controller.getData()
      const parent = datamaps.getParentData(sibling)
      if (Array.isArray(parent)) {
        const newParent = [...parent]
        newParent.splice(parent.indexOf(sibling) + 1, 0, content)
        datamaps.setData(parent, newParent)
      }
      else {
        datamaps.setData(sibling, {
          type: "list",
          items: [
            sibling,
            content,
          ]
        })
      }
    }
    this.plugin.updateProgram()
    console.log("controller", controller)
    console.log(" -> ", data)
  }
  componentDidCatch(error, errorInfo) {
    console.log({ error, errorInfo })
  }
  render() {
    const { program, Component } = this.props
    const { propertiesDesc, propertiesValue } = this.state
    return (<div className="InSlick-ContentEditor">
      <Button name="action/refresh" secondary onClick={this.onReload} />
      <ValueEdition.Editor
        typing={program.props.typing || CommonTypes.any}
        value={propertiesDesc}
        onChange={this.setPropertiesValue}
      />
      <Listener
        object={connector}
        onChange={(data) => console.log("connector", data)}
        onEvent={null}
      >
        <InstrumentationSupport
          onDrag={this.dragData}
          onDrop={this.dropData as any}
          onSelect={this.onSelect}
        >
          <Component {...propertiesValue} />
        </InstrumentationSupport>
      </Listener>
    </div>)
  }
}
