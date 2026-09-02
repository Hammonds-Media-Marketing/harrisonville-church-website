// Hand-maintained mirror of the Supabase schema (blog, CMS, members, and the
// member portal tables added in 20260903100000_member_portal.sql).
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
          image: string | null
          image_alt: string | null
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
          image?: string | null
          image_alt?: string | null
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
          image?: string | null
          image_alt?: string | null
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
          anniversary: string | null
          approved_at: string | null
          approved_by: string | null
          birthday: string | null
          family_id: string | null
          gender: string | null
          last_seen_at: string | null
          photo_position: string
          rejected_at: string | null
          show_anniversary: boolean
          show_birthday: boolean
          welcome_email_sent_at: string | null
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
          anniversary?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birthday?: string | null
          family_id?: string | null
          gender?: string | null
          last_seen_at?: string | null
          photo_position?: string
          rejected_at?: string | null
          show_anniversary?: boolean
          show_birthday?: boolean
          welcome_email_sent_at?: string | null
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
          anniversary?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birthday?: string | null
          family_id?: string | null
          gender?: string | null
          last_seen_at?: string | null
          photo_position?: string
          rejected_at?: string | null
          show_anniversary?: boolean
          show_birthday?: boolean
          welcome_email_sent_at?: string | null
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
      calendar_events: {
        Row: {
          all_day: boolean
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          recurrence_ends_on: string | null
          recurring: string | null
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          all_day?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          recurrence_ends_on?: string | null
          recurring?: string | null
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          all_day?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          recurrence_ends_on?: string | null
          recurring?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          member_id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          member_id: string
          message_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          member_id?: string
          message_id?: string
        }
        Relationships: []
      }
      chat_read_states: {
        Row: {
          direct_member_id: string | null
          group_id: string | null
          last_read_at: string
          member_id: string
          updated_at: string
        }
        Insert: {
          direct_member_id?: string | null
          group_id?: string | null
          last_read_at?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          direct_member_id?: string | null
          group_id?: string | null
          last_read_at?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      communion_signup_reminders: {
        Row: {
          communion_signup_id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          communion_signup_id: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          communion_signup_id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: []
      }
      communion_signups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          member_id: string
          notes: string | null
          removed_at: string | null
          removed_by: string | null
          signup_month: number
          signup_year: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_id: string
          notes?: string | null
          removed_at?: string | null
          removed_by?: string | null
          signup_month: number
          signup_year: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          removed_at?: string | null
          removed_by?: string | null
          signup_month?: number
          signup_year?: number
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          created_by: string | null
          family_name: string
          id: string
          photo: string | null
          photo_position: string
          postal_code: string | null
          show_address: boolean
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          family_name: string
          id?: string
          photo?: string | null
          photo_position?: string
          postal_code?: string | null
          show_address?: boolean
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          family_name?: string
          id?: string
          photo?: string | null
          photo_position?: string
          postal_code?: string | null
          show_address?: boolean
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_children: {
        Row: {
          birthday: string | null
          created_at: string
          created_by: string | null
          family_id: string
          first_name: string
          gender: string | null
          id: string
          last_name: string | null
          photo: string | null
          photo_position: string
          show_birthday: boolean
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          created_by?: string | null
          family_id: string
          first_name: string
          gender?: string | null
          id?: string
          last_name?: string | null
          photo?: string | null
          photo_position?: string
          show_birthday?: boolean
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          created_by?: string | null
          family_id?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string | null
          photo?: string | null
          photo_position?: string
          show_birthday?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          added_by: string | null
          created_at: string
          group_id: string
          member_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          group_id: string
          member_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          group_id?: string
          member_id?: string
        }
        Relationships: []
      }
      group_notification_preferences: {
        Row: {
          enabled: boolean
          group_id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          group_id: string
          member_id: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          group_id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          kind: string
          name: string
          special_event_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          name: string
          special_event_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          name?: string
          special_event_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      in_app_notifications: {
        Row: {
          body: string
          created_at: string
          destination_url: string
          entity_id: string | null
          entity_type: string | null
          event_key: string
          id: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          destination_url: string
          entity_id?: string | null
          entity_type?: string | null
          event_key: string
          id?: string
          notification_type: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          destination_url?: string
          entity_id?: string | null
          entity_type?: string | null
          event_key?: string
          id?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      installed_app_detections: {
        Row: {
          first_detected_at: string
          last_detected_at: string
          member_id: string
          platform_category: string
          standalone_detected: boolean
        }
        Insert: {
          first_detected_at?: string
          last_detected_at?: string
          member_id: string
          platform_category?: string
          standalone_detected?: boolean
        }
        Update: {
          first_detected_at?: string
          last_detected_at?: string
          member_id?: string
          platform_category?: string
          standalone_detected?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          group_id: string | null
          id: string
          image_height: number | null
          image_path: string | null
          image_width: number | null
          message_type: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          image_height?: number | null
          image_path?: string | null
          image_width?: number | null
          message_type?: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          image_height?: number | null
          image_path?: string | null
          image_width?: number | null
          message_type?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          admin_new_member: boolean
          announcements: boolean
          calendar: boolean
          created_at: string
          direct_messages: boolean
          group_messages: boolean
          member_id: string
          special_events: boolean
          updated_at: string
        }
        Insert: {
          admin_new_member?: boolean
          announcements?: boolean
          calendar?: boolean
          created_at?: string
          direct_messages?: boolean
          group_messages?: boolean
          member_id: string
          special_events?: boolean
          updated_at?: string
        }
        Update: {
          admin_new_member?: boolean
          announcements?: boolean
          calendar?: boolean
          created_at?: string
          direct_messages?: boolean
          group_messages?: boolean
          member_id?: string
          special_events?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      service_assignments: {
        Row: {
          assignee_name: string | null
          created_at: string
          created_by: string | null
          duty: string
          id: string
          member_id: string | null
          notes: string | null
          service_date: string
          service_slot: string
          updated_at: string
        }
        Insert: {
          assignee_name?: string | null
          created_at?: string
          created_by?: string | null
          duty: string
          id?: string
          member_id?: string | null
          notes?: string | null
          service_date: string
          service_slot: string
          updated_at?: string
        }
        Update: {
          assignee_name?: string | null
          created_at?: string
          created_by?: string | null
          duty?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          service_date?: string
          service_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_schedule_months: {
        Row: {
          arranger_name: string | null
          created_at: string
          created_by: string | null
          file_url: string | null
          month: number
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          arranger_name?: string | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          month: number
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          arranger_name?: string | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          month?: number
          notes?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      special_event_exclusions: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          member_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          member_id?: string
        }
        Relationships: []
      }
      special_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          guest_count: number
          member_id: string
          response: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_count?: number
          member_id: string
          response: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_count?: number
          member_id?: string
          response?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_event_signup_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          needed_at: string | null
          title: string
          updated_at: string
          volunteers_needed: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          needed_at?: string | null
          title: string
          updated_at?: string
          volunteers_needed?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          needed_at?: string | null
          title?: string
          updated_at?: string
          volunteers_needed?: number
        }
        Relationships: []
      }
      special_event_signups: {
        Row: {
          created_at: string
          member_id: string
          note: string | null
          signup_item_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          note?: string | null
          signup_item_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          note?: string | null
          signup_item_id?: string
        }
        Relationships: []
      }
      special_events: {
        Row: {
          all_day: boolean
          archived_at: string | null
          audience: string
          category: string | null
          chat_group_id: string | null
          created_at: string
          created_by: string
          description: string
          ends_at: string | null
          id: string
          location: string | null
          rsvp_enabled: boolean
          starts_at: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          all_day?: boolean
          archived_at?: string | null
          audience?: string
          category?: string | null
          chat_group_id?: string | null
          created_at?: string
          created_by: string
          description?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          rsvp_enabled?: boolean
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          all_day?: boolean
          archived_at?: string | null
          audience?: string
          category?: string | null
          chat_group_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          rsvp_enabled?: boolean
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          path: string
          updated_at: string
          updated_by: string | null
          values: Json
        }
        Insert: {
          path: string
          updated_at?: string
          updated_by?: string | null
          values?: Json
        }
        Update: {
          path?: string
          updated_at?: string
          updated_by?: string | null
          values?: Json
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          hero_eyebrow: string
          hero_lead: string | null
          id: string
          meta_description: string
          meta_title: string
          og_description: string
          og_image: string | null
          og_image_alt: string | null
          og_title: string
          published: boolean
          sample: boolean
          sections: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_eyebrow?: string
          hero_lead?: string | null
          id?: string
          meta_description?: string
          meta_title?: string
          og_description?: string
          og_image?: string | null
          og_image_alt?: string | null
          og_title?: string
          published?: boolean
          sample?: boolean
          sections?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_eyebrow?: string
          hero_lead?: string | null
          id?: string
          meta_description?: string
          meta_title?: string
          og_description?: string
          og_image?: string | null
          og_image_alt?: string | null
          og_title?: string
          published?: boolean
          sample?: boolean
          sections?: Json
          slug?: string
          title?: string
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
      member_directory: {
        Row: {
          about: string | null
          address: string | null
          anniversary: string | null
          birthday: string | null
          created_at: string
          email: string | null
          family_id: string | null
          first_name: string
          full_name: string
          gender: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          photo: string | null
          photo_position: string
          role: Database['public']['Enums']['member_role']
          show_in_directory: boolean
        }
        Relationships: []
      }
    }
    Functions: {
      add_member_to_family: {
        Args: { target_family_id: string; target_member_id: string }
        Returns: undefined
      }
      can_access_group: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      can_access_special_event: {
        Args: { target_event_id: string }
        Returns: boolean
      }
      can_manage_special_event: {
        Args: { target_event_id: string }
        Returns: boolean
      }
      chat_unread_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      claim_signup_item: {
        Args: { target_item_id: string; target_note?: string | null }
        Returns: undefined
      }
      direct_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          member_id: string
          last_body: string
          last_type: string
          last_at: string
          last_sender_id: string
        }[]
      }
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
      is_family_member: {
        Args: { target_family_id: string }
        Returns: boolean
      }
      is_special_event_participant: {
        Args: { target_event_id: string; target_member_id?: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: { target_id: string }
        Returns: undefined
      }
      send_communion_reminders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      special_event_invitees: {
        Args: { target_event_id: string }
        Returns: {
          member_id: string
          full_name: string
          photo: string | null
          response: string | null
          guest_count: number
          responded_at: string | null
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
