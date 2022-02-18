import React from "react"
import HomeIcon from '@mui/icons-material/Home'
import { View } from "../view"

class HomeView extends View {
   renderIcon(): React.ReactElement {
      return <HomeIcon />
   }
   renderView(): React.ReactElement {
      return <div>{"home"}</div>
   }
}

export default {
   name: "Home",
   path: "/home",
   Icon: HomeIcon,
   View: HomeView,
}
