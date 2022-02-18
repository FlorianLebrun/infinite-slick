import React from "react"
import getDefaultIcons from "./defaultIcons"

export type IconCollection = {
  [name: string]: [URL, URL]
}

export const icons: IconCollection = getDefaultIcons() as any

export function addIcons(newIcons: IconCollection) {
  Object.assign(icons, newIcons)
}

export default function Icon(props: {
  name: string
  className?: string
  style?: React.CSSProperties
  inversed?: boolean
  onClick?: (evt) => void
}) {
  const { name, inversed } = props
  const icon = icons[name] || icons.$notfound
  return <div {...props} style={{ backgroundImage: `url(${icon[inversed ? 1 : 0]})`, ...styles }} />
}

const styles = {
  height: 16,
  width: 16,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
}
