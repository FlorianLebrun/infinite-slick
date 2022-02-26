import React from "react"
import ReactDOM from "react-dom"
import ReactTools, { ReactFiberNode } from "./react-tools"
import { InstrumentationHandle } from "./InstrumentationHandle"
import { InstrumentationZone } from "./InstrumentationZone"

const dragImageUrl = new URL(
  './drag_icon.svg',
  import.meta.url
)

type PropsType = {
  onKeyDown?: (target: InstrumentationZone, event: KeyboardEvent) => void
  onSelect?: (target: InstrumentationZone, event: MouseEvent) => void
  onDrag?: (target: InstrumentationZone, event: DragEvent) => any
  onDrop?: (target: InstrumentationZone, data: any, event: DragEvent) => void
  onRegisterZone?: (target: InstrumentationZone) => void
  onUnregisterZone?: (target: InstrumentationZone) => void
  children?: any
}

export interface IInstrumentationSupport {
  readonly compacted: boolean
  readonly zones: Set<InstrumentationZone>
  setDisplay(compacted: boolean)
}

export const ReactInstrumentationContext = React.createContext<InstrumentationSupport>(null)

export class InstrumentationSupport extends React.Component implements IInstrumentationSupport {
  props: PropsType

  selected: DOMSelection = null
  hovered: DOMSelection = null
  timer: any = 0
  compacted: boolean = false

  support: HTMLElement = null
  overlay: HTMLElement = null

  zones: Set<InstrumentationZone> = new Set()

  setDisplay(compacted: boolean) {
    this.compacted = compacted
    for (const zone of this.zones.values()) {
      zone.forceUpdate()
      zone.handle?.forceUpdate()
    }
  }
  componentDidMount() {
    const { support } = this
    support.tabIndex = -1
    support.draggable = true
    support.addEventListener("keydown", this.onZoneKeyDown, true)
    support.addEventListener("mousedown", this.onZoneSelect, true)
    support.addEventListener("mousemove", this.onZoneHover, true)
    support.addEventListener("mouseleave", this.onZoneExit, true)
    support.addEventListener("dragstart", this.onZoneDragStart, true)
    support.addEventListener("dragover", this.onZoneDragOver, true)
    support.addEventListener("drop", this.onZoneDrop, true)
    //support.addEventListener("click", this.stopPropagation, true)
    this.timer = setInterval(this.zoneUpdate, 100)
  }
  componentWillUnmount() {
    const { support } = this
    support.removeEventListener("keydown", this.onZoneKeyDown, true)
    support.removeEventListener("mousedown", this.onZoneSelect, true)
    support.removeEventListener("mousemove", this.onZoneHover, true)
    support.removeEventListener("mouseleave", this.onZoneExit, true)
    support.removeEventListener("dragstart", this.onZoneDragStart, true)
    support.removeEventListener("dragover", this.onZoneDragOver, true)
    support.removeEventListener("drop", this.onZoneDrop, true)
    //support.removeEventListener("click", this.stopPropagation, true)
    clearInterval(this.timer)
  }

  private zoneSelectedRenderer = (sel: DOMSelection) => {
    sel.htmlElement.className = "InSlick-Overlay-Selected"
    if (!sel.instance.handle) {
      ReactDOM.unstable_renderSubtreeIntoContainer(
        this,
        <InstrumentationHandle removable instrumentation={sel.instance} />,
        sel.htmlElement
      )
    }
  }
  private zoneSelectedParentRenderer = (sel: DOMSelection) => {
    sel.htmlElement.className = "InSlick-Overlay-Selected-Parent"
  }
  private zoneDragOverRenderer = (sel: DOMSelection) => {
    sel.htmlElement.className = "InSlick-Overlay-DragOver"
    if (!sel.instance.handle) {
      ReactDOM.unstable_renderSubtreeIntoContainer(
        this,
        <InstrumentationHandle instrumentation={sel.instance} />,
        sel.htmlElement
      )
    }
  }
  private zoneHoverRenderer = (sel: DOMSelection) => {
    sel.htmlElement.className = "InSlick-Overlay-Hover"
  }
  zoneUpdate = () => {
    if (this.selected) this.selected.renderOverlay(this.zoneSelectedRenderer, this.zoneSelectedParentRenderer)
  }
  stopPropagation = (e: Event) => {
    e.stopPropagation()
  }
  onZoneKeyDown = (e: KeyboardEvent) => {
    const { onKeyDown } = this.props
    if (onKeyDown) {
      try {
        onKeyDown(this.selected.instance, e)
      }
      catch (e) { console.error("onKeyDown", e) }
    }
  }
  onZoneDragStart = (e: DragEvent) => {
    const { onDrag } = this.props
    if (onDrag) {
      try {
        console.log("dragstart")
        const data = onDrag(this.selected.instance, e)
        if (data) objectToDataTransfert(data, e.dataTransfer)
        //e.preventDefault()
        e.stopPropagation()
      }
      catch (e) { console.error("onDrag", e) }
    }
  }
  onZoneDragOver = (e: DragEvent) => {
    const hovered = DOMSelection.computeLayoutSelection(e.target as HTMLElement, this.overlay)
    if (!this.hovered || !hovered || this.hovered.instance !== hovered.instance) {
      if (this.hovered) this.hovered.cleanOverlay()
      this.hovered = hovered
      if (this.hovered) this.hovered.renderOverlay(this.zoneDragOverRenderer)
    }
    e.preventDefault()
    e.stopPropagation()
  }
  onZoneDrop = (e: DragEvent) => {
    const { onDrop } = this.props
    try {
      if (this.hovered) {
        onDrop && onDrop(this.hovered.instance, dataTransfertToObject(e.dataTransfer), e)
      }
    }
    catch (e) { console.error("onDrop", e) }
  }
  onZoneSelect = (e: MouseEvent) => {
    const { onSelect } = this.props
    const target = e.target as HTMLElement
    try {
      const newSelected = DOMSelection.computeLayoutSelection(target, this.overlay)
      if (newSelected === undefined) {
        return // avoid to change selection on handle
      }
      if (newSelected?.instance !== this.selected?.instance) {
        if (this.selected) this.selected.cleanOverlay()
        this.selected = newSelected
        if (newSelected) onSelect && onSelect(newSelected.instance, e)
      }
    }
    catch (e) { console.error("onSelect", e) }
  }
  onZoneHover = (e: MouseEvent) => {
    const newHovered = DOMSelection.computeLayoutSelection(e.target as HTMLElement, this.overlay)
    if (this.hovered) this.hovered.cleanOverlay()
    this.hovered = newHovered
    if (newHovered) newHovered.renderOverlay(this.zoneHoverRenderer)
  }
  onZoneExit = (e: MouseEvent) => {
    if (this.hovered) this.hovered.cleanOverlay()
  }
  useSupport = (element: HTMLElement) => {
    this.support = element
  }
  useOverlay = (element: HTMLElement) => {
    this.overlay = element
  }
  registerZone(target: InstrumentationZone) {
    this.zones.add(target)
    this.props.onRegisterZone?.(target)
  }
  unregisterZone(target: InstrumentationZone) {
    this.zones.delete(target)
    this.props.onUnregisterZone?.(target)
  }
  render() {
    const { children } = this.props
    return (<div ref={this.useSupport} className="InSlick-Instrumentation-Support">
      <ReactInstrumentationContext.Provider value={this}>
        <div ref={this.useOverlay} />
        {children}
      </ReactInstrumentationContext.Provider>
    </div>)
  }
}


class DOMSelection {
  overlay: HTMLElement
  parent: DOMSelection
  htmlElement: HTMLElement
  isLeaf: boolean

  node: ReactFiberNode
  instance: InstrumentationZone

  constructor(overlay: HTMLElement) {
    this.overlay = overlay
  }
  getRect() {
    const controller = this.instance.getController()
    if (controller.isPacked) {
      for (let parent = this.node; parent; parent = ReactTools.getNodeParent(parent)) {
        if (parent.stateNode instanceof HTMLElement) {
          return ReactTools.getHTMLClientRect(parent, this.overlay)
        }
      }
    }
    return ReactTools.getHTMLClientRect(this.node, this.overlay)
  }
  renderOverlay(renderer: (sel: DOMSelection) => void, rendererParent?: (sel: DOMSelection) => void) {
    const rect = this.getRect()
    if (!rect) return
    let new_htmlElement
    if (!this.htmlElement) {
      this.htmlElement = new_htmlElement = document.createElement("div")
      this.htmlElement.style.position = "absolute"
    }
    this.htmlElement.style.left = `${rect.left}px`
    this.htmlElement.style.top = `${rect.top}px`
    this.htmlElement.style.width = `${rect.width}px`
    this.htmlElement.style.height = `${rect.height}px`
    if (new_htmlElement) {
      if (renderer) renderer(this)
      this.overlay.appendChild(this.htmlElement)
    }
    if (this.parent && rendererParent) {
      this.parent.renderOverlay(rendererParent, rendererParent)
    }
  }
  cleanOverlay() {
    if (this.htmlElement) {
      this.htmlElement.parentElement.removeChild(this.htmlElement)
      ReactDOM.unmountComponentAtNode(this.htmlElement)
      this.htmlElement = null
    }
    if (this.parent) {
      this.parent.cleanOverlay()
    }
  }
  static computeLayoutSelection(element: HTMLElement, overlay: HTMLElement): DOMSelection {
    let firstselection: DOMSelection = null
    let lastSelection: DOMSelection = null
    let node = ReactTools.findNodeFromHTMLElement(element)
    node = node?.child || node
    while (node) {
      if (node.elementType === InstrumentationHandle) {
        return undefined
      }
      const data = (node.elementType instanceof Object) && node.elementType.$$instrumentation
      if (data) {
        const sel = new DOMSelection(overlay)
        sel.node = node
        sel.instance = node.stateNode
        if (lastSelection) {
          sel.isLeaf = false
          lastSelection.parent = sel
        }
        else {
          sel.isLeaf = true
          firstselection = sel
        }
        lastSelection = sel
      }
      node = ReactTools.getNodeParent(node)
    }
    return firstselection
  }
}

const drag_img = new Image()
drag_img.src = dragImageUrl.toString()

function objectToDataTransfert(data: { [key: string]: any }, dataTransfer: DataTransfer) {
  const content = JSON.stringify(data, null, 2)
  dataTransfer.setData("text/plain", content)
  dataTransfer.setData("application/json", content)
  dataTransfer.setDragImage(drag_img, 0, 0)
}

function dataTransfertToObject(dataTransfer: DataTransfer): any {
  for (const mtype of dataTransfer.types) {
    try {
      return JSON.parse(dataTransfer.getData(mtype))
    }
    catch (e) {
      // Nothing
    }
  }
}
