import React from "react"
import { InstrumentationHandle } from "./InstrumentationHandle"
import { InstrumentationController } from "./InstrumentationController"
import { ReactInstrumentationContext } from "./InstrumentationSupport"
import Icon from "../../components/Icon"

type PropsType = {
  controller: InstrumentationController
  children?: any
}

export class InstrumentationZone extends React.Component {
  props: PropsType
  isSelected: boolean = false
  handle: InstrumentationHandle = null
  error: Error = null
  static contextType = ReactInstrumentationContext
  static $$instrumentation = true

  private retry = () => {
    this.error = null
    this.forceUpdate()
  }

  /***************************************************************
   * Instrumentation interface
   **************************************************************/
  getController(): InstrumentationController {
    return this.props.controller
  }
  select() {
    if (this.isSelected === false) {
      this.isSelected = true
      this.handle && this.handle.forceUpdate()
    }
  }
  unselect() {
    if (this.isSelected === true) {
      this.isSelected = false
      this.handle && this.handle.forceUpdate()
    }
  }
  compact() {
  }
  uncompact() {
  }
  registerHandle(handle: InstrumentationHandle): void {
    this.handle = handle
  }
  unregisterHandle(handle: InstrumentationHandle): void {
    if (this.handle === handle) this.handle = null
  }


  /***************************************************************
   * React interface
   **************************************************************/
  componentWillMount() {
    this.context.registerZone(this)
  }
  componentWillUnmount() {
    this.context.unregisterZone(this)
  }
  componentDidCatch(e) {
    this.error = new Error(e.message)
    this.forceUpdate()
  }
  render() {
    const { controller } = this.props
    if (this.error !== null) {
      const message = (this.error && this.error.message) || "error"
      return <div className="InSlick-Instrumentation-Error" title={message}>
        <pre className="msg">{message}</pre>
        <button className="btn" onClick={this.retry}>{"Retry"}</button>
      </div>
    }
    else if (controller.isInlaid === true) {
      return (<>
        {this.props.children}
        {this.context.compacted ? null : <ZoneHeader instrumentation={this} />}
      </>)
    }
    else {
      return this.props.children || null
    }
  }
}

function ErrorFallback(message: string): React.ElementType {
  return function (props) {
    return <span title={message} style={{ overflow: "hidden", backgroundColor: "#f00a" }}>{message}</span>
  }
}

class ZoneHeader extends React.Component {
  props: {
    instrumentation: InstrumentationZone
  }
  div: HTMLDivElement
  previous_paddingTop: string = ""
  previous_position: string = ""
  componentDidMount() {
    this.updatePosition()
  }
  componentDidUpdate() {
    this.updatePosition()
  }
  updatePosition() {
    const { parentElement } = this.div
    parentElement.style.paddingTop = "20px"
    parentElement.style.position = "relative"
  }
  useElement = (element: HTMLDivElement) => {
    if (element !== this.div) {
      if (this.div) {
        const { parentElement } = this.div
        parentElement.style.paddingTop = this.previous_paddingTop
        parentElement.style.position = this.previous_position
      }
      if (element) {
        const { parentElement } = element
        this.previous_paddingTop = parentElement.style.paddingTop
        this.previous_position = parentElement.style.position
      }
      this.div = element
    }
  }
  render() {
    const { instrumentation } = this.props
    const controller = instrumentation.getController()

    // Render icon
    const iconDesc = controller.getIcon()
    const icon = <Icon className="icon" name={iconDesc.name} inversed />
    const title = controller.getTitle()

    // Render header
    return (<div
      ref={this.useElement}
      className="InSlick-Instrumentation-ZoneHeader"
      title={title}
    >
      {icon}
      <span className="label">{title}</span>
    </div>)
  }
}

export function InstrumentationHOC<T extends InstrumentationController>(Component: React.ElementType, controller: T): React.ElementType {
  if (controller.isInlaid && !controller.isPacked) {
    return ErrorFallback("Cannot declare an 'inlaid' intrumentation zone without DOM element packing")
  }
  if (!(Component instanceof Function) && typeof Component !== "string") {
    return ErrorFallback("Bad component: " + controller.getTitle())
  }
  return function InstrumentationHOC(props) {
    return (<InstrumentationZone controller={controller}>
      {React.createElement(Component, props)}
    </InstrumentationZone>)
  }
}
