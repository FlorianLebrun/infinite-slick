import { CommonTypes, JSONSchema } from "../typing/schema"
import { ProgramBuilder } from "../program/builder"
import { OperatorDesc, Value, ValueDesc } from "../program/value"


export type ValueTemplate = {
  name: string
  build(desc: OperatorDesc, builder: ProgramBuilder): Value
  eval?: (desc: OperatorDesc) => any
}

export type ModuleWaiterCallback = (entry: ModuleEntry) => void

export type ModuleBuilderTemplate = (entry: ModuleEntry, descriptor: any) => ModuleBuilder

export type ModuleBuilder = () => void

export type ModuleExports = any

export type ModuleDescriptor = {
  id: string
  type: string
  [key: string]: any
}

export interface ModuleEntry {
  // see: https://nodejs.org/docs/latest/api/modules.html#modules_module_children
  //--- Main features
  id: string
  exports: ModuleExports
  definition?: JSONSchema
  builder?: ModuleBuilder
  //--- Meta features
  children?: ModuleEntry[]
  filename?: string
  path?: string
  //--- Async build features
  loaded: boolean
  requireDefinition(callback: ModuleWaiterCallback)
  requireData(callback: ModuleWaiterCallback)
  setDefinition(definition: JSONSchema)
  setData(data: ModuleExports)
  setError(error: Error)
  //--- Sync build features
  require(id: string): ModuleExports
  //--- Module tree features
  getModule(publishID: string)
  getInternalModule(descriptor: ModuleDescriptor)
}

export interface IModuleServer {
  fetchModule(id: string, resolve: (descriptor: any) => void, reject: (error: Error) => void)
  invokeAPI(path: string, content?: any): Promise<any>
  request(path: string, options?: any): Promise<any>
}


const PendingDefinition: JSONSchema = { $error: "Cannot be used now, definition is being loaded." }
const PendingData: any = { $error: "Cannot be used now, data is being loaded." }

function getEngineModuleClass(context: EngineContext) {
  const exports_waiters = new Map<ModuleEntry, ModuleWaiterCallback[]>()
  const definitions_waiters = new Map<ModuleEntry, ModuleWaiterCallback[]>()

  class BaseModuleEntry implements ModuleEntry {
    definition: JSONSchema = PendingDefinition
    exports: ModuleExports = PendingData
    children?: BaseModuleEntry[]
    builder: ModuleBuilder = undefined
    constructor(public id: string, public parent: ModuleEntry) {
    }
    get loaded(): boolean {
      return this.parent?.loaded && this.definition !== PendingDefinition && this.exports !== PendingData
    }
    findModule(id: string): BaseModuleEntry {
      return this.children && this.children.find(x => x.id === id)
    }

    //--- Async build features
    setDefinition(definition: JSONSchema) {
      this.definition = definition
      const waiters = definitions_waiters.get(this)
      if (waiters) {
        definitions_waiters.delete(this)
        waiters.forEach(x => x(this))
      }
    }
    setData(data: ModuleExports) {
      this.exports = data
      const waiters = exports_waiters.get(this)
      if (waiters) {
        exports_waiters.delete(this)
        waiters.forEach(x => x(this))
      }
    }
    setError(error: Error) {
      console.error(error)
      this.setDefinition({ $error: error })
      this.setData({ $error: error })
    }

    //--- Requirement features
    require(id: string): ModuleExports {
      const parts = id.split("#")
      const mod = context.requireModule(parts[0])
      return mod.getModule("#" + parts[1])
    }
    requireDefinition(callback: ModuleWaiterCallback) {
      if (this.definition === PendingDefinition) {
        const waiters = definitions_waiters.get(this)
        if (waiters) waiters.push(callback)
        else definitions_waiters.set(this, [callback])
      }
      else callback(this)
    }
    requireData(callback: ModuleWaiterCallback) {
      if (this.exports === PendingData) {
        const waiters = exports_waiters.get(this)
        if (waiters) waiters.push(callback)
        else exports_waiters.set(this, [callback])
      }
      else callback(this)
    }

    //--- Module tree features
    getModule(publishID: string): BaseModuleEntry {
      if (publishID === "#") return this
      let cmodule = this.findModule(publishID)
      if (!cmodule) {
        cmodule = new BaseModuleEntry(publishID, this)
        if (this.children) this.children.push(cmodule)
        else this.children = [cmodule]
      }
      return cmodule
    }
    getInternalModule(descriptor: ModuleDescriptor): BaseModuleEntry {
      const { id, publish, type } = descriptor
      let cmodule = this.getModule(publish || id)
      cmodule.builder = context.builders.get(type)(this, descriptor)
      return this.getModule(publish || id)
    }
  }

  return BaseModuleEntry
}


export class EngineContext {
  private ModuleClass = getEngineModuleClass(this)
  private modules: Map<string, ModuleEntry> = new Map()

  readonly server: IModuleServer

  builders: Map<string, ModuleBuilderTemplate> = new Map()
  templates: Map<string, ValueTemplate> = new Map()
  edition: boolean = true

  setServer(server: IModuleServer) {
    (this as any).server = server
  }
  registerModel(template: ValueTemplate) {
    this.templates.set(template.name, template)
  }
  requireModule(id: string): ModuleEntry {
    let mod = this.modules.get(id)
    if (mod === undefined) {
      mod = new this.ModuleClass(id, null)
      this.server.fetchModule(id, (descriptor) => {
        const makeBuilder = this.builders.get(descriptor.type)
        mod.builder = makeBuilder(mod, descriptor)
        if (mod.builder) mod.builder()
        else mod.setError(new Error(`Cannot build module '${id}' with type '${descriptor.type}'`))
      }, (err) => mod.setError(err))
      this.modules.set(id, mod)
    }
    return mod
  }
  installModule(id: string, definition: JSONSchema, exports?: any): ModuleEntry {
    const mod = new this.ModuleClass(id, null)
    mod.definition = definition
    mod.exports = exports
    this.modules.set(id, mod)
    return mod
  }
  getData(id: string): any {
    return this.modules.get(id)?.exports
  }
  getDefinition(id: string): JSONSchema {
    return this.modules.get(id)?.definition
  }
  evalValue(desc: ValueDesc): any {
    if (desc instanceof Object) {
      if (desc.type) {
        const template = this.templates.get(desc.type)
        if (template) {
          if (template.eval) {
            return template.eval(desc as OperatorDesc)
          }
          else {
            console.error(new Error(`Value type '${desc.type}' is not evaluable`))
          }
        }
        else {
          console.error(new Error(`Value type '${desc.type}' is unkown`))
        }
      }
      else if (desc.$ref) {
        console.error(new Error(`Value reference '${desc.type}' is supported`))
      }
      else {
        console.error(new Error("mis formed value"))
      }
    }
    else {
      return desc
    }
  }
}

const engineContext = new EngineContext()

export default engineContext
