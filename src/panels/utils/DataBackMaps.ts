
export class DataBackMaps {
  backrefs = new Map()
  newrefs = new Map()
  versions = []
  public pushVersion(data) {
    this.map(data)
    this.versions.push(data)
  }
  public popVersion(): any {
    this.versions.pop()
    return this.lastVersion()
  }
  public lastVersion(): any {
    return this.versions[this.versions.length - 1]
  }
  public setData(prevData: any, newData: any, versioning: boolean = true) {
    const prevParent = this.backrefs.get(prevData)
    this.newrefs.set(prevData, newData)
    if (prevParent) {
      let newParent
      if (Array.isArray(prevParent)) {
        newParent = prevParent.map(x => (x === prevData) ? newData : x)
      }
      else {
        newParent = { ...prevParent }
        for (const key in newParent) {
          if (newParent[key] === prevData) newParent[key] = newData
        }
      }
      this.setData(prevParent, newParent, versioning)
    }
    else if (this.versions.includes(prevData)) {
      this.map(newData, null)
      if (!versioning) this.versions.pop()
      this.versions.push(newData)
    }
    else {
      console.error("Cannot change data because prevData is not found")
    }
  }
  public setDataAt(path: string, data, versioning: boolean = true) {
    throw new Error()
  }
  public getLastData(data) {
    let prevData
    do {
      prevData = data
      data = this.newrefs.get(data)
    } while(data)
    return prevData
  }
  public getParentData(data) {
    return this.backrefs.get(data)
  }
  public getDataAt(path: string): any {
    const parts = path.split("/")
    let current = this.lastVersion()
    for (let i = parts[0] ? 0 : 1; i < parts.length; i++) {
      if (current instanceof Object) current = current[parts[i]]
      else break
    }
    return current
  }
  public getPath(data): string {
    const parent = this.backrefs.get(data)
    for (const key in parent) {
      if (parent[key] === data) {
        return this.getPath(parent) + "/" + key
      }
    }
    return ""
  }
  private map(data, backref = null) {
    if (data instanceof Object) {
      this.backrefs.set(data, backref)
      if (Array.isArray(data)) {
        for (const item of data) this.map(item, data)
      }
      else {
        for (const key in data) this.map(data[key], data)
      }
    }
  }
}
