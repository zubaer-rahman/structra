import { User } from './auth'
import { Project } from './projects'

export interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  project_id: string
  rating: number
  comment: string
  created_at: string
  reviewer?: User
  reviewed?: User
  project?: Project
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  project_id?: string
  content: string
  created_at: string
  sender?: User
  receiver?: User
}
