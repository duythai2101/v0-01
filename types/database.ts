export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          user_id: string
          created_at: string
          cover_url: string | null
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          user_id: string
          created_at?: string
          cover_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          user_id?: string
          created_at?: string
          cover_url?: string | null
        }
      }
      highlights: {
        Row: {
          id: string
          content: string
          book_id: string
          user_id: string
          created_at: string
          favorite: boolean
        }
        Insert: {
          id?: string
          content: string
          book_id: string
          user_id: string
          created_at?: string
          favorite?: boolean
        }
        Update: {
          id?: string
          content?: string
          book_id?: string
          user_id?: string
          created_at?: string
          favorite?: boolean
        }
      }
      book_tags: {
        Row: {
          id: string
          book_id: string
          tag_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          tag_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          tag_id?: string
          user_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Book = Database["public"]["Tables"]["books"]["Row"]
export type Highlight = Database["public"]["Tables"]["highlights"]["Row"]
export type BookTag = Database["public"]["Tables"]["book_tags"]["Row"]
export type Tag = Database["public"]["Tables"]["tags"]["Row"]

export type NewBook = Omit<Database["public"]["Tables"]["books"]["Insert"], "user_id" | "id" | "created_at">
export type NewHighlight = Omit<Database["public"]["Tables"]["highlights"]["Insert"], "user_id" | "id" | "created_at">

export interface BookWithTags extends Book {
  tags?: Tag[]
}
