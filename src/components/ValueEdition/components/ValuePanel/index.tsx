import React from 'react'
import { CommonTypes, JSONSchema } from 'core/typing/schema'
import Icon from 'components/Icon'
import CodeEditor from 'components/CodeEditor'
import { Tabs } from 'components/Tabs'
import ValueEditor from '../ValueEditor'
import "./index.scss"

export type PropsType = {
  typing: JSONSchema
  value: any
  onChange?: (value: any) => void
}

function ValueHeading(props: PropsType) {
  const { value, typing, onChange } = props
  return (<div>
    {value.type}
  </div>)
}

export default function ValuePanel(props: PropsType) {
  const { value, typing, onChange } = props
  return (<div className="InSlick-ValuePanel">
    <ValueHeading {...props} />
    <Tabs
      // atBottom
      initial="editor"
      items={{
        editor: {
          tab: <Icon name="/editor" />,
          content: <ValueEditor
            value={value}
            typing={typing}
            onChange={onChange}
          />,
        },
        code: {
          tab: <Icon name="/code" />,
          content: <CodeEditor
            value={value}
            typing={typing}
            onChange={onChange}
          />,
        }
      }}
    />

  </div>)
}
