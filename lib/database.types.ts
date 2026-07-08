// Generated from the Supabase schema (authors, blog_categories, blog_posts,
// blog_comments). Regenerate after a migration with the Supabase CLI:
//   supabase gen types typescript --project-id <ref> > lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      authors: {
        Row: {
          bio: string
          created_at: string
          id: string
          linkedin: string | null
          long_bio: string
          name: string
          photo: string
          photo_alt: string
          role: string
          sample: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          id?: string
          linkedin?: string | null
          long_bio: string
          name: string
          photo: string
          photo_alt: string
          role: string
          sample?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          linkedin?: string | null
          long_bio?: string
          name?: string
          photo?: string
          photo_alt?: string
          role?: string
          sample?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved: boolean
          author_email: string
          author_name: string
          body: string
          created_at: string
          id: string
          post_slug: string
        }
        Insert: {
          approved?: boolean
          author_email: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_slug: string
        }
        Update: {
          approved?: boolean
          author_email?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blog_comments_post_slug_fkey'
            columns: ['post_slug']
            isOneToOne: false
            referencedRelation: 'blog_posts'
            referencedColumns: ['slug']
          },
        ]
      }
      blog_posts: {
        Row: {
          author_slug: string
          body: Json
          category: string
          created_at: string
          date_modified: string | null
          date_published: string
          excerpt: string
          feature_image: string
          feature_image_alt: string
          id: string
          meta_description: string
          og_description: string
          og_title: string
          published: boolean
          read_minutes: number
          related_slugs: string[]
          sample: boolean
          slug: string
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_slug: string
          body?: Json
          category: string
          created_at?: string
          date_modified?: string | null
          date_published: string
          excerpt: string
          feature_image: string
          feature_image_alt: string
          id?: string
          meta_description: string
          og_description: string
          og_title: string
          published?: boolean
          read_minutes?: number
          related_slugs?: string[]
          sample?: boolean
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_slug?: string
          body?: Json
          category?: string
          created_at?: string
          date_modified?: string | null
          date_published?: string
          excerpt?: string
          feature_image?: string
          feature_image_alt?: string
          id?: string
          meta_description?: string
          og_description?: string
          og_title?: string
          published?: boolean
          read_minutes?: number
          related_slugs?: string[]
          sample?: boolean
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_slug_fkey'
            columns: ['author_slug']
            isOneToOne: false
            referencedRelation: 'authors'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'blog_posts_category_fkey'
            columns: ['category']
            isOneToOne: false
            referencedRelation: 'blog_categories'
            referencedColumns: ['name']
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
