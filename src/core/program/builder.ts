import { CommonTypes, JSONSchema } from '../typing/schema'
import { BasicProgram, Program, ProgramDesc } from "./program"
import { BadValue, OperatorDesc, Undefined, Value, ValueDesc, UseController } from './value'
import { Bridge, Constant, Field, Module } from './sources'
import config, { ModuleEntry } from '../engine'
import base64 from "base-64"

/*
1. Build and connect identifier (sync)
2. Fetch and propagate typing (async)
*/
export class ProgramBuilder {

  // Program context
  private entrypoint: Program
  program: BasicProgram

  // Dataflow element
  private modules: Map<string, Module> = new Map()
  private fields: Map<Value, Field[]> = new Map()
  private bridges: Map<Value, Bridge> = new Map()

  // Scheduling
  private waitings: Promise<any>[]

  private valueTypingManifold: Map<string, JSONSchema> = new Map()
  private valueTypingPairs: any[] = [] // For typing top-down resolution loop

  // TODO
  private valueConstraintPairs: any[] = [] // For typing down-top resolution loop

  private sourcemaps = new Map<ValueDesc, Value>()

  async build(entry: ModuleEntry, desc: ProgramDesc, exporter: (program: Program) => any): Promise<void> {
    entry.setDefinition({
      type: "view",
      properties: desc.props,
    })

    this.entrypoint = config.templates.get("program").build(desc, this) as Program
    this.entrypoint.modules = Array.from(this.modules.values())
    this.entrypoint.descriptor = desc

    /*this._propagateGraphTypings()

    while (this.waitings) {
      const waitings = Promise.all(this.waitings)
      this.waitings = null
      await waitings
      this._propagateGraphTypings()
    }*/

    for (const state of this.entrypoint.states) {
      state.finalize(this)
    }

    const prevEntrypoint = entry["entrypoint"] as Program
    entry["entrypoint"] = this.entrypoint
    if (!prevEntrypoint) {
      console.log(`> Program '${desc["name"]}':\n`, this.entrypoint)
      entry.setData(exporter(this.entrypoint))
    }
    else {
      prevEntrypoint.switchProgram(this.entrypoint)
    }

  }
  pushScope(program: BasicProgram) {
    this.program = program
  }
  popScope(program: BasicProgram) {
    console.assert(program === this.program)
    this.program = this.program.parent
  }
  error(error: Error) {
    console.error(error.message)
  }
  resolveField(base: Value, name: string): Value {
    const fields = this.fields.get(base)
    let field = fields?.find(x => x.name === name)
    if (!field) {
      field = this._linkValue(new Field(name, base))
      if (fields) fields.push(field)
      else this.fields.set(base, [field])
    }
    return field
  }
  resolveModule(ref: string): Module {
    let cmodule = this.modules.get(ref)
    if (!cmodule) {
      cmodule = new Module()
      cmodule.ref = ref
      cmodule.entry = config.requireModule(ref)
      this.modules.set(ref, cmodule)
      if (cmodule.entry.loaded) {
        this.propagateTyping(cmodule, cmodule.entry.definition)
      }
      else {
        if (!this.waitings) this.waitings = []
        this.waitings.push(new Promise((resolve, reject) => {
          cmodule.entry.requireDefinition((entry) => {
            this.propagateTyping(cmodule, entry.definition)
            resolve(cmodule)
          })
        }))
      }
    }
    return cmodule
  }
  resolveRef(path: string): Value {
    if (path.startsWith("module:")) {
      return this.resolveModule(path.slice(7))
    }
    else {
      const value = this.resolveProgramRef(path.split("/"), this.program)
      if (!value) {
        this.error(new Error("invalid binding path: " + path))
        return new BadValue()
      }
      return value
    }
  }
  resolveProgramRef(parts: string[], program: BasicProgram): Value {
    if (parts[0] === program.name) {
      let current = program.props
      for (let i = 1; i < parts.length; i++) {
        current = this.resolveField(current, parts[i])
      }
      return current
    }
    else if (program.parent) {
      const value = this.resolveProgramRef(parts, program.parent)
      if (value) {
        let bridge = this.bridges.get(value)
        if (!bridge) {
          bridge = this._linkValue(new Bridge(value, program))
          this.bridges.set(value, bridge)
        }
        return bridge
      }
    }
    this.error(new Error("invalid binding path: " + parts.join("/")))
    return new BadValue()
  }
  buildConstant<T = any>(value: T): Constant<T> {
    const node = new Constant()
    node.value = value
    this.propagateTyping(node, CommonTypes[typeof value] || CommonTypes.any)
    return node
  }
  buildValue(desc?: ValueDesc): Value {
    let operator
    if (desc instanceof Object) {
      if (desc.type) {
        const template = config.templates.get(desc.type)
        if (template) {
          operator = template.build(desc as OperatorDesc, this)
        }
        else {
          this.error(new Error(`Value type '${desc.type}' is unkown`))
          operator = new Undefined()
        }
      }
      else if (desc.$ref) {
        return this.resolveRef(desc.$ref)
      }
      else {
        throw new Error("mis formed value")
      }
    }
    else {
      operator = this.buildConstant(desc)
    }
    return this._linkValue(operator)
  }
  propagateConstraint(value: Value, typing: JSONSchema) {
    this.valueConstraintPairs.push(value, typing)
  }
  requireConstraint(value: Value, typing: JSONSchema) {
    this.valueConstraintPairs.push(value, typing)
  }
  propagateTyping(value: Value, typing: JSONSchema) {
    value.typing = typing
    for(const user of value.users){
      user.UpdateTyping(this)
    }
  }
  requireTyping(value: Value, ref: string): JSONSchema {
    console.log("requireTyping", value, ref)

    const typing = this.valueTypingManifold.get(ref)
    if (typing) return typing

    if (!this.waitings) this.waitings = []
    this.waitings.push(dowloadSchema(ref).then((typing: JSONSchema) => {
      this.valueTypingManifold.set(ref, typing)
      this.propagateTyping(value, typing)
    }, () => {
      this.valueTypingManifold.set(ref, CommonTypes.any)
      this.propagateTyping(value, CommonTypes.any)
    }))
  }
  private _linkValue<T extends Value>(value: T): T {
    this.program.listvalues.push(value)
    return value
  }
}

function dowloadSchema(ref: string): Promise<JSONSchema> {
  return Promise.resolve({ type: ref })
}

function combineSchema(typing: JSONSchema, extended: JSONSchema): JSONSchema {
  return { ...extended, ...typing }
}

config.builders.set("assembly", (entry: ModuleEntry, descriptor: any) => () => {
  const { objects } = descriptor

  // Create assembly modules
  objects.map(desc => {
    return entry.getInternalModule(desc)
  }).forEach(centry => {
    centry.builder()
  })

  if (!entry.loaded) {
  entry.setDefinition(descriptor.definition)
  entry.setData(null)
}
})

config.builders.set("data", (entry: ModuleEntry, descriptor: any) => () => {
  entry.setDefinition(descriptor.definition)
  entry.setData(descriptor.data)
})

config.builders.set("js", (entry: ModuleEntry, descriptor: any) => () => {
  let code = descriptor.data

  // Append source map
  if (descriptor.mappings && descriptor.source) {
    code += "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,"
    code += base64.encode(JSON.stringify({
      version: 3,
      file: entry.id + ".map",
      sources: [entry.id],
      sourceRoot: "inslick:/" + entry.filename,
      sourcesContent: [descriptor.source],
      mappings: descriptor.mappings,
      names: descriptor.names,
    }))
  }

  // Eval & call module constructor
  const constructor = new Function("module", "exports", "require", code)
  constructor(entry, entry.exports, entry.require.bind(entry))
  return entry
})


