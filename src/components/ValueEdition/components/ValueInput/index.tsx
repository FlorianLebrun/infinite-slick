import React from 'react'
import { PropsType, findInputFor } from '../../base'
import openContextualMenu, { Menu } from 'components/openContextualMenu'
import Icon from 'components/Icon'
import "./index.scss"

export default function ValueInput(props: PropsType) {
  const { value, typing, onExpand } = props
  const [expanded, setExpanded] = React.useState(null)
  const desc = findInputFor(value, typing)
  return (<>
    <div className="InSlick-ValueInput">
      <Icon name={desc.icon} className="Icon" onClick={(e) => openContextualMenu(null, e.currentTarget, () => {
        return <>
          <Menu.Item title="Copy" />
        </>
      })} />
      {desc ? <desc.input {...props} onExpand={onExpand || setExpanded} /> : "input"}
      <span className="Tools">{"+"}</span>
    </div>
    {expanded}
  </>)
}
