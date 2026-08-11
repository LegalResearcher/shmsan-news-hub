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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          created_at: string
          html: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          name: string
          placement: string
        }
        Insert: {
          created_at?: string
          html?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name: string
          placement: string
        }
        Update: {
          created_at?: string
          html?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name?: string
          placement?: string
        }
        Relationships: []
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      breaking_news: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link: string | null
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          badge: string | null
          category_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          external_video_url: string | null
          id: string
          is_featured: boolean
          is_opinion: boolean
          is_pinned: boolean
          keywords: string[] | null
          pinned_order: number | null
          published_at: string
          reading_time: number | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          source: string | null
          status: Database["public"]["Enums"]["post_status"]
          tags: string[] | null
          title: string
          updated_at: string
          views: number
          word_count: number | null
        }
        Insert: {
          author_id?: string | null
          badge?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          external_video_url?: string | null
          id?: string
          is_featured?: boolean
          is_opinion?: boolean
          is_pinned?: boolean
          keywords?: string[] | null
          pinned_order?: number | null
          published_at?: string
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number
          word_count?: number | null
        }
        Update: {
          author_id?: string | null
          badge?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          external_video_url?: string | null
          id?: string
          is_featured?: boolean
          is_opinion?: boolean
          is_pinned?: boolean
          keywords?: string[] | null
          pinned_order?: number | null
          published_at?: string
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          media_type: string
          media_url: string
          post_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          media_type: string
          media_url: string
          post_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          facebook: string | null
          id: number
          logo_url: string | null
          seo_description: string | null
          seo_title: string | null
          site_name: string
          telegram: string | null
          twitter: string | null
          updated_at: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          description?: string | null
          facebook?: string | null
          id?: number
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          site_name?: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          description?: string | null
          facebook?: string | null
          id?: number
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          site_name?: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_views: { Args: { _slug: string }; Returns: undefined }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor"
      post_status: "draft" | "published" | "scheduled"
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
      app_role: ["admin", "editor"],
      post_status: ["draft", "published", "scheduled"],
    },
  },
} as const
