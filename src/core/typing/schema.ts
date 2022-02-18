
export type JSONSchema = {
  type?: string
  $error?: string | Error
  [key: string]: any
} & PropertiesTyping

export type TypingMap = {
  [key: string]: JSONSchema
}

export type PropertiesTyping = {
  properties?: TypingMap
  patternProperties?: TypingMap
  additionalProperties?: JSONSchema
}

export type PropertiesSection = {
  title?: string
  properties?: string[]
  secondaryProperties?: string[]
  patternProperties?: string[]
  additionalProperties?: boolean
}

export type PropertiesDocumentation = {
  description?: string
  sections?: PropertiesSection[]
  additionalSection?: boolean
}


export const CommonTypes = {
  string: {
    type: "string"
  },
  number: {
    type: "string"
  },
  object: {
    type: "object"
  },
  view: {
    type: "view"
  },
  element: {
    type: "element"
  },
  any: {
  },
}

export const ErrorTypes = {
  notDeducible: {
    $error: "Cannot determine the type"
  }
}

export default {
  getPropertyTyping(propertyName: string, schema: PropertiesTyping): JSONSchema {

    // Search as standard property
    let typing = schema.properties?.[propertyName]
    if (typing) return typing

    // Search as pattern property
    const { patternProperties } = schema
    for (const pattern in patternProperties) {
      if (propertyName.match(pattern)) {
        return patternProperties[pattern]
      }
    }

    // Check error
    if (schema["$error"]) {
      return ErrorTypes.notDeducible
    }

    return schema.additionalProperties || CommonTypes.any
  }
}