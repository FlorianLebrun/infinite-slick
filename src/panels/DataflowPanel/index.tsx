import React from 'react'
import * as vis from 'vis-network/standalone/esm'
import { BasicProgram, Binding, Bridge, Program, UseController, Value } from 'core'
import { DevPlugin } from '../main'
import { WindowComponent } from 'components/Application/layout'
import { WindowDescriptor } from 'components/Application/layout/Window'
import { JSONSchema } from 'core/typing/schema'
import './index.scss'

function VisNetwork(props: {
  data: vis.Data
  options: vis.Options
  className?: string
}) {
  const { data, options, className } = props
  function createGraph(container) {
    if (container) {
      new vis.Network(container, data, options)
    }
  }
  return <div className={className} ref={createGraph} />
}

var options = {
  autoResize: true,
  height: '100%',
  width: '100%',
  groups: {
    program: {
      shape: "box",
      color: {
        border: "#3c3",
        background: "#aca",
      }
    },
    operator: {
      shape: "box",
      color: {
        border: "#35c",
        background: "#6af",
      }
    },
    constant: {
      shape: "box",
      color: {
        border: "#333",
        background: "#aaa",
      }
    }
  }
}

function renderTyping(typing: JSONSchema, level: number) {
  function render(html: string[], typing: JSONSchema, level: number) {
    const { type, properties, items } = typing
    let title = "any"
    if (type) title = type
    else if (properties) title = "object"
    else if (items) title = "array"
    html.push(`<span class="Graph-Typing-Title">${title}</span>`)
    if (--level > 0) {
      if (properties) {
        html.push(`<div>{`)
        for (const key in properties) {
          html.push(`<div class="Graph-Typing-Block">`)
          html.push(`<b>${key}: </b>`)
          render(html, properties[key], level)
          html.push(`</div>`)
        }
        html.push(`}</div>`)
      }
      if (items) {
        html.push(`<div>[`)
        if (Array.isArray(items)) {
          for (const item of items) {
            html.push(`<div class="Graph-Typing-Block">`)
            render(html, item, level)
            html.push(`</div>`)
          }
        }
        else {
          html.push(`<div class="Graph-Typing-Block">`)
          render(html, items, level)
          html.push(`</div>`)
        }
        html.push(`]</div>`)
      }
    }
    return html
  }
  const html = []
  html.push(`<div class="Graph-Typing">`)
  render(html, typing, level)
  html.push(`</div>`)
  return html.join("")
}

function createGraphFromProgram(program: Program) {
  const edges = []
  const nodes = []
  function addEdge(from: Value, to: Value, controller: UseController, color: string) {
    edges.push({
      from: from.id,
      to: to.id,
      arrows: "to",
      label: controller.getTitle(),
      color: { color },
      font: { color: "#222", strokeWidth: 0 },
    })
  }
  function getNodeGroup(node: Value): string {
    if (node instanceof BasicProgram) {
      return "program"
    }
    else if (node.getConstant() !== Value.InvalidValue) {
      return "constant"
    }
    else {
      return "operator"
    }
  }
  function addNode(node: Value) {
    const desc: any = {
      id: node.id,
      label: node.getTitle() + " #" + node.stateId,
      group: getNodeGroup(node),
    }
    const $error = node.typing ? node.typing.$error : "--none--"
    if ($error) {
      Object.assign(desc, options.groups[desc.group])
      desc.title = `<span style='color:red'>${$error}</span>`
      desc.color = {
        ...desc.color,
        border: "red",
      }
    }
    else {
      desc.title = renderTyping(node.typing, 3)
    }
    nodes.push(desc)
  }
  for (let x of program.getValues()) {
    if (x instanceof Binding || x instanceof Bridge) {
      x.foreachUse((u, c) => addEdge(u, (x as any).value, c, "#aaf"))
    }
    else {
      x.foreachUse((u, c) => addEdge(u, x, c, "#36c"))
      addNode(x)
    }
  }

  return {
    nodes: nodes,
    edges: edges,
  }
}

export class DataFlowPanel extends WindowComponent<DevPlugin> {
  static Descriptor: WindowDescriptor = {
    userOpenable: true,
    layouting: "fitted",
    defaultTitle: "Dataflow",
    defaultIcon: "bug",
    defaultDockId: "center",
    parameters: {
      program: true,
    }
  }
  props: {
    program: Program
  }
  render() {
    const { program } = this.props
    const xdata = createGraphFromProgram(program)
    //console.log(xdata)
    return (<>
      <VisNetwork className="InSlick-DataflowPanel" data={xdata} options={options} />
    </>)
  }
}
