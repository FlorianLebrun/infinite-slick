import React from "react"
import ViewIcon from '@mui/icons-material/EditSharp'
import { View } from "../view"
import Application from "components/Application"
import { addAPIEndPoints } from "modules/fetch"
import '../../panels/main'
import './index.scss'

addAPIEndPoints([
  {
    name: "app",
    prepare: function (url, data): string {
      data.mode = "cors"
      return "http://localhost:9988/api" + url.substr(4)
    },
  },
  {
    name: "core",
    prepare: function (url, data): string {
      data.mode = "cors"
      return "http://localhost:4000" + url.substr(5)
    },
  },
  {
    prepare: function (url, data): string {
      data.mode = "cors"
      return url
    },
  },
])

const displayLayout = {
  "#": {
    type: "#",
    child: "left",
  },
  "left": {
    type: "side-left",
    child: "bottom",
    size: 20,
  },
  "bottom": {
    type: "side-bottom",
    child: "right",
    size: 30,
  },
  "right": {
    type: "side-right",
    child: "center",
    size: 25,
  },
  "center": {
    type: "center-top",
    menu: true,
  },
}

Application.layout.mountPlugin("inslick-dev-plugin")

class EditorView extends View {
  constructor() {
    super()
  }
  renderIcon(): React.ReactElement {
    return <ViewIcon />
  }
  renderView(): React.ReactElement {
    return Application.renderFrameComponent(displayLayout)
  }
}

export default {
  name: "Editor",
  path: "/",
  Icon: ViewIcon,
  View: EditorView,
}
