import Application from 'components/Application'
import InSlick, { IModuleServer, ModuleEntry, Program, Value, ValueDesc } from 'core'
import { ModuleBrowserPanel } from './ModuleBrowserPanel'
import { ContentPanel } from './ContentPanel'
import { DataFlowPanel } from './DataflowPanel'
import { DataSourcePanel } from './DataSourcePanel'
import { SelectionPanel } from './SelectionPanel'
import { PluginInstance } from "components/Application/layout"
import { DataBackMaps } from "./utils/DataBackMaps"
import { ProgramBuilder } from "core/program/builder"
import { getProgramComponent } from 'core/program/component'
import { fetchAPI } from 'modules/fetch'
import { DevelopmentEnvironment } from 'core/development'
import engine from 'core/engine'

import test0 from "./test0"

class ModuleServer implements IModuleServer {
  fetchModule(id: string, resolve: (descriptor: any) => void, reject: (error: Error) => void) {
    const cached = window.localStorage.getItem("!" + id)
    if (cached) {
      resolve(JSON.parse(cached))
    }
    else {
      this.invokeAPI("core:/dev/program?mid=" + window.encodeURIComponent(id)).then(resolve, reject)
    }
  }
  invokeAPI(path: string, content?: any): Promise<any> {
    return fetchAPI(path, content && { body: content }).then(data => data.json)
  }
  request(path: string, options?: any): Promise<any> {
    return fetchAPI(path, options)
  }
  addBuiltinModule(id: string, descriptor: any) {
    window.localStorage.setItem("!" + id, JSON.stringify(descriptor))
  }
}

const server = new ModuleServer()

function addModuleBuiltin(descriptor) {
  server.addBuiltinModule(descriptor.$id, descriptor)
}

function addHtmlBuiltin(tag: string) {
  const id = "#" + tag
  engine.installModule(id, {
    name: tag,
    properties: {
      "children": {}
    },
  }, tag)
}
addHtmlBuiltin("div")
addHtmlBuiltin("span")
addModuleBuiltin(test0)

InSlick.setServer(server)

export class ValueSelection {
  constructor(
    public context: DevPlugin,
    public descriptor: ValueDesc,
    public value: Value
  ) {
  }
  setDescriptor(descriptor: ValueDesc) {
    const { datamaps } = this.context
    datamaps.setData(this.descriptor, descriptor)
    this.context.updateProgram()
    this.context.select(descriptor)
  }
}

export class DevPlugin extends PluginInstance {
  program: Program
  cmodule: ModuleEntry
  Component: (props) => any
  selection: ValueSelection
  datamaps = new DataBackMaps()

  pluginDidMount() {
    this.loadProgram()

    Application.setWindowMenu([
      {
        "icon": "save",
        "title": "Save current state",
        "action": "save",
      },
      {
        "icon": "cog",
        "title": "Show menu",
        "action": "menu",
      },
    ])
  }

  async loadProgram(): Promise<void> {
    InSlick.requireModule("#").requireData((cmodule) => {
      const program = cmodule["entrypoint"] as Program
      if (!program) return
      this.datamaps.pushVersion(program.descriptor)
      this.setState({
        cmodule,
        program,
        Component: cmodule.exports
      })
      this.select(this.datamaps.lastVersion())
      this.openWindow("datasource")
      this.openWindow("module-browser")
      this.openWindow("selection")
      this.openWindow("content")
      this.openWindow("dataflow")
    })
  }
  async updateProgram(): Promise<void> {
    const descriptor = this.datamaps.lastVersion()
    if (this.program.descriptor !== descriptor) {
      new ProgramBuilder().build(this.cmodule, descriptor, (program) => getProgramComponent(program))
      if (this.selection) this.select(this.datamaps.getLastData(this.selection.descriptor))
      else this.select(this.datamaps.lastVersion())
    }
  }
  select(descriptor: ValueDesc) {
    const path = this.datamaps.getPath(descriptor)
    this.setState({ selection: new ValueSelection(this, descriptor, null) })
    //console.log("at '", path, "':", descriptor)
    console.assert(this.datamaps.getDataAt(path) === descriptor)
  }
}

Application.layout.declarePlugin({
  name: "inslick-dev-plugin",
  title: "InSlick Dev",
  component: DevPlugin,
  importPlugins: { console: "dev-console" },
  windows: {
    "module-browser": {
      component: ModuleBrowserPanel,
    },
    "datasource": {
      component: DataSourcePanel,
    },
    "content": {
      component: ContentPanel,
    },
    "dataflow": {
      component: DataFlowPanel,
    },
    "selection": {
      component: SelectionPanel,
    },
  },
})
