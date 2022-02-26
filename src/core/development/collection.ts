import { JSONSchema } from "core/typing/schema"


export interface IComponentDescription {
   componentID: string
   parentID: string
   name: string
   private: boolean
   definition: JSONSchema
   assemblyUri: string
}


export interface IComponentCollection {
   GetModules(): Promise<IComponentDescription[]>
}


export interface IComponentMarketplace {
   GetCollection(id: string): IComponentCollection
   SearchCollections(query: string): IComponentCollection
}
