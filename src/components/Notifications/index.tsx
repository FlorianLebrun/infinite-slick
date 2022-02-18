import React from "react"
import ReactDOM from "react-dom"
/*import NotificationSystem from "react-notification-system"

type NotificationType = {
  level: string,
  message: string,
  position: string,
  uid?: number,
  title?: string,
  autoDismiss?: number,
}

let instance: {
  node: HTMLElement,
  system: NotificationSystem,
} = null

function getInstance() {
  if (!instance) {
    const node = document.createElement("div")
    document.body.appendChild(node)

    const system = ReactDOM.render(
      React.createElement(NotificationSystem),
      node
    )
    instance = { node, system }
  }
  return instance
}

export function addNotification(error: string | NotificationType, message?: string) {
  const instance = getInstance()
  if (typeof error !== "object") {
    error = {
      position: "tc",
      level: arguments[0],
      message: Array.prototype.slice.call(arguments, 1).join(),
    }
  }
  instance.system.addNotification(error)
}
*/