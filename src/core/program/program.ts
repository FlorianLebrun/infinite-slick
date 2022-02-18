import { JSONSchema, CommonTypes } from '../typing/schema'
import { InvalidValue, UseController, Value, ValueDesc } from './value'
import { ProgramBuilder } from './builder'
import { Bridge, Local, Module } from './sources'
import config from '../engine'
import { Properties } from '..'

export enum StatusFlags {
  Changed = 1
}

export interface IProgramContext {
  update(props: any)
  read(): any
  dispose()
}

export class ProgramContext implements IProgramContext {
  states: any[] = []
  statuses: number[] = []
  executionIndex: number = 0
  onChange: (result) => void
  constructor(props: any, onChange: (result) => void, public program: BasicProgram, public parent: ProgramContext) {
    this.states = new Array(program.states.length).fill(InvalidValue)
    this.statuses = new Array(program.states.length).fill(0)
    this.update(props)
    this.onChange = onChange
  }
  getState(index: number): any {
    return this.states[index]
  }
  setState(index: number, value: any) {
    const prevValue = this.states[index]
    if (value !== prevValue) {
      this.states[index] = value
      this.statuses[index] |= StatusFlags.Changed
      if (this.executionIndex > index) { // Rollback execution
        this.executionIndex = index
        // Note: If it's during execution there is a feedback instability risk here
      }
    }
  }
  switchProgram(program: BasicProgram) {
    const props = this.states[this.program.props.stateId]
    this.clean()
    this.program = program
    this.states = new Array(program.states.length).fill(InvalidValue)
    this.statuses = new Array(program.states.length).fill(0)
    this.update(props)
  }
  execute() {
    while (this.executionIndex < this.states.length) {
      const state = this.program.states[this.executionIndex]
      state.execute(this)
      this.executionIndex++
    }
  }
  update(props: any) {
    this.setState(this.program.props.stateId, props)
    this.execute()
  }
  read() {
    const result = this.program.result.get(this)
    if (result === undefined) return "error"
    return result
  }
  clean() {
  }
  dispose() {
    this.program.disposeContext(this)
  }
}

/****************************************************
 * BasicProgram
 ****************************************************/
export abstract class BasicProgram extends Value {
  static UseArgument = new class implements UseController {
    getTitle() { return "[props]" }
  }()
  static UseResult = new class implements UseController {
    getTitle() { return "[result]" }
  }()
  props: Properties = null
  result: Value = null
  listvalues: Value[] = []
  states: Value[] = []
  parent: BasicProgram = null
  contexts: Set<ProgramContext> = new Set()

  name: string
  getTitle(): string {
    return `${this.constructor.name}: ${this.name}`
  }
  createContext(props: any, onChange: (result) => void, parent: ProgramContext = null): ProgramContext {
    const context = new ProgramContext(props, onChange, this, parent)
    this.contexts.add(context)
    return context
  }
  disposeContext(context: ProgramContext): void {
    this.contexts.delete(context)

  }
  switchProgram(newProgram: BasicProgram) {
    const { contexts } = this
    newProgram.contexts = contexts
    contexts.forEach(x => x.switchProgram(newProgram))
    this.contexts = null
  }
  UpdateTyping(builder: ProgramBuilder) {
    builder.requireConstraint(this.result, this.typing)
  }
}
export type BasicProgramDesc = {
  props?: JSONSchema
  result?: ValueDesc
}

function computeProgramTopologicalOrdering(program: BasicProgram): Value[] {
  // The graph is considered as a DAG
  // Here we use Depth-first search algorithm
  // Note: The detected feedback edges will be cut and managed to detected value instability (ie. not convergent value)
  // Note: Each node of a DAG is the a entrypoint of a sub DAG
  const postordered: Value[] = []
  const completedNode = new Set<Value>()
  const visitedNode = new Set<Value>()
  function visitSubDAG(n: Value): boolean {
    if (completedNode.has(n)) {
      return true
    }
    if (visitedNode.has(n)) {
      console.error("not a DAG")
      // N shall be watched to detect instable value
      return false
    }
    visitedNode.add(n)

    const { users } = n
    if (users.length > 0 && !(n instanceof Bridge)) {
      for (let i = 0; i < users.length; i += 2) {
        visitSubDAG(users[i] as Value)
      }
    }

    completedNode.add(n)
    postordered.push(n)
    return true
  }
  visitSubDAG(program.props)
  const ordered = postordered.reverse()
  ordered.forEach((n, i) => n.stateId = i)
  return ordered
}

/****************************************************
 * InlineProgram
 ****************************************************/
export class InlineProgram extends BasicProgram {
  get(context: ProgramContext) {
    let subcontext = context.states[this.result.stateId]
    if (!subcontext) {
      subcontext = this.createContext(InvalidValue, () => { }, context)
      context.states[this.result.stateId] = subcontext
    }
    return subcontext.render()
  }
  execute(context: ProgramContext) {
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.result, Program.UseResult)
  }
}
export type InlineProgramDesc = BasicProgramDesc & {
  type: "inline"
  name: string
}
config.registerModel({
  name: "inline",
  build(desc: InlineProgramDesc, builder: ProgramBuilder): InlineProgram {
    const program = new InlineProgram()
    program.name = desc.name
    program.parent = builder.program
    builder.pushScope(program)
    program.props = new Local()
    program.result = builder.buildValue(desc.result).addUser(program)
    builder.popScope(program)
    return program
  }
})

/****************************************************
 * Program
 ****************************************************/
export class Program extends BasicProgram {
  modules: Module[]
  descriptor: ProgramDesc
  sourcemaps: Map<ValueDesc, Value>
  constructor() {
    super()
    this.name = ""
  }
  getValues(): Value[] {
    const visited = new Set<Value>()
    const values = []
    function processNode(x: Value) {
      if (!x || visited.has(x)) return
      visited.add(x)
      values.push(x)
      x.foreachUse(processNode)
    }
    processNode(this.props)
    this.listvalues.forEach(processNode)
    this.modules.forEach(processNode)
    processNode(this.result)
    return values
  }
  get(context: ProgramContext) {
    const result = context.states[this.result.stateId]
    return result || null
  }
  execute(context: ProgramContext) {
    context.onChange?.(this.get(context))
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
    visitor(this.result, Program.UseResult)
  }
}
export type ProgramDesc = BasicProgramDesc & {
  type: "program" | "component"
}
config.registerModel({
  name: "program",
  build(desc: ProgramDesc, builder: ProgramBuilder): Program {
    const program = new Program()
    builder.pushScope(program)

    // Build 'properties' local
    const props = program.props = new Properties()
    builder.propagateTyping(props, desc.props)

    // Build result
    program.result = builder.buildValue(desc.result).addUser(program)

    builder.popScope(program)
    program.states = computeProgramTopologicalOrdering(program)
    return program
  }
})
