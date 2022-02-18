import React from 'react'
import { PropsType } from "../../base"
import ExpandedZone from '../ExpandedZone'

export function ExpandableInputHOC(title: string, ExpandedComponent: React.ComponentType<PropsType>) {
  return function ExpandableInput(props: PropsType) {
    const { onExpand } = props
    const [open, setOpen] = React.useState(false)
    const swapOpen = React.useCallback(() => setOpen(!open), [open])
    return (<div className="Clickable" onClick={onExpand && swapOpen}>
      {title}
      {open && <ExpandedZone onExpand={onExpand}>
        <ExpandedComponent {...props} />
      </ExpandedZone>}
    </div>)
  }
}