export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      art_discussions: {
        Row: {
          art_piece_id: string
          channel_id: string
          discussion_summary: string | null
          id: string
          posted_at: string
        }
        Insert: {
          art_piece_id: string
          channel_id: string
          discussion_summary?: string | null
          id?: string
          posted_at?: string
        }
        Update: {
          art_piece_id?: string
          channel_id?: string
          discussion_summary?: string | null
          id?: string
          posted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_discussions_art_piece_id_fkey"
            columns: ["art_piece_id"]
            isOneToOne: false
            referencedRelation: "art_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_discussions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_discussions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      art_pieces: {
        Row: {
          artist: string
          created_at: string
          description: string | null
          discussed_at: string | null
          discussion_count: number | null
          id: string
          image_url: string
          medium: string | null
          period: string | null
          source: string | null
          source_id: string | null
          title: string
          year: string | null
        }
        Insert: {
          artist: string
          created_at?: string
          description?: string | null
          discussed_at?: string | null
          discussion_count?: number | null
          id?: string
          image_url: string
          medium?: string | null
          period?: string | null
          source?: string | null
          source_id?: string | null
          title: string
          year?: string | null
        }
        Update: {
          artist?: string
          created_at?: string
          description?: string | null
          discussed_at?: string | null
          discussion_count?: number | null
          id?: string
          image_url?: string
          medium?: string | null
          period?: string | null
          source?: string | null
          source_id?: string | null
          title?: string
          year?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          banned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bot_photos: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          photo_type: string
          photo_url: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          photo_type?: string
          photo_url: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          photo_type?: string
          photo_url?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          allowed_channels: string[]
          chat_speed: number
          enabled: boolean
          id: string
          moderator_bots_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_channels?: string[]
          chat_speed?: number
          enabled?: boolean
          id?: string
          moderator_bots_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_channels?: string[]
          chat_speed?: number
          enabled?: boolean
          id?: string
          moderator_bots_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      channel_access_list: {
        Row: {
          access_level: number
          channel_id: string
          granted_at: string
          granted_by: string
          id: string
          user_id: string
        }
        Insert: {
          access_level?: number
          channel_id: string
          granted_at?: string
          granted_by: string
          id?: string
          user_id: string
        }
        Update: {
          access_level?: number
          channel_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_access_list_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_access_list_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_moderation_settings: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          link_preview_enabled: boolean
          profanity_filter_enabled: boolean
          updated_at: string
          url_filter_enabled: boolean
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          link_preview_enabled?: boolean
          profanity_filter_enabled?: boolean
          updated_at?: string
          url_filter_enabled?: boolean
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          link_preview_enabled?: boolean
          profanity_filter_enabled?: boolean
          updated_at?: string
          url_filter_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "channel_moderation_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_moderation_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_registrations: {
        Row: {
          channel_id: string
          description: string | null
          founder_id: string
          id: string
          registered_at: string
          url: string | null
        }
        Insert: {
          channel_id: string
          description?: string | null
          founder_id: string
          id?: string
          registered_at?: string
          url?: string | null
        }
        Update: {
          channel_id?: string
          description?: string | null
          founder_id?: string
          id?: string
          registered_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_registrations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_registrations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_settings: {
        Row: {
          channel_id: string | null
          channel_name: string
          id: string
          topic: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel_id?: string | null
          channel_name?: string
          id?: string
          topic?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel_id?: string | null
          channel_name?: string
          id?: string
          topic?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          admin_password: string | null
          bg_color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_hidden: boolean
          is_private: boolean | null
          name: string
          name_color: string | null
          name_gradient_from: string | null
          name_gradient_to: string | null
          room_password: string | null
        }
        Insert: {
          admin_password?: string | null
          bg_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          is_private?: boolean | null
          name: string
          name_color?: string | null
          name_gradient_from?: string | null
          name_gradient_to?: string | null
          room_password?: string | null
        }
        Update: {
          admin_password?: string | null
          bg_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          is_private?: boolean | null
          name?: string
          name_color?: string | null
          name_gradient_from?: string | null
          name_gradient_to?: string | null
          room_password?: string | null
        }
        Relationships: []
      }
      dating_matches: {
        Row: {
          id: string
          matched_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          id?: string
          matched_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          id?: string
          matched_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      dating_profiles: {
        Row: {
          about_me: string | null
          age: number | null
          body_type: string | null
          created_at: string
          drinking: string | null
          education: string | null
          ethnicity: string | null
          gender: string | null
          has_children: boolean | null
          height_cm: number | null
          hobbies: string[] | null
          id: string
          ideal_match: string | null
          interests: string[] | null
          is_verified: boolean | null
          languages: string[] | null
          last_active: string | null
          location: string | null
          looking_for: string | null
          looking_for_type: string | null
          max_age: number | null
          max_distance_km: number | null
          min_age: number | null
          occupation: string | null
          opted_in: boolean
          pets: string | null
          photos: string[] | null
          profile_complete: boolean | null
          relationship_status: string | null
          religion: string | null
          seeking: string[] | null
          smoking: string | null
          updated_at: string
          user_id: string
          wants_children: string | null
          weight_kg: number | null
          zodiac: string | null
        }
        Insert: {
          about_me?: string | null
          age?: number | null
          body_type?: string | null
          created_at?: string
          drinking?: string | null
          education?: string | null
          ethnicity?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          hobbies?: string[] | null
          id?: string
          ideal_match?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          location?: string | null
          looking_for?: string | null
          looking_for_type?: string | null
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          occupation?: string | null
          opted_in?: boolean
          pets?: string | null
          photos?: string[] | null
          profile_complete?: boolean | null
          relationship_status?: string | null
          religion?: string | null
          seeking?: string[] | null
          smoking?: string | null
          updated_at?: string
          user_id: string
          wants_children?: string | null
          weight_kg?: number | null
          zodiac?: string | null
        }
        Update: {
          about_me?: string | null
          age?: number | null
          body_type?: string | null
          created_at?: string
          drinking?: string | null
          education?: string | null
          ethnicity?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          hobbies?: string[] | null
          id?: string
          ideal_match?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          location?: string | null
          looking_for?: string | null
          looking_for_type?: string | null
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          occupation?: string | null
          opted_in?: boolean
          pets?: string | null
          photos?: string[] | null
          profile_complete?: boolean | null
          relationship_status?: string | null
          religion?: string | null
          seeking?: string[] | null
          smoking?: string | null
          updated_at?: string
          user_id?: string
          wants_children?: string | null
          weight_kg?: number | null
          zodiac?: string | null
        }
        Relationships: []
      }
      dating_swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
      donation_clicks: {
        Row: {
          clicked_at: string
          id: string
          user_id: string
          username: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          user_id: string
          username?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      donation_settings: {
        Row: {
          current_amount: number
          goal_amount: number
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      klines: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_pattern: string
          reason: string | null
          set_by: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_pattern: string
          reason?: string | null
          set_by: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_pattern?: string
          reason?: string | null
          set_by?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_count: number
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
          locked_until: string | null
        }
        Insert: {
          attempt_count?: number
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
          locked_until?: string | null
        }
        Update: {
          attempt_count?: number
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mutes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          muted_by: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_stats: {
        Row: {
          id: string
          recorded_at: string
          stat_type: string
          stat_value: Json
        }
        Insert: {
          id?: string
          recorded_at?: string
          stat_type: string
          stat_value?: Json
        }
        Update: {
          id?: string
          recorded_at?: string
          stat_type?: string
          stat_value?: Json
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          created_at: string
          encrypted_content: string
          id: string
          iv: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          encrypted_content: string
          id?: string
          iv: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          encrypted_content?: string
          id?: string
          iv?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          ghost_mode: boolean | null
          id: string
          is_minor: boolean | null
          parent_consent_sent_at: string | null
          parent_consent_token: string | null
          parent_consent_verified: boolean | null
          parent_email: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          ghost_mode?: boolean | null
          id?: string
          is_minor?: boolean | null
          parent_consent_sent_at?: string | null
          parent_consent_token?: string | null
          parent_consent_verified?: boolean | null
          parent_email?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          ghost_mode?: boolean | null
          id?: string
          is_minor?: boolean | null
          parent_consent_sent_at?: string | null
          parent_consent_token?: string | null
          parent_consent_verified?: boolean | null
          parent_email?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      registered_nicks: {
        Row: {
          email_verified: boolean | null
          id: string
          last_identified: string | null
          nickname: string
          registered_at: string
          user_id: string
        }
        Insert: {
          email_verified?: boolean | null
          id?: string
          last_identified?: string | null
          nickname: string
          registered_at?: string
          user_id: string
        }
        Update: {
          email_verified?: boolean | null
          id?: string
          last_identified?: string | null
          nickname?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_admins: {
        Row: {
          channel_id: string
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_admins_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_admins_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bans: {
        Row: {
          banned_by: string
          channel_id: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          channel_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          channel_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bans_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_bans_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      room_mutes: {
        Row: {
          channel_id: string
          created_at: string
          expires_at: string | null
          id: string
          muted_by: string
          reason: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by: string
          reason?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_mutes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_mutes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          sender_username: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          sender_username: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          sender_username?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      trivia_scores: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          points: number
          total_answers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          points?: number
          total_answers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          points?: number
          total_answers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_channel_visits: {
        Row: {
          channel_name: string
          first_visit_at: string
          id: string
          last_visit_at: string
          user_id: string
          username: string
          visit_count: number
        }
        Insert: {
          channel_name: string
          first_visit_at?: string
          id?: string
          last_visit_at?: string
          user_id: string
          username: string
          visit_count?: number
        }
        Update: {
          channel_name?: string
          first_visit_at?: string
          id?: string
          last_visit_at?: string
          user_id?: string
          username?: string
          visit_count?: number
        }
        Relationships: []
      }
      user_conversation_topics: {
        Row: {
          channel_name: string
          created_at: string
          id: string
          interests: string[]
          last_messages: Json
          mood: string | null
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_name: string
          created_at?: string
          id?: string
          interests?: string[]
          last_messages?: Json
          mood?: string | null
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_name?: string
          created_at?: string
          id?: string
          interests?: string[]
          last_messages?: Json
          mood?: string | null
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          isp: string | null
          last_seen: string
          latitude: number | null
          longitude: number | null
          region: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          isp?: string | null
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          isp?: string | null
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      channels_public: {
        Row: {
          bg_color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          is_hidden: boolean | null
          is_private: boolean | null
          name: string | null
          name_color: string | null
          name_gradient_from: string | null
          name_gradient_to: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          name?: string | null
          name_color?: string | null
          name_gradient_from?: string | null
          name_gradient_to?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          name?: string | null
          name_color?: string | null
          name_gradient_from?: string | null
          name_gradient_to?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          ghost_mode: boolean | null
          id: string | null
          is_minor: boolean | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          ghost_mode?: boolean | null
          id?: string | null
          is_minor?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          ghost_mode?: boolean | null
          id?: string | null
          is_minor?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_locations_public: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          id: string | null
          last_seen: string | null
          region: string | null
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string | null
          last_seen?: string | null
          region?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string | null
          last_seen?: string | null
          region?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      channel_has_password: { Args: { _channel_id: string }; Returns: boolean }
      cleanup_old_locations: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_room_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_owner: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      verify_admin_password: {
        Args: { _channel_id: string; _password: string }
        Returns: boolean
      }
      verify_room_password: {
        Args: { _channel_id: string; _password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "owner"],
    },
  },
} as const
