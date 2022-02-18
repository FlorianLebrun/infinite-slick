import React from "react"

type PropsType = { [name: string]: any }

export abstract class FlowOperator {
   index: number
   users: FlowOperator[]
   usersOnField: number = 0
   usersOnContent: number = 0

   abstract get identifier(): string
   abstract Execute(context: FlowContext)

   UpdateState(context: FlowContext) {
      context.Schedule(this)
   }
   SetState(value: any, context: FlowContext) {
      const prevValue = context.states[this.index]
      if (value !== prevValue) {
         console.log("> change:", this.identifier, value)

         // Set new value
         context.states[this.index] = value

         // Update all users
         const usersOnValue = this.users ? this.users.length : 0
         for (let i = 0; i < usersOnValue; i++) {
            this.users[i].UpdateState(context)
         }
      }
      else {
         console.log("> mutation:", this.identifier, value)

         // Update only content users
         for (let i = 0; i < this.usersOnContent; i++) {
            this.users[i].UpdateState(context)
         }
      }
   }
   AddFieldUser(user: FlowOperator) {

      // Search if already registered
      let index = -1
      if (!this.users) this.users = []
      else index = this.users.indexOf(user)

      // When not match, insert at top of [mutationListeners]
      if (index < 0) {
         this.users.push(this.users[this.usersOnContent])
         this.users[this.usersOnContent] = this.users[this.usersOnField]
         this.users[this.usersOnField] = user
         this.usersOnContent++
         this.usersOnField++
      }
      else {
         throw new Error("Cannot promote alreay registered user to field")
      }
   }
   AddContentUser(user: FlowOperator) {

      // Search if already registered
      let index = -1
      if (!this.users) this.users = []
      else index = this.users.indexOf(user)

      // When not match, insert at top of [mutationListeners]
      if (index < 0) {
         this.users.push(this.users[this.usersOnContent])
         this.users[this.usersOnContent] = user
         this.usersOnContent++
      }
      // When was just value user, then promote it to content user
      else if (index >= this.usersOnContent) {
         this.users[index] = this.users[this.usersOnContent]
         this.users[this.usersOnContent] = user
         this.usersOnContent++
      }
   }
   AddValueUser(user: FlowOperator) {

      // Search if already registered
      let index = -1
      if (!this.users) this.users = []
      else index = this.users.indexOf(user)

      // When not match, insert at top of [listeners]
      if (index < 0) {
         this.users.push(user)
      }
   }

}

class FlowQueue {
   works: FlowOperator[] = []
   Push(target: FlowOperator) {
      this.works.push(target)
   }
   Pop(): FlowOperator {
      this.works.sort((x, y) => x.index - y.index)
      return this.works.pop()
   }
   get empty(): boolean {
      return this.works.length == 0
   }
}

export class FlowDefinition {
   props: DataProperties = new DataProperties()
   operators: FlowOperator[] = []
   sources: FlowOperator[] = []
   output: FlowOperator

   constructor() {
      this.AddSource(this.props)
   }
   AddSource(src: FlowOperator) {
      this.sources.push(src)
   }
   AddOperator<T extends FlowOperator>(op: T): T {
      this.operators.push(op)
      return op
   }
   AddField(name: string, source: FlowOperator): DataField {
      for (let i = 0; i < source.usersOnField; i++) {
         const field = source.users[i] as DataField
         if (field.name === name) return field
      }

      const field = new DataField()
      field.name = name
      field.source = source
      source.AddFieldUser(field)
      this.AddOperator(field)
      return field
   }
   Finalize() {
      for (let i = 0; i < this.operators.length; i++) {
         this.operators[i].index = i
      }
   }
   CreateContext() {
      return new FlowContext(this)
   }
}

export class FlowContext {
   queue: FlowQueue = new FlowQueue()
   states: any[]
   statuses: number[]
   /* status: 
   - bit 1: scheduled
   - bit 2-32: waiting counter
   */

   constructor(
      public definition: FlowDefinition,
   ) {
      this.states = new Array(definition.operators.length).fill(undefined)
      this.statuses = new Array(definition.operators.length).fill(0)
   }
   Schedule(target: FlowOperator) {
      if ((this.statuses[target.index] & /*scheduled*/0x01) === 0) {
         this.statuses[target.index] |= /*scheduled*/0x01
         this.queue.Push(target)
      }
   }
   Execute() {
      while (!this.queue.empty) {
         const target = this.queue.Pop()
         console.assert((this.statuses[target.index] & /*scheduled*/0x01) == 1)
         this.statuses[target.index] ^= /*scheduled*/0x01
         target.Execute(this)
      }
   }
   SetProperties(props: PropsType) {
      this.definition.props.SetState(props, this)
   }
   GetOutput() {
      const { output } = this.definition
      return output && this.states[output.index]
   }
}

class DataProperties extends FlowOperator {
   Execute(context: FlowContext) {
      // Shall set directly by SetState
   }
   get identifier(): string {
      return ""
   }
}

class DataState extends FlowOperator {
   name: string
   Execute(context: FlowContext) {
      // Shall set directly by SetState
   }
   get identifier(): string {
      return ""
   }
}

class DataField extends FlowOperator {
   name: string
   source: FlowOperator
   Execute(context: FlowContext) {
      const base = context.states[this.source.index]
      if (typeof base === "object") {
         this.SetState(base[this.name], context)
      }
      else {
         this.SetState(undefined, context)
      }
   }
   get identifier(): string {
      return `${this.source.identifier}/${this.name}`
   }
}

class ArrayOperator extends FlowOperator {
   values: FlowOperator[]
   Execute(context: FlowContext) {
      const value = []
      for (const item of this.values) {
         value.push(context.states[item.index])
      }
      this.SetState(value, context)
   }
   get identifier(): string {
      return `[collection]`
   }
}

class CollectionOperator extends FlowOperator {
   values: { [name: string]: FlowOperator }
   Execute(context: FlowContext) {
      const value = {}
      for (const key in this.values) {
         value[key] = context.states[this.values[key].index]
      }
      this.SetState(value, context)
   }
   get identifier(): string {
      return `[collection]`
   }
}

class Element extends FlowOperator {
   props: FlowOperator
   component: FlowOperator
   Execute(context: FlowContext) {
      const props = context.states[this.props.index]
      const component = context.states[this.component.index]
      this.SetState(React.createElement(component, props), context)
   }
   get identifier(): string {
      return `[element]`
   }
}

class Constant extends FlowOperator {
   value: any
   Execute(context: FlowContext) {
      this.SetState(this.value, context)
   }
   get identifier(): string {
      return `[constant]`
   }
}

export class FlowBuilder {
   components: Map<any, FlowOperator> = new Map()
   constants: Map<any, Constant> = new Map()

   constructor(
      public definition = new FlowDefinition(),
   ) {
   }
   GetConstant(value: any): Constant {
      let cst = this.constants.get(value)
      if (!cst) {
         cst = new Constant()
         cst.value = value
         this.constants.set(value, cst)
         this.definition.AddOperator(cst)
      }
      return cst
   }
   CreateArray(values: FlowOperator[]): ArrayOperator {
      const node = new ArrayOperator()
      node.values = values
      for (const item of values) {
         item.AddValueUser(node)
      }
      this.definition.AddOperator(node)
      return node
   }
   CreateCollection(values: { [name: string]: FlowOperator }): CollectionOperator {
      const node = new CollectionOperator()
      node.values = values
      for (const key in values) {
         values[key].AddValueUser(node)
      }
      this.definition.AddOperator(node)
      return node
   }
   CreateElement(component: Constant, props: FlowOperator): Element {
      const node = new Element()
      node.component = component
      node.props = props
      props.AddValueUser(component)
      props.AddValueUser(node)
      this.definition.AddOperator(node)
      return node
   }
   CreateProperty(name: string): DataField {
      const node = this.definition.AddField(name, this.definition.props)
      this.definition.AddSource(node)
      return node
   }
   CreateState(name: string): DataState {
      const node = new DataState()
      node.name = name
      this.definition.AddSource(node)
      return this.definition.AddOperator(node)
   }
   GetSource(name: string) {
      for (const src of this.definition.sources) {
         if ((src as any).name === name) {
            return src
         }
      }
      return null
   }
   GetField(path: string): FlowOperator {
      const parts = path.split("/")
      if (parts.length < 2) return null

      const scopeName = parts[0]
      if (scopeName) return null

      const sourceName = parts[1]
      let target = this.GetSource(sourceName)
      for (let i = 2; target && i < parts.length; i++) {
         target = this.definition.AddField(parts[i], target)
      }
      return target
   }
   SetOutput(node: FlowOperator) {
      this.definition.output = node
   }
   Finalize(): FlowDefinition {
      this.definition.Finalize()
      return this.definition
   }
}
