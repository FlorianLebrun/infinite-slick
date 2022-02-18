import { JSONSchema } from 'core/typing/schema'

export type PropsType = {
  typing: JSONSchema
  value: any
  onChange?: (value: any) => void
  onExpand?: (content: React.ReactElement) => void
}

export type InputDesc = {
  matchType?: (schema: JSONSchema) => boolean
  matchValue?: (value: any) => boolean
  input?: React.ComponentType<PropsType>
  editor?: React.ComponentType<PropsType>
  heading?: React.ComponentType<PropsType>
  icon?: string
  isDefaultInput?: boolean
}

export function registerInput(desc: InputDesc) {
  if (desc.isDefaultInput) defaultInput = desc
  inputs.push(desc)
}

export function findInputFor(value, typing) {
  let desc
  if (value !== undefined) {
    desc = inputs.find(x => {
      return x.matchValue(value)
    })
  }
  if (!desc && typing) {
    desc = inputs.find(x => {
      return x.matchType(typing)
    })
  }
  return desc || defaultInput
}

const inputs: InputDesc[] = []
let defaultInput: InputDesc = null
