import React from "react"

export abstract class View {
   abstract renderIcon(): React.ReactElement
   abstract renderView(): React.ReactElement
}
