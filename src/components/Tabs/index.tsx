import React from 'react'
import "./index.scss"

export type TabItem = {
  tab: any,
  content: any,
}

export function TabsBar(props: {
  atBottom?: boolean
  items: { [key: string]: TabItem }
  selection: string
  onSelection?: (selection: string) => void
}) {
  const { atBottom, selection, items, onSelection } = props
  const list = []
  for (const key in items) {
    list.push(<div
      key={key}
      className={key === selection ? "Item active" : "Item"}
      onClick={() => onSelection(key)}
    >
      {items[key].tab}
    </div>)
  }
  return (<div className={atBottom ? "InSlick-TabsBar atBottom" : "InSlick-TabsBar atTop"}>
    {list}
  </div>)
}

export function Tabs(props: {
  items: { [key: string]: TabItem }
  initial: string
  atBottom?: boolean
}) {
  const { items, atBottom } = props
  const [selection, setSelection] = React.useState(props.initial)
  const item = items[selection]
  const bar = <TabsBar
    atBottom={atBottom}
    items={items}
    selection={selection}
    onSelection={setSelection}
  />
  return (<div className="InSlick-Tabs">
    {!atBottom && bar}
    <div className="content">
      {item?.content}
    </div>
    { atBottom && bar}
  </div>)
}
