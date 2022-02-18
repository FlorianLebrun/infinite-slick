import React from 'react'
import { Icon, InstrumentationController, InstrumentationHOC } from '../instrumentation'
import { CommonTypes, JSONSchema } from "../typing/schema"
import { ProgramBuilder } from "./builder"
import { ProgramContext } from "./program"
import { UseController, Value, ValueDesc } from "./value"
import { getProgramComponent } from "./component"
import config, { ModuleEntry } from "../engine"

/****************************************************
 * Operator
 ****************************************************/
export abstract class Operator<T = any> extends Value<T> {
  abstract eval(context: ProgramContext): T
  get(context: ProgramContext) {
    return this.stateId < 0 ? this.eval(context) : context.states[this.stateId]
  }
  execute(context: ProgramContext) {
    context.setState(this.stateId, this.eval(context))
  }
}

/****************************************************
 * Operator 'List'
 ****************************************************/
class ListItemUse implements UseController {
  static register = new Map<number, ListItemUse>()
  constructor(public readonly index: number) {
  }
  getTitle() {
    return "#" + this.index
  }
  static get(index: number) {
    let use = ListItemUse.register.get(index)
    if (!use) ListItemUse.register.set(index, use = new ListItemUse(index))
    return use
  }
}
export class List<T = any> extends Operator<T[]> {
  items: Value[]
  getTitle(): string {
    return "[ ]"
  }
  eval(context: ProgramContext) {
    return this.items.map(item => item.get(context))
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    this.items.forEach((item, i) => visitor(item, ListItemUse.get(i)))
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = {
      type: "array",
      items: this.items.map(x => x.typing || CommonTypes.any),
    }
  }
}
export type ListDesc = {
  type: "list"
  items: ValueDesc[]
}
config.registerModel({
  name: "list",
  build(desc: ListDesc, builder: ProgramBuilder): List {
    const node = new List()
    const items: Value[] = []
    for (const item of desc.items) {
      items.push(builder.buildValue(item).addUser(node))
    }
    node.items = items
    return node
  },
  eval(desc: ListDesc) {
    return desc.items ? desc.items.map(x => config.evalValue(x)) : []
  }
})

/****************************************************
 * Operator 'Collection'
 ****************************************************/
class CollectionPropertyUse implements UseController {
  static register = new Map<string, CollectionPropertyUse>()
  constructor(public readonly name: string) {
  }
  getTitle() {
    return this.name
  }
  static get(name: string) {
    let use = CollectionPropertyUse.register.get(name)
    if (!use) CollectionPropertyUse.register.set(name, use = new CollectionPropertyUse(name))
    return use
  }
}
export class Collection<T = any> extends Operator<T[]> {
  values: { [key: string]: Value }
  getTitle(): string {
    //return `{ ${Object.keys(this.values).join(", ")} }`
    return "{ }"
  }
  eval(context: ProgramContext) {
    const props: any = {}
    for (const key in this.values) {
      props[key] = this.values[key].get(context)
    }
    return props
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    for (const key in this.values) {
      visitor(this.values[key], CollectionPropertyUse.get(key))
    }
  }
  UpdateTyping(builder: ProgramBuilder) {
    const { values } = this
    const keys = Object.keys(values)
    this.typing = {
      type: "object",
      properties: keys.reduce((prev, key) => {
        prev[key] = values[key].typing || CommonTypes.any
        return prev
      }, {})
    }
  }
}
export type CollectionDesc = {
  type: "collection"
  values: ValueDesc[]
}
config.registerModel({
  name: "collection",
  build(desc: CollectionDesc, builder: ProgramBuilder): Collection {
    const node = new Collection()
    const props: any = {}
    for (const key in desc.values) {
      props[key] = builder.buildValue(desc.values[key]).addUser(node)
    }
    node.values = props
    return node
  },
  eval(desc: CollectionDesc) {
    const result: any = {}
    for (const key in desc.values) result[key] = config.evalValue(desc.values[key])
    return result
  }
})

export interface ValueController extends InstrumentationController {
  getPath(): string
}

/****************************************************
 * Operator 'InstrumentedView'
 ****************************************************/
export class InstrumentedView extends Operator<React.ElementType> {
  static UseView = new class implements UseController {
    getTitle() { return "[instrument]" }
  }()
  value: Value
  constructor(value: Value, public controller: ValueController) {
    super()
    this.value = value.addUser(this)
  }
  eval(context: ProgramContext) {
    return InstrumentationHOC(
      this.value.get(context) as React.ElementType,
      this.controller
    )
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.value, InstrumentedView.UseView)
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = this.value.typing
  }
}

/****************************************************
 * Operator 'Element'
 ****************************************************/
export class Element extends Operator<React.ReactElement> {
  static UseView = new class implements UseController {
    getTitle() { return "[view]" }
  }()
  static UseProps = new class implements UseController {
    getTitle() { return "[props]" }
  }()
  component: Value<React.ElementType>
  props: Value<{ [prop: string]: any }>
  eval(context: ProgramContext) {
    const props = this.props.get(context)
    const component = this.component.get(context)
    return React.createElement("div", null, React.createElement(component, props))
  }
  finalize(builder) {
    console.log(this)
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.component, Element.UseView)
    visitor(this.props, Element.UseProps)
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = CommonTypes.element
    builder.requireConstraint(this.props, this.typing.props)
  }
}
export class ElementController implements ValueController {
  constructor(
    public node: Element,
    public descriptor: ElementDesc,
    public isInlaid: boolean,
    public isPacked: boolean,
  ) {
  }
  getIcon(): Icon {
    return { name: "value/element" }
  }
  getTitle(): string {
    return this.node.component.getTitle()
  }
  getData(): ElementDesc {
    return this.descriptor
  }
  getPath(): string {
    return "/element/toto"
  }
}
export type ElementDesc = {
  type: "element"
  view: ValueDesc
  props: { [key: string]: ValueDesc }
  inlaid?: boolean
}
config.registerModel({
  name: "element",
  build(desc: ElementDesc, builder: ProgramBuilder): Element {
    const node = new Element()

    // Prepare component
    let cview = builder.buildValue(desc.view)
    if (config.edition) {
      cview = new InstrumentedView(cview,
        new ElementController(node, desc, desc.inlaid || false, true)
      )
    }
    node.component = cview.addUser(node)

    // Prepare properties
    const props = builder.buildValue({ type: "collection", values: desc.props })
    node.props = props.addUser(node)
    return node
  }
})

config.builders.set("component", (entry: ModuleEntry, descriptor: any) => () => {
  new ProgramBuilder().build(entry, descriptor, (program) => getProgramComponent(program))
})
