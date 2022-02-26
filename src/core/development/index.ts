import { CommonTypes, JSONSchema } from "core/typing/schema"
import { ElementDesc } from "../program/operators"
import { IComponentCollection } from "./collection"
import InSlick from "core/engine"

export type SearchPattern = {
  name?: string // regexp string
  tag?: string // regexp string
  typingAffinity?: JSONSchema
}

export type ModuleExtractType = {
  id: string
  name: string
  type: string
  format: string
  labels: string[]
  [more: string]: any
}

export class DevelopmentEnvironment {

  async searchModules(pattern?: SearchPattern): Promise<ModuleExtractType[]> {
    return InSlick.server.invokeAPI("core:/dev/modules?label=ui")
  }

  async createElement(viewId: string): Promise<ElementDesc> {
    return new Promise((resolve, reject) => {
      InSlick.requireModule(viewId).requireDefinition((entry) => {
        let view, definition = entry.definition
        if (definition?.type === "view") {
          view = { $ref: "module:" + viewId }
        }
        else if (definition?.default?.type === "view") {
          definition = definition?.default
          view = { $ref: "module:" + viewId, path: "default" }
        }
        else {
          return reject(new Error(`view '${viewId}' is not pointing a component`))
        }
        const props = createValueFromTyping(definition.props || CommonTypes.any)
        return resolve({ type: "element", view, props })
      })
    })
  }
}
function createValueFromTyping(typing: JSONSchema) {
  if (typing.default) {
    return typing.default
  }

  if (typing.properties) {
    const props = {}
    const { properties } = typing
    for (const name in properties) {
      props[name] = createValueFromTyping(properties[name])
    }
    return props
  }
  else if (isType(typing, "object")) {
    return {}
  }

  if (Array.isArray(typing.items)) {
    return typing.items.map(createValueFromTyping)
  }
  else if (isType(typing, "array") || typing.items) {
    return []
  }
}

function isType(typing: JSONSchema, kind: string): boolean {
  const { type } = typing
  return Array.isArray(type) ? type.includes(kind) : type === kind
}

export default new DevelopmentEnvironment()
