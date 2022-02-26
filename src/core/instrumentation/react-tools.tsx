
export type ReactFiberNode = {
  child: ReactFiberNode,
  sibling: ReactFiberNode,
  return: ReactFiberNode,
  memoizedProps: any,
  stateNode: any,
  elementType: any,
}

export type ReactClientRect = {
  left: number,
  right: number,
  top: number,
  bottom: number,
  width: number,
  height: number,
}

const ReactTools = {
  findNodeFromHTMLElement(element: HTMLElement): ReactFiberNode {
    for (let key in element) {
      if (element.hasOwnProperty(key) && key.indexOf('__reactFiber') !== -1) {
        return element[key]
      }
    }
  },
  getNodeProps(node: ReactFiberNode): any {
    if (!node) return undefined
    if (node["memoizedProps"]) return node["memoizedProps"] // React 16 Fiber
    if (node["_currentElement"] && node["_currentElement"].props) return node["_currentElement"].props // React <=15
  },
  getNodeParent(node: ReactFiberNode): any {
    return node.return
  },
  getHTMLElements(node: ReactFiberNode): HTMLElement[] {
    const nodes = []
    function traverse(node: ReactFiberNode) {
      const { stateNode } = node
      if (stateNode instanceof HTMLElement) {
        nodes.push(stateNode)
      }
      else if (stateNode) {
        for (let child = node.child; child; child = child.sibling) {
          traverse(child)
        }
      }
    }
    traverse(node)
    return nodes
  },
  getHTMLClientRect(node: ReactFiberNode, host?: HTMLElement): ReactClientRect {
    const rect = computeClientRect(node)
    if (rect && host) {
      const origin = host.getBoundingClientRect()
      rect.left = rect.left - origin.left
      rect.right = rect.left + rect.width
      rect.top = rect.top - origin.top
      rect.bottom = rect.top + rect.height
    }
    return rect
  }
}

export default ReactTools

function computeClientRect(node: ReactFiberNode, rect?: ReactClientRect): ReactClientRect {
  const { stateNode } = node
  if (stateNode instanceof HTMLElement) {
    const pos = stateNode.getBoundingClientRect()
    if (!rect) {
      return {
        left: pos.left,
        right: pos.right,
        top: pos.top,
        bottom: pos.bottom,
        width: pos.right - pos.left,
        height: pos.bottom - pos.top,
      }
    }
    else {
      rect.left = Math.min(rect.left, pos.left)
      rect.right = Math.max(rect.right, pos.right)
      rect.top = Math.min(rect.top, pos.top)
      rect.bottom = Math.max(rect.bottom, pos.bottom)
      rect.width = rect.right - rect.left
      rect.height = rect.bottom - rect.top
      return rect
    }
  }
  else {
    for (let child = node.child; child; child = child.sibling) {
      rect = computeClientRect(child, rect)
    }
    return rect
  }
}
