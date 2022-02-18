import { ProgramDesc } from "core/program/program"
import Listenable from "modules/listenable"

export interface EditedValue {
  id: string
}

export class EditorConnector extends Listenable {
  activeValue: EditedValue = null
  descriptor: ProgramDesc
  setActiveValue(id: string) {
    this.setState("activeValue", { id })
  }
  setDescriptor(descriptor: ProgramDesc) {
    this.setState("descriptor", descriptor)
  }
}

const connector = new EditorConnector()

export default connector
