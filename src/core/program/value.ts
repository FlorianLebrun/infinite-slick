import { JSONSchema, CommonTypes } from '../typing/schema'
import { ProgramBuilder } from './builder'
import { ProgramContext } from './program'

// a synchronous group, is a sub graph with only synchronous edge inside
class SyncGroup {
  nodes: Value[]
  // When a node can have async value, the sync group shall split with a new sync group
  createAsyncGroup(origin: Value): SyncGroup {
    throw new Error()
  }
}

export type OperatorDesc = {
  type: string
  [key: string]: any
}

export type RefDesc = {
  $ref: string
  [key: string]: any
}
export type ValueDesc = OperatorDesc | RefDesc | string | number

export const InvalidValue = new class $invalid { }()

export interface UseController {
  getTitle(): string
}

let idGenerator = 0
function createId(): string { return "#" + idGenerator++ }

export abstract class Value<T = any> {
  static InvalidValue = InvalidValue

  stateId: number = -1
  typing: JSONSchema
  users: Value[] = []
  group: SyncGroup

  constructor(public id: string = createId()) {
  }
  isSource(): boolean {
    return false
  }
  getTitle(): string {
    return this.constructor.name
  }
  getConstant(): any {
    return InvalidValue
  }
  getDefinition(): JSONSchema {
    return CommonTypes.any
  }

  // Graph connection features
  getField(name: string): Value {
    return null
  }
  addUser(user: Value): Value {
    this.users.push(user)
    return this
  }
  foreachUse(visitor: (used: Value, controller: UseController) => void) {
  }

  // Build features
  adapt(builder: ProgramBuilder, typing: JSONSchema) {
    return this
  }
  finalize(builder: ProgramBuilder) {
  }

  // Runtime features
  execute(context: ProgramContext) {
  }
  set(value: T, context: ProgramContext) {
  }
  abstract get(context: ProgramContext): T

  UpdateTyping(builder: ProgramBuilder) {

  }
}

export class BadValue extends Value {
  getTitle(): string {
    return "<bad>"
  }
  get(context: ProgramContext): any {
    return undefined
  }
  execute(context: ProgramContext) {
  }
}

export class Undefined extends Value {
  getTitle(): string {
    return "<undefined>"
  }
  get(context: ProgramContext): any {
    return undefined
  }
  execute(context: ProgramContext) {
  }
}
