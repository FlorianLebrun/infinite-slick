
export type Icon = {
  name: string
}

export interface InstrumentationController {
  readonly isPacked: boolean // True, when is inside a packing DOM element
  readonly isInlaid: boolean // True, when editor handle are shown inside a packing DOM element
  getTitle(): string
  getIcon(): Icon
  getData(): any
}

