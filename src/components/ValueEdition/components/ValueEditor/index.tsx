import React from 'react'
import { JSONSchema } from 'core/typing/schema'
import { findInputFor } from '../../base'
import "./index.scss"

export type PropsType = {
  typing: JSONSchema
  value: any
  onChange?: (value: any) => void
}

export default function ValueEditor(props: PropsType) {
  const { value, typing } = props
  const desc = findInputFor(value, typing)
  return (<div className="InSlick-ValueEditor">
    {desc.editor
      ? <desc.editor {...props} />
      : (desc.input ? <desc.input {...props} /> : "error")
    }
  </div>)
}
