import React from "react"
import PropTypes from "prop-types"
import openContextualMenu from 'components/openContextualMenu'
import { InstrumentationZone } from "./InstrumentationZone"
import Icon from "../../components/Icon"

type PropsType = {
  instrumentation: InstrumentationZone
  removable?: boolean
}

export class InstrumentationHandle extends React.Component {
  props: PropsType
  div: HTMLDivElement

  static contextTypes = {
    root: PropTypes.object,
  }
  constructor(props: PropsType) {
    super(props)
    const { instrumentation } = props
    instrumentation.registerHandle(this)
  }
  componentWillUnmount() {
    const { instrumentation } = this.props
    instrumentation.unregisterHandle(this)
  }
  isSelected(): boolean {
    const { instrumentation } = this.props
    return instrumentation.isSelected
  }
  handleKeyDown = (e) => {
    if (e.key === "Delete") {
      this.handleRemove(e)
    }
  }
  handleEdit = (e) => {
    /*const { instrumentation } = this.props
    const definition = instrumentation.getDefinition()
    const cmodule = definition["cmodule"]
    if (cmodule && cmodule[".editable"] && cmodule[".interface"]) {
      this.context.root.changeActiveModule(cmodule[".interface"].$ref)
    }*/
    e.stopPropagation()
  }
  handleMenu = (e) => {
    openContextualMenu(this, e.target, (f) => {
      const handleEdit = (e) => f(this.handleEdit(e))
      const handleRemove = (e) => f(this.handleRemove(e))
      return <>
        <div className="dropdown-item" onClick={handleRemove}><span className="fa fa-fw fa-trash" />{"Remove"}</div>
        <div className="dropdown-item" onClick={handleEdit}><span className="fa fa-fw fa-pencil" />{"Edit"}</div>
      </>
    })
  }
  handleSelect = (e) => {
    if (e.ctrlKey === false) {
      //const { instrumentation } = this.props
      //const definition = instrumentation.getDefinition()
      //this.context.root.selectOf(definition)
      e.stopPropagation()
    }
    e.preventDefault()
    e.stopPropagation()
  }
  handleRemove = (e) => {
    //const { instrumentation } = this.props
    //const definition = instrumentation.getDefinition()
    //this.context.root.removeAt(definition.getPath())
    e.stopPropagation()
  }
  useElement = (element: HTMLDivElement) => {
    if (this.div = element) {
      this.div.onmousedown = this.handleSelect
      this.div.onclick = this.handleSelect
    }
  }
  render() {
    const { instrumentation, removable } = this.props
    const controller = instrumentation.getController()

    // Determine displaying
    let className = "InSlick-Instrumentation-Handler"
    if (controller.isInlaid && !instrumentation.context.compacted) className += " inlaid"
    else className += " floating"

    // Render icon
    const iconDesc = controller.getIcon()
    const icon = <Icon className="icon" name={iconDesc.name} inversed/>

    // Render header
    return (<div
      ref={this.useElement}
      className={className}
      onClick={this.handleSelect}
      onDoubleClick={this.handleEdit}
      onContextMenu={this.handleMenu}
    >
      {icon}
      <span className="label">{controller.getTitle()}</span>
      {removable && <Icon className="remover" name="action/close" onClick={this.handleRemove} />}
    </div>)
  }
}
