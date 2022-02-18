import React from 'react'
import { IProgramContext, Program } from 'core/program/program'
import { InvalidValue } from 'core/program/value'

abstract class ProgramComponent extends React.Component {
  props: { [name: string]: any }
  state: { result: any }
  programContext: IProgramContext
  constructor(props) {
    super(props)
    this.programContext = this.createContext(props)
    this.state = { result: this.programContext.read() }
  }
  componentWillUnmount() {
    this.programContext.dispose()
  }
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    this.programContext.update(nextProps)
    return this.state.result !== nextState.result
  }
  updateResult = (result) => {
    this.setState({ result })
  }
  render() {
    const { result } = this.state
    if (result === InvalidValue) return "waiting..."
    else return result
  }
  abstract createContext(props): IProgramContext
}

export function getProgramComponent(program: Program): (props: any) => any {
  let component = program["--component"]
  if (!component) {
    component = class ProgramComponentHOC extends ProgramComponent {
      createContext(props): IProgramContext {
        return program.createContext(props, this.updateResult, null)
      }
    }
    program["--component"] = component
  }
  return component
}

