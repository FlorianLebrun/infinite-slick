import Schema, { JSONSchema } from "../typing/schema"
import { ProgramBuilder } from "./builder"
import { BasicProgram, ProgramContext } from "./program"
import { InvalidValue, UseController, Value } from "./value"
import config, { ModuleEntry } from "../engine"

/****************************************************
 * Source 'Module'
 ****************************************************/
export class Module extends Value {
  entry: ModuleEntry
  ref: string
  getTitle(): string {
    return `${this.constructor.name}: ${this.ref}`
  }
  get(context: ProgramContext) {
    return this.getConstant()
  }
  getConstant() {
    return this.entry.exports
  }
}

/****************************************************
 * Source 'Constant'
 ****************************************************/
export class Constant<T = any> extends Value<T> {
  value: any
  get(context: ProgramContext): T {
    return this.value
  }
  getTitle(): string {
    return JSON.stringify(this.value)
  }
  execute(context: ProgramContext) {
    context.setState(this.stateId, this.value)
  }
  getConstant(): any {
    return this.value
  }
}
export type ConstantDesc = {
  type: "constant"
  value: any
}
config.registerModel({
  name: "constant",
  build(desc: ConstantDesc, builder: ProgramBuilder): Constant {
    return builder.buildConstant(desc.value)
  },
  eval(desc: ConstantDesc) {
    return desc.value
  }
})

/****************************************************
 * Source 'Properties'
 ****************************************************/
 export class Properties extends Value {
  isSource(): boolean {
    return true
  }
  set(value: any, context: ProgramContext) {
    context.setState(this.stateId, value)
  }
  get(context: ProgramContext) {
    return context.states[this.stateId]
  }
  execute(context: ProgramContext) {
  }
}

/****************************************************
 * Source 'Local'
 ****************************************************/
export class Local extends Value {
  isSource(): boolean {
    return true
  }
  set(value: any, context: ProgramContext) {
    context.setState(this.stateId, value)
  }
  get(context: ProgramContext) {
    return context.states[this.stateId]
  }
  execute(context: ProgramContext) {
  }
}

/****************************************************
 * Operator 'Field'
 ****************************************************/
export class Field extends Value {
  static UseSource = new class implements UseController {
    getTitle() {
      return "[source]"
    }
  }()
  constructor(public name: string, public source: Value) {
    super()
    source.addUser(this)
  }
  isSource(): boolean {
    return true
  }
  getTitle(): string {
    return `/${this.name}`
  }
  eval(context: ProgramContext) {
    const base = this.source.get(context)
    return base?.[this.name]
  }
  getConstant(): any {
    const base = this.source.getConstant()
    if (base !== InvalidValue) return base?.[this.name]
    return InvalidValue
  }
  get(context: ProgramContext) {
    return this.stateId < 0 ? this.eval(context) : context.states[this.stateId]
  }
  execute(context: ProgramContext) {
    context.setState(this.stateId, this.eval(context))
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.source, Field.UseSource)
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = Schema.getPropertyTyping(self.name, this.source.typing)
  }
}

/****************************************************
 * Operator 'Bridge'
 ****************************************************/
export class Bridge extends Value {
  static UseValue = new class implements UseController {
    getTitle() {
      return "value"
    }
  }()
  constructor(public value: Value, public target: BasicProgram) {
    super()
    value.addUser(this)
  }
  get(context: ProgramContext): any {
    return this.value.get(context.parent)
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.value, Bridge.UseValue)
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = this.value.typing
  }
}

/****************************************************
 * Operator 'Binding'
 ****************************************************/
export class Binding<T = any> extends Value<T> {
  static UseValue = new class implements UseController {
    getTitle() {
      return "value"
    }
  }()
  value: Value
  getTitle(): string {
    return ">>"
  }
  get(context: ProgramContext): T {
    return this.value.get(context)
  }
  set(value: any, context: ProgramContext) {
    this.value.set(value, context)
  }
  execute(context: ProgramContext) {
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.value, Binding.UseValue)
  }
  UpdateTyping(builder: ProgramBuilder) {
    this.typing = this.value.typing
  }
}
export type BindingDesc = {
  type: "bind"
  path: string
}
config.registerModel({
  name: "bind",
  build(desc: BindingDesc, builder: ProgramBuilder): Binding {
    const node = new Binding()
    node.value = builder.resolveRef(desc.path).addUser(node)
    return node
  }
})
