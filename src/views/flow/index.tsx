import React from "react"
import InboxIcon from '@mui/icons-material/MoveToInbox'
import { View } from "../view"
import { FlowBuilder, FlowContext } from "./flow"
import { Button } from "@mui/material"
import "./index.scss"

function createFlowTest_1() {
   const builder = new FlowBuilder()

   const prop1 = builder.CreateProperty("prop1")
   const field1 = builder.GetField("/prop1/field1")
   const field2 = builder.GetField("/prop1/field2")

   const output = builder.CreateElement(
      builder.GetConstant(Button),
      builder.CreateCollection({
         variant: builder.GetConstant("contained"),
         children: builder.CreateArray([field1, field2]),
      })
   )

   builder.SetOutput(output)

   const def = builder.Finalize()

   const flow = def.CreateContext()

   flow.SetProperties({ prop1: { field1: "hello", field2: "toto" } })
   flow.Execute()

   flow.SetProperties({ prop1: { field1: "world", field2: "toto" } })
   flow.Execute()

   return flow
}

const VariablePanel = () => {
   return <div className="panel variables-panel">
      hh
   </div>
}
const ContentPanel = () => {
   const flow = createFlowTest_1()
   return <div className="panel content-panel">
      <div>{"flodws"}</div>
      <div>{flow.GetOutput()}</div>

   </div>
}

const SelectionPanel = () => {
   return <div className="panel selection-panel">
      hh
   </div>
}

class FlowView extends View {
   constructor() {
      super()
   }
   renderIcon(): React.ReactElement {
      return <InboxIcon />
   }
   renderView(): React.ReactElement {
      return <div className="inslick-flow-view">
         <VariablePanel />
         <ContentPanel />
         <SelectionPanel />
      </div>
   }
}

export default {
   name: "Flow",
   path: "/flow",
   Icon: InboxIcon,
   View: FlowView,
}
