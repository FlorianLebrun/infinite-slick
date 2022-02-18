import React from "react"
import * as ReactRouter from "react-router-dom"
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import HomeView from './views/home'
import EditorView from './views/Editor'
import FlowView from './views/flow'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import "./theme/theme-dark.scss"
import "./theme/theme-dark-solarized.scss"
import "./theme/theme-light.scss"
import "./theme/theme-light-quiet.scss"
import "./components/theme.scss"
import "./App.scss"

const entrypoints = [
   HomeView,
   EditorView,
   FlowView,
]

const faviconUrl = new URL(
   './webapp/favicon.png?as=webp&width=50',
   import.meta.url
)

const MenuList = () => {
   let navigate = ReactRouter.useNavigate()
   return (<Box sx={{ width: 250 }} role="presentation">
      <List>
         {entrypoints.map((item) => {
            return <ListItem key={item.name} button onClick={() => navigate(item.path)}>
               <ListItemIcon>
                  <item.Icon />
               </ListItemIcon>
               <ListItemText primary={item.name} />
            </ListItem>
         })}
      </List>
   </Box>)
}

const MenuButton = () => {
   const [opened, setOpen] = React.useState(false)

   const toggleDrawer = (open) => (event) => {
      if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
         return
      }
      setOpen(open)
   }

   return (<React.Fragment key={'left'}>
      <IconButton
         size="large"
         edge="start"
         color="inherit"
         aria-label="menu"
         sx={{ mr: 2 }}
         onClick={toggleDrawer(true)}
      >
         <MenuIcon />
      </IconButton>
      <Drawer
         anchor={'left'}
         open={opened}
         onClose={toggleDrawer(false)}
         onClick={toggleDrawer(false)}
      >
         <MenuList />
      </Drawer>
   </React.Fragment>)
}

const themeKind = 'dark' // 'light' or 'dark'

const theme = createTheme({
   palette: {
      mode: themeKind,
   },
})

export default () => {
   window.document.body.className = "theme-" + themeKind
   return (<ThemeProvider theme={theme}>
      <ReactRouter.BrowserRouter>
         <AppBar position="static">
            <Toolbar>
               <img src={faviconUrl.toString()} />
               <Typography variant="h6" component="div" sx={{ flexGrow: 1, marginLeft: 2 }}>
                  <div>Infinite Slick</div>
               </Typography>
               <MenuButton />
            </Toolbar>
         </AppBar>
         <ReactRouter.Routes>
            {entrypoints.map((item, i) => {
               const view = new item.View
               return <ReactRouter.Route path={item.path} element={view.renderView()} />
            })}
         </ReactRouter.Routes>
      </ReactRouter.BrowserRouter>
   </ThemeProvider>)
}         
