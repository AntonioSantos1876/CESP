export type UserRole =
  | 'fan'
  | 'super_admin'
  | 'team_admin'
  | 'coach'
  | 'livestream_operator'
  | 'photographer'
  | 'volunteer'

export type ArticleStatus = 'draft' | 'published' | 'archived'
export type ArticleCategory = 'match_report' | 'news' | 'interview' | 'feature' | 'gallery' | 'announcement'
export type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          team_id: string | null
          fcm_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      teams: {
        Row: {
          id: string
          name: string
          short_name: string
          badge_url: string | null
          home_colour: string
          away_colour: string
          founded_year: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      players: {
        Row: {
          id: string
          team_id: string
          full_name: string
          position: string | null
          jersey_number: number | null
          date_of_birth: string | null
          nationality: string | null
          photo_url: string | null
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      fixtures: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          venue: string | null
          match_date: string
          status: FixtureStatus
          round: string | null
          season: string
          youtube_stream_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['fixtures']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['fixtures']['Insert']>
      }
      match_scores: {
        Row: {
          id: string
          fixture_id: string
          home_score: number
          away_score: number
          home_score_ht: number | null
          away_score_ht: number | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['match_scores']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['match_scores']['Insert']>
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          cover_image_url: string | null
          media_urls: string[]
          category: ArticleCategory
          status: ArticleStatus
          author_id: string
          fixture_id: string | null
          tags: string[]
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'created_at' | 'updated_at' | 'view_count'>
        Update: Partial<Database['public']['Tables']['articles']['Insert']>
      }
      gallery_albums: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_url: string | null
          fixture_id: string | null
          author_id: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['gallery_albums']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['gallery_albums']['Insert']>
      }
      gallery_photos: {
        Row: {
          id: string
          album_id: string
          url: string
          thumbnail_url: string | null
          caption: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gallery_photos']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['gallery_photos']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          images: string[]
          category: string
          stock_quantity: number
          is_active: boolean
          stripe_price_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: OrderStatus
          total_amount: number
          stripe_payment_intent_id: string | null
          shipping_address: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      donations: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          currency: string
          status: DonationStatus
          stripe_payment_intent_id: string | null
          donor_name: string | null
          message: string | null
          is_anonymous: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['donations']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['donations']['Insert']>
      }
      live_chat: {
        Row: {
          id: string
          fixture_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['live_chat']['Row'], 'created_at'>
        Update: never
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          body: string
          type: string
          data: Record<string, unknown> | null
          is_read: boolean
          sent_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      sponsors: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          website_url: string | null
          tier: 'platinum' | 'gold' | 'silver' | 'bronze'
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sponsors']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sponsors']['Insert']>
      }
      volunteers: {
        Row: {
          id: string
          user_id: string
          skills: string[]
          availability: string | null
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['volunteers']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['volunteers']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      article_status: ArticleStatus
      article_category: ArticleCategory
      fixture_status: FixtureStatus
      donation_status: DonationStatus
      order_status: OrderStatus
    }
  }
}
