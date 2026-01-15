export interface Client {
  id: string
  name: string
  email?: string
  website?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  clientId: string
  website?: string
  createdAt: string
  updatedAt: string
}
