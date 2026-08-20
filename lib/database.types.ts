// Generated from the Supabase schema (authors, blog_categories, blog_posts,
// blog_comments, events, sermons, announcements, member_profiles).
// Regenerate after a migration with the Supabase CLI:
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
      announcements: {
        Row: {
          body: string
          category: string | null
          created_at: string
          created_by: string | null
          expires_on: string | null
          id: string
          pinned: boolean
          publish_date: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          pinned?: boolean
          publish_date?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          pinned?: boolean
          publish_date?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'member_profiles'
            referencedColumns: ['id']
          },
        ]
      }
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
      events: {
        Row: {
          category: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          location_name: string | null
          published: boolean
          recurring: string | null
          sample: boolean
          slug: string
          start_date: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          location_name?: string | null
          published?: boolean
          recurring?: string | null
          sample?: boolean
          slug: string
          start_date: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          location_name?: string | null
          published?: boolean
          recurring?: string | null
          sample?: boolean
          slug?: string
          start_date?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_profiles: {
        Row: {
          about: string | null
          address: string | null
          approved: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          photo: string | null
          role: Database['public']['Enums']['member_role']
          show_address: boolean
          show_email: boolean
          show_in_directory: boolean
          show_phone: boolean
          updated_at: string
        }
        Insert: {
          about?: string | null
          address?: string | null
          approved?: boolean
          created_at?: string
          email: string
          full_name?: string
          id: string
          phone?: string | null
          photo?: string | null
          role?: Database['public']['Enums']['member_role']
          show_address?: boolean
          show_email?: boolean
          show_in_directory?: boolean
          show_phone?: boolean
          updated_at?: string
        }
        Update: {
          about?: string | null
          address?: string | null
          approved?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo?: string | null
          role?: Database['public']['Enums']['member_role']
          show_address?: boolean
          show_email?: boolean
          show_in_directory?: boolean
          show_phone?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          id: string
          published: boolean
          sample: boolean
          scripture: string
          series: string | null
          slug: string
          speaker: string
          summary: string
          thumbnail: string
          thumbnail_alt: string
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          date: string
          duration_minutes?: number
          id?: string
          published?: boolean
          sample?: boolean
          scripture: string
          series?: string | null
          slug: string
          speaker: string
          summary: string
          thumbnail: string
          thumbnail_alt: string
          title: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          published?: boolean
          sample?: boolean
          scripture?: string
          series?: string | null
          slug?: string
          speaker?: string
          summary?: string
          thumbnail?: string
          thumbnail_alt?: string
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      directory_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          address: string | null
          photo: string | null
          about: string | null
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_approved_member: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      moderation_comments: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          post_slug: string
          author_name: string
          author_email: string
          body: string
          approved: boolean
          created_at: string
        }[]
      }
    }
    Enums: {
      member_role: 'member' | 'editor' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
