import React from 'react'
import DevEnv, { ModuleExtractType } from 'core/development'
import { WindowComponent } from 'components/Application/layout'
import { DevPlugin } from '../main'
import { WindowDescriptor } from 'components/Application/layout/Window'
import Icon from 'components/Icon'
import './index.scss'
import { DragZone } from 'components/DragAndDrop'

const Menu = {
  Button: (props: {
    onDisplay: () => React.ReactNode
  }) => {
    return (<div>{"+"}</div>)
  },
  Item: (props: {
  }) => {
    return (<div>{"Item"}</div>)
  }
}

export function ModuleItem(props: {
  infos: ModuleExtractType
}) {
  const { infos } = props
  const displayMenu = () => {
    return <div />
  }
  const dragStart = () => {
    return {
      "text/plain": {
        ...infos,
        "type": "module",
      }
    }
  }
  return <div className="InSlick-ModuleItem">
    <Icon name="value/element" />
    <DragZone onDragStart={dragStart}>{infos.name}</DragZone>
    <Menu.Button onDisplay={displayMenu} />
  </div>
}

function ModuleBrowser(props: {
}) {
  const [entries, setEntries] = React.useState<ModuleExtractType[]>()

  // @ts-ignore
  React.useEffect(async () => {
    const result = await DevEnv.searchModules()
    setEntries(result)
  }, [])

  return (<div className="InSlick-ModuleBrowser">
    {entries && entries.map((desc, i) => {
      return <ModuleItem key={i} infos={desc} />
    })}
  </div>)
}

export class ModuleBrowserPanel extends WindowComponent<DevPlugin> {
  static Descriptor: WindowDescriptor = {
    userOpenable: true,
    layouting: "flexible",
    defaultTitle: "Modules",
    defaultIcon: "bug",
    defaultDockId: "left",
    parameters: {
      dev: true,
      program: true,
    }
  }
  props: {
  }
  render() {
    return <ModuleBrowser />
  }
}
