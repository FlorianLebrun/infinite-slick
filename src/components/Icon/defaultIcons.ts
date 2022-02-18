import { addIcons } from "./index"

export default function getDefaultIcons() {
  return {
    "$notfound": [new URL("./dark/error.svg", import.meta.url), new URL("./light/error.svg", import.meta.url)],
    "action/gripper": [new URL("./dark/gripper.svg", import.meta.url), new URL("./light/gripper.svg", import.meta.url)],
    "action/close": [new URL("./dark/close.svg", import.meta.url), new URL("./light/close.svg", import.meta.url)],
    "action/refresh": [new URL("./dark/refresh.svg", import.meta.url), new URL("./light/refresh.svg", import.meta.url)],

    "value/literal": [new URL("./dark/symbol-key.svg", import.meta.url), new URL("./light/symbol-key.svg", import.meta.url)],
    "value/constant": [new URL("./dark/symbol-constant.svg", import.meta.url), new URL("./light/symbol-constant.svg", import.meta.url)],
    "value/element": [new URL("./dark/symbol-misc.svg", import.meta.url), new URL("./light/symbol-misc.svg", import.meta.url)],
    "value/object": [new URL("./dark/symbol-namespace.svg", import.meta.url), new URL("./light/symbol-namespace.svg", import.meta.url)],
    "value/list": [new URL("./dark/symbol-array.svg", import.meta.url), new URL("./light/symbol-array.svg", import.meta.url)],

    "tree/openable": [new URL("./dark/triangle-right.svg", import.meta.url), new URL("./light/triangle-right.svg", import.meta.url)],
    "tree/closable": [new URL("./dark/triangle-down.svg", import.meta.url), new URL("./light/triangle-down.svg", import.meta.url)],
    "tree/empty": [new URL("./dark/circle-filled.svg", import.meta.url), new URL("./light/circle-filled.svg", import.meta.url)],

    "/editor": [new URL("./dark/edit.svg", import.meta.url), new URL("./light/edit.svg", import.meta.url)],
    "/code": [new URL("./dark/code.svg", import.meta.url), new URL("./light/code.svg", import.meta.url)],
    "/home": [new URL("./dark/home.svg", import.meta.url), new URL("./light/home.svg", import.meta.url)],

  }
}