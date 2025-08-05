export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_visits: {
        Row: {
          agent_id: string
          city: string
          id: number
          status: boolean | null
          week_number: number
          weekday: string
        }
        Insert: {
          agent_id: string
          city: string
          id?: number
          status?: boolean | null
          week_number: number
          weekday: string
        }
        Update: {
          agent_id?: string
          city?: string
          id?: number
          status?: boolean | null
          week_number?: number
          weekday?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agentnumber"]
          },
          {
            foreignKeyName: "agent_visits_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["city"]
          },
        ]
      }
      agents: {
        Row: {
          agentname: string
          agentnumber: string
          id: string
          lastsignin: string | null
          monday1: string | null
          monday2: Json | null
          password_hash: string | null
          sunday1: string | null
          sunday2: Json | null
          thursday1: Json | null
          thursday2: Json | null
          tuesday1: Json | null
          tuesday2: Json | null
          wednesday1: Json | null
          wednesday2: Json | null
        }
        Insert: {
          agentname: string
          agentnumber: string
          id?: string
          lastsignin?: string | null
          monday1?: string | null
          monday2?: Json | null
          password_hash?: string | null
          sunday1?: string | null
          sunday2?: Json | null
          thursday1?: Json | null
          thursday2?: Json | null
          tuesday1?: Json | null
          tuesday2?: Json | null
          wednesday1?: Json | null
          wednesday2?: Json | null
        }
        Update: {
          agentname?: string
          agentnumber?: string
          id?: string
          lastsignin?: string | null
          monday1?: string | null
          monday2?: Json | null
          password_hash?: string | null
          sunday1?: string | null
          sunday2?: Json | null
          thursday1?: Json | null
          thursday2?: Json | null
          tuesday1?: Json | null
          tuesday2?: Json | null
          wednesday1?: Json | null
          wednesday2?: Json | null
        }
        Relationships: []
      }
      candycustomerlist: {
        Row: {
          address: string | null
          agentnumber: string | null
          city: string | null
          city_area: string | null
          customername: string | null
          customernumber: string
          deliverhour: Json | null
          extraarea: string | null
          lat: number | null
          lng: number | null
          mobile: string | null
          newarea: string | null
          nodeliverday: Json | null
          phone: string | null
          supplydetails: string | null
        }
        Insert: {
          address?: string | null
          agentnumber?: string | null
          city?: string | null
          city_area?: string | null
          customername?: string | null
          customernumber: string
          deliverhour?: Json | null
          extraarea?: string | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          newarea?: string | null
          nodeliverday?: Json | null
          phone?: string | null
          supplydetails?: string | null
        }
        Update: {
          address?: string | null
          agentnumber?: string | null
          city?: string | null
          city_area?: string | null
          customername?: string | null
          customernumber?: string
          deliverhour?: Json | null
          extraarea?: string | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          newarea?: string | null
          nodeliverday?: Json | null
          phone?: string | null
          supplydetails?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candycustomerlist_extraarea_fkey"
            columns: ["extraarea"]
            isOneToOne: false
            referencedRelation: "distribution_groups"
            referencedColumns: ["separation"]
          },
          {
            foreignKeyName: "candycustomerlist_newarea_fkey"
            columns: ["newarea"]
            isOneToOne: false
            referencedRelation: "distribution_groups"
            referencedColumns: ["separation"]
          },
        ]
      }
      cities: {
        Row: {
          area: string | null
          averagesupply3month: number | null
          averagesupplyweek: number | null
          centralcity: boolean | null
          city: string
          cityid: number
          day: Json | null
          frequency: Json | null
          lat: number | null
          lng: number | null
        }
        Insert: {
          area?: string | null
          averagesupply3month?: number | null
          averagesupplyweek?: number | null
          centralcity?: boolean | null
          city: string
          cityid?: number
          day?: Json | null
          frequency?: Json | null
          lat?: number | null
          lng?: number | null
        }
        Update: {
          area?: string | null
          averagesupply3month?: number | null
          averagesupplyweek?: number | null
          centralcity?: boolean | null
          city?: string
          cityid?: number
          day?: Json | null
          frequency?: Json | null
          lat?: number | null
          lng?: number | null
        }
        Relationships: []
      }
      customerlist: {
        Row: {
          activemonth: number | null
          address: string | null
          agentnumber: string | null
          arvot: string | null
          average_inv_month: number | null
          averagesupply: number | null
          averagesupply3month: number | null
          city: string | null
          city_area: string | null
          customername: string | null
          customernumber: string
          deliverhour: Json | null
          discount: number | null
          discountdetails: string | null
          extraarea: string | null
          final_score: number | null
          lat: number | null
          lng: number | null
          mobile: string | null
          monthopen_calc: number | null
          newarea: string | null
          nodeliverday: Json | null
          obligolimit: number | null
          obligotoday: number | null
          opencustomer: string | null
          phone: string | null
          recency: number | null
          shotefname: string | null
          shotefnumber: number | null
          spread: number | null
          sumcustomer: number | null
          supplydetails: string | null
          type: string | null
        }
        Insert: {
          activemonth?: number | null
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          average_inv_month?: number | null
          averagesupply?: number | null
          averagesupply3month?: number | null
          city?: string | null
          city_area?: string | null
          customername?: string | null
          customernumber: string
          deliverhour?: Json | null
          discount?: number | null
          discountdetails?: string | null
          extraarea?: string | null
          final_score?: number | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          monthopen_calc?: number | null
          newarea?: string | null
          nodeliverday?: Json | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          phone?: string | null
          recency?: number | null
          shotefname?: string | null
          shotefnumber?: number | null
          spread?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
        }
        Update: {
          activemonth?: number | null
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          average_inv_month?: number | null
          averagesupply?: number | null
          averagesupply3month?: number | null
          city?: string | null
          city_area?: string | null
          customername?: string | null
          customernumber?: string
          deliverhour?: Json | null
          discount?: number | null
          discountdetails?: string | null
          extraarea?: string | null
          final_score?: number | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          monthopen_calc?: number | null
          newarea?: string | null
          nodeliverday?: Json | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          phone?: string | null
          recency?: number | null
          shotefname?: string | null
          shotefnumber?: number | null
          spread?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customerlist_extraarea_fkey"
            columns: ["extraarea"]
            isOneToOne: false
            referencedRelation: "distribution_groups"
            referencedColumns: ["separation"]
          },
          {
            foreignKeyName: "customerlist_newarea_fkey"
            columns: ["newarea"]
            isOneToOne: false
            referencedRelation: "distribution_groups"
            referencedColumns: ["separation"]
          },
        ]
      }
      distribution_groups: {
        Row: {
          agents: Json | null
          agentsworkarea: Json | null
          days: Json | null
          dayvisit: Json | null
          freq: Json | null
          groups_id: number
          orderlabelinkavim: number | null
          separation: string | null
          totalsupplyspots: number | null
        }
        Insert: {
          agents?: Json | null
          agentsworkarea?: Json | null
          days?: Json | null
          dayvisit?: Json | null
          freq?: Json | null
          groups_id?: number
          orderlabelinkavim?: number | null
          separation?: string | null
          totalsupplyspots?: number | null
        }
        Update: {
          agents?: Json | null
          agentsworkarea?: Json | null
          days?: Json | null
          dayvisit?: Json | null
          freq?: Json | null
          groups_id?: number
          orderlabelinkavim?: number | null
          separation?: string | null
          totalsupplyspots?: number | null
        }
        Relationships: []
      }
      distribution_schedule: {
        Row: {
          create_at_schedule: string | null
          destinations: number | null
          dis_number: number | null
          distribution_date: string | null
          done_schedule: string | null
          driver_id: number | null
          europallet_return: number | null
          fuelcost: number | null
          groups_id: number | null
          isPinned: boolean | null
          message_alert: boolean | null
          nahag_name: string | null
          note: string | null
          schedule_id: number
          smallpallet_return: number | null
        }
        Insert: {
          create_at_schedule?: string | null
          destinations?: number | null
          dis_number?: number | null
          distribution_date?: string | null
          done_schedule?: string | null
          driver_id?: number | null
          europallet_return?: number | null
          fuelcost?: number | null
          groups_id?: number | null
          isPinned?: boolean | null
          message_alert?: boolean | null
          nahag_name?: string | null
          note?: string | null
          schedule_id?: number
          smallpallet_return?: number | null
        }
        Update: {
          create_at_schedule?: string | null
          destinations?: number | null
          dis_number?: number | null
          distribution_date?: string | null
          done_schedule?: string | null
          driver_id?: number | null
          europallet_return?: number | null
          fuelcost?: number | null
          groups_id?: number | null
          isPinned?: boolean | null
          message_alert?: boolean | null
          nahag_name?: string | null
          note?: string | null
          schedule_id?: number
          smallpallet_return?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_schedule_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "nahagim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_schedule_groups_id_fkey"
            columns: ["groups_id"]
            isOneToOne: false
            referencedRelation: "distribution_groups"
            referencedColumns: ["groups_id"]
          },
        ]
      }
      fuelprice: {
        Row: {
          date: string
          id: number
          price: number | null
        }
        Insert: {
          date: string
          id?: number
          price?: number | null
        }
        Update: {
          date?: string
          id?: number
          price?: number | null
        }
        Relationships: []
      }
      invoice_history: {
        Row: {
          address: string | null
          agentnumber: string | null
          city: string | null
          customername: string | null
          customernumber: string | null
          doctypename: string | null
          icecream: string | null
          invoicedate: string | null
          invoicenumber: number
          totalinvoice: number | null
        }
        Insert: {
          address?: string | null
          agentnumber?: string | null
          city?: string | null
          customername?: string | null
          customernumber?: string | null
          doctypename?: string | null
          icecream?: string | null
          invoicedate?: string | null
          invoicenumber: number
          totalinvoice?: number | null
        }
        Update: {
          address?: string | null
          agentnumber?: string | null
          city?: string | null
          customername?: string | null
          customernumber?: string | null
          doctypename?: string | null
          icecream?: string | null
          invoicedate?: string | null
          invoicenumber?: number
          totalinvoice?: number | null
        }
        Relationships: []
      }
      likut_summary: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      madbikim: {
        Row: {
          cost_beer: number | null
          cost_dry: number | null
          cost_frozen: number | null
          madbik: string | null
          madbik_id: number
        }
        Insert: {
          cost_beer?: number | null
          cost_dry?: number | null
          cost_frozen?: number | null
          madbik?: string | null
          madbik_id?: number
        }
        Update: {
          cost_beer?: number | null
          cost_dry?: number | null
          cost_frozen?: number | null
          madbik?: string | null
          madbik_id?: number
        }
        Relationships: []
      }
      madbikim_summary: {
        Row: {
          barcode: string | null
          carts: number | null
          cost_unit: number | null
          created_at: string
          id: number
          madbikid: number | null
          makat: string | null
          name: string | null
          num_stickers: number | null
          quantity: number | null
          total_cost: number | null
          units_per_cart: number | null
        }
        Insert: {
          barcode?: string | null
          carts?: number | null
          cost_unit?: number | null
          created_at?: string
          id?: number
          madbikid?: number | null
          makat?: string | null
          name?: string | null
          num_stickers?: number | null
          quantity?: number | null
          total_cost?: number | null
          units_per_cart?: number | null
        }
        Update: {
          barcode?: string | null
          carts?: number | null
          cost_unit?: number | null
          created_at?: string
          id?: number
          madbikid?: number | null
          makat?: string | null
          name?: string | null
          num_stickers?: number | null
          quantity?: number | null
          total_cost?: number | null
          units_per_cart?: number | null
        }
        Relationships: []
      }
      mainorder: {
        Row: {
          address: string | null
          agentname: string | null
          agentnumber: string | null
          alert_status: boolean | null
          american_pallet: number | null
          city: string | null
          create_at_order: string | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          day1: string | null
          day2: string | null
          Delete_extra: string | null
          done_mainorder: string | null
          end_picking_time: string | null
          euro_pallet: number | null
          ezor1: string | null
          ezor2: string | null
          hashavshevet: string | null
          hour: string | null
          icecream: string | null
          ignore_icecream: boolean | null
          invoicedate: string | null
          invoicenumber: number | null
          melaketID: number | null
          message_alert: boolean | null
          mistake_melaket: string | null
          office_mistake: string | null
          ordercancel: string | null
          orderdate: string | null
          ordernumber: number
          orders_PROFIT_id: string | null
          paymentdate: string | null
          priority: string | null
          red_stamp: number | null
          remark: string | null
          return_reason: Json | null
          schedule_id: number | null
          schedule_id_if_changed: Json | null
          tnuva_pallet: number | null
          Total_cartons: number | null
          totalinvoice: number | null
          totalorder: number | null
          weight_order: number | null
        }
        Insert: {
          address?: string | null
          agentname?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          american_pallet?: number | null
          city?: string | null
          create_at_order?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          day1?: string | null
          day2?: string | null
          Delete_extra?: string | null
          done_mainorder?: string | null
          end_picking_time?: string | null
          euro_pallet?: number | null
          ezor1?: string | null
          ezor2?: string | null
          hashavshevet?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          invoicedate?: string | null
          invoicenumber?: number | null
          melaketID?: number | null
          message_alert?: boolean | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          ordercancel?: string | null
          orderdate?: string | null
          ordernumber: number
          orders_PROFIT_id?: string | null
          paymentdate?: string | null
          priority?: string | null
          red_stamp?: number | null
          remark?: string | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          tnuva_pallet?: number | null
          Total_cartons?: number | null
          totalinvoice?: number | null
          totalorder?: number | null
          weight_order?: number | null
        }
        Update: {
          address?: string | null
          agentname?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          american_pallet?: number | null
          city?: string | null
          create_at_order?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          day1?: string | null
          day2?: string | null
          Delete_extra?: string | null
          done_mainorder?: string | null
          end_picking_time?: string | null
          euro_pallet?: number | null
          ezor1?: string | null
          ezor2?: string | null
          hashavshevet?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          invoicedate?: string | null
          invoicenumber?: number | null
          melaketID?: number | null
          message_alert?: boolean | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          ordercancel?: string | null
          orderdate?: string | null
          ordernumber?: number
          orders_PROFIT_id?: string | null
          paymentdate?: string | null
          priority?: string | null
          red_stamp?: number | null
          remark?: string | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          tnuva_pallet?: number | null
          Total_cartons?: number | null
          totalinvoice?: number | null
          totalorder?: number | null
          weight_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mainorder_melaketID_fkey"
            columns: ["melaketID"]
            isOneToOne: false
            referencedRelation: "meltaktim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mainorder_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "distribution_schedule"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      mainreturns: {
        Row: {
          address: string | null
          agentnumber: string | null
          alert_status: boolean | null
          city: string | null
          create_at_return: string | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          done_return: string | null
          hour: string | null
          icecream: string | null
          ignore_icecream: boolean | null
          message_alert: boolean | null
          remark: string | null
          return_reason: Json | null
          returncancel: string | null
          returndate: string | null
          returnnumber: number
          schedule_id: number | null
          schedule_id_if_changed: Json | null
          totalreturn: number | null
        }
        Insert: {
          address?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          city?: string | null
          create_at_return?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          done_return?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          message_alert?: boolean | null
          remark?: string | null
          return_reason?: Json | null
          returncancel?: string | null
          returndate?: string | null
          returnnumber: number
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          totalreturn?: number | null
        }
        Update: {
          address?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          city?: string | null
          create_at_return?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          done_return?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          message_alert?: boolean | null
          remark?: string | null
          return_reason?: Json | null
          returncancel?: string | null
          returndate?: string | null
          returnnumber?: number
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          totalreturn?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mainreturns_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "distribution_schedule"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      meltaktim: {
        Row: {
          id: number
          melaket: string | null
        }
        Insert: {
          id?: number
          melaket?: string | null
        }
        Update: {
          id?: number
          melaket?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          agentnumber: string | null
          city: string | null
          content: string | null
          correctcustomer: string | null
          created_at: string
          is_handled: boolean | null
          messages_id: number
          ordernumber: number | null
          related_to_message_id: number | null
          returnnumber: number | null
          schedule_id: number | null
          subject: Database["public"]["Enums"]["subject_message"] | null
          tagagent: string | null
        }
        Insert: {
          agentnumber?: string | null
          city?: string | null
          content?: string | null
          correctcustomer?: string | null
          created_at?: string
          is_handled?: boolean | null
          messages_id?: number
          ordernumber?: number | null
          related_to_message_id?: number | null
          returnnumber?: number | null
          schedule_id?: number | null
          subject?: Database["public"]["Enums"]["subject_message"] | null
          tagagent?: string | null
        }
        Update: {
          agentnumber?: string | null
          city?: string | null
          content?: string | null
          correctcustomer?: string | null
          created_at?: string
          is_handled?: boolean | null
          messages_id?: number
          ordernumber?: number | null
          related_to_message_id?: number | null
          returnnumber?: number | null
          schedule_id?: number | null
          subject?: Database["public"]["Enums"]["subject_message"] | null
          tagagent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_schedule_id"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "distribution_schedule"
            referencedColumns: ["schedule_id"]
          },
          {
            foreignKeyName: "messages_agentnumber_fkey"
            columns: ["agentnumber"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agentnumber"]
          },
          {
            foreignKeyName: "messages_ordernumber_fkey"
            columns: ["ordernumber"]
            isOneToOne: false
            referencedRelation: "mainorder"
            referencedColumns: ["ordernumber"]
          },
          {
            foreignKeyName: "messages_related_to_message_id_fkey"
            columns: ["related_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["messages_id"]
          },
          {
            foreignKeyName: "messages_returnnumber_fkey"
            columns: ["returnnumber"]
            isOneToOne: false
            referencedRelation: "mainreturns"
            referencedColumns: ["returnnumber"]
          },
          {
            foreignKeyName: "messages_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "distribution_schedule"
            referencedColumns: ["schedule_id"]
          },
          {
            foreignKeyName: "messages_tagagent_fkey"
            columns: ["tagagent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agentnumber"]
          },
        ]
      }
      nahagim: {
        Row: {
          id: number
          nahag: string | null
          truck: number | null
          updated_at: string | null
        }
        Insert: {
          id: number
          nahag?: string | null
          truck?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          nahag?: string | null
          truck?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nahagim_truck_fkey"
            columns: ["truck"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["truck_id"]
          },
        ]
      }
      ordersITEMS: {
        Row: {
          "1=גלידה": string | null
          KEYITEMS: number
          ordere: string | null
          soldout: number | null
          איתור: string | null
          אריזות_יציאה: number | null
          אריזות_כניסה: number | null
          בר_קוד: string | null
          יחידות_במלאי: number | null
          יחידות_יציאה: number | null
          יחידות_כניסה: number | null
          כמות_באריזה: number | null
          מספר_סוג_מסמך: string | null
          מפתח_חשבון: string | null
          מפתח_פריט: string | null
          מקומי_יבוא: string | null
          סוג_מסמך: string | null
          סוכן_במסמך: string | null
          פיקדון: string | null
          קוד_מיון_בפריט: string | null
          קוד_מיון_חשבון: string | null
          קרטונים_במלאי: number | null
          שם: string | null
          שם_פריט: string | null
          שם_קוד_מיון_פריט: string | null
          תאריך_אסמכתא: string | null
          תאריך_קניה_אחרון: string | null
          תוקף: string | null
          תוקף2: string | null
          תת_קטגוריה: string | null
        }
        Insert: {
          "1=גלידה"?: string | null
          KEYITEMS?: number
          ordere?: string | null
          soldout?: number | null
          איתור?: string | null
          אריזות_יציאה?: number | null
          אריזות_כניסה?: number | null
          בר_קוד?: string | null
          יחידות_במלאי?: number | null
          יחידות_יציאה?: number | null
          יחידות_כניסה?: number | null
          כמות_באריזה?: number | null
          מספר_סוג_מסמך?: string | null
          מפתח_חשבון?: string | null
          מפתח_פריט?: string | null
          מקומי_יבוא?: string | null
          סוג_מסמך?: string | null
          סוכן_במסמך?: string | null
          פיקדון?: string | null
          קוד_מיון_בפריט?: string | null
          קוד_מיון_חשבון?: string | null
          קרטונים_במלאי?: number | null
          שם?: string | null
          שם_פריט?: string | null
          שם_קוד_מיון_פריט?: string | null
          תאריך_אסמכתא?: string | null
          תאריך_קניה_אחרון?: string | null
          תוקף?: string | null
          תוקף2?: string | null
          תת_קטגוריה?: string | null
        }
        Update: {
          "1=גלידה"?: string | null
          KEYITEMS?: number
          ordere?: string | null
          soldout?: number | null
          איתור?: string | null
          אריזות_יציאה?: number | null
          אריזות_כניסה?: number | null
          בר_קוד?: string | null
          יחידות_במלאי?: number | null
          יחידות_יציאה?: number | null
          יחידות_כניסה?: number | null
          כמות_באריזה?: number | null
          מספר_סוג_מסמך?: string | null
          מפתח_חשבון?: string | null
          מפתח_פריט?: string | null
          מקומי_יבוא?: string | null
          סוג_מסמך?: string | null
          סוכן_במסמך?: string | null
          פיקדון?: string | null
          קוד_מיון_בפריט?: string | null
          קוד_מיון_חשבון?: string | null
          קרטונים_במלאי?: number | null
          שם?: string | null
          שם_פריט?: string | null
          שם_קוד_מיון_פריט?: string | null
          תאריך_אסמכתא?: string | null
          תאריך_קניה_אחרון?: string | null
          תוקף?: string | null
          תוקף2?: string | null
          תת_קטגוריה?: string | null
        }
        Relationships: []
      }
      ordersPROFIT: {
        Row: {
          KEYPROFIT: number
          ordere: string | null
          הערות: string | null
          זמן_אספקה: string | null
          טלפון: string | null
          טלפון_נייד: string | null
          כתובת: string | null
          מפתח_חשבון: string | null
          'סה"כ_אחרי_הנחה': number | null
          'סה"כ_לפני_הנחה': number | null
          'סה"כ_עלות': number | null
          סוכן: string | null
          עיר: string | null
          פקס: string | null
          קוד_פיצול_תשלומים: string | null
          רווח_לעסקה: number | null
          שם: string | null
          תאריך_אסמכתא: string | null
        }
        Insert: {
          KEYPROFIT?: number
          ordere?: string | null
          הערות?: string | null
          זמן_אספקה?: string | null
          טלפון?: string | null
          טלפון_נייד?: string | null
          כתובת?: string | null
          מפתח_חשבון?: string | null
          'סה"כ_אחרי_הנחה'?: number | null
          'סה"כ_לפני_הנחה'?: number | null
          'סה"כ_עלות'?: number | null
          סוכן?: string | null
          עיר?: string | null
          פקס?: string | null
          קוד_פיצול_תשלומים?: string | null
          רווח_לעסקה?: number | null
          שם?: string | null
          תאריך_אסמכתא?: string | null
        }
        Update: {
          KEYPROFIT?: number
          ordere?: string | null
          הערות?: string | null
          זמן_אספקה?: string | null
          טלפון?: string | null
          טלפון_נייד?: string | null
          כתובת?: string | null
          מפתח_חשבון?: string | null
          'סה"כ_אחרי_הנחה'?: number | null
          'סה"כ_לפני_הנחה'?: number | null
          'סה"כ_עלות'?: number | null
          סוכן?: string | null
          עיר?: string | null
          פקס?: string | null
          קוד_פיצול_תשלומים?: string | null
          רווח_לעסקה?: number | null
          שם?: string | null
          תאריך_אסמכתא?: string | null
        }
        Relationships: []
      }
      pallets: {
        Row: {
          commissionreturn: number | null
          height: number | null
          length: number | null
          pallet: string | null
          pallet_id: number
          width: number | null
        }
        Insert: {
          commissionreturn?: number | null
          height?: number | null
          length?: number | null
          pallet?: string | null
          pallet_id?: number
          width?: number | null
        }
        Update: {
          commissionreturn?: number | null
          height?: number | null
          length?: number | null
          pallet?: string | null
          pallet_id?: number
          width?: number | null
        }
        Relationships: []
      }
      palletsreturn: {
        Row: {
          created_at: string
          europallet: number | null
          nahag: string | null
          palletsreturn_id: number
          smallpallet: number | null
          totaleuro: number | null
          totalpallets: number | null
          totalsmall: number | null
        }
        Insert: {
          created_at?: string
          europallet?: number | null
          nahag?: string | null
          palletsreturn_id?: number
          smallpallet?: number | null
          totaleuro?: number | null
          totalpallets?: number | null
          totalsmall?: number | null
        }
        Update: {
          created_at?: string
          europallet?: number | null
          nahag?: string | null
          palletsreturn_id?: number
          smallpallet?: number | null
          totaleuro?: number | null
          totalpallets?: number | null
          totalsmall?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "palletsreturn_nahag_fkey"
            columns: ["nahag"]
            isOneToOne: false
            referencedRelation: "nahagim"
            referencedColumns: ["nahag"]
          },
        ]
      }
      po: {
        Row: {
          ברקוד: string | null
          כמות_באריזה: number | null
          כמות_יחידות: number | null
          מחיר_קניה: number | null
          מספר_מסמך: string | null
          מספר_תנועה: string
          מפתח_חשבון: string | null
          מפתח_פריט: string | null
          מקור_מוצר: string | null
          מקור_מסמך: string | null
          'סה"כ_תנועה יציאה': number | null
          'סה"כ_תנועה כניסה': number | null
          סוג_מסמך: string | null
          קרטונים: number | null
          שם_חשבון: string | null
          שם_פריט: string | null
          תאריך_אסמכתא: string | null
        }
        Insert: {
          ברקוד?: string | null
          כמות_באריזה?: number | null
          כמות_יחידות?: number | null
          מחיר_קניה?: number | null
          מספר_מסמך?: string | null
          מספר_תנועה: string
          מפתח_חשבון?: string | null
          מפתח_פריט?: string | null
          מקור_מוצר?: string | null
          מקור_מסמך?: string | null
          'סה"כ_תנועה יציאה'?: number | null
          'סה"כ_תנועה כניסה'?: number | null
          סוג_מסמך?: string | null
          קרטונים?: number | null
          שם_חשבון?: string | null
          שם_פריט?: string | null
          תאריך_אסמכתא?: string | null
        }
        Update: {
          ברקוד?: string | null
          כמות_באריזה?: number | null
          כמות_יחידות?: number | null
          מחיר_קניה?: number | null
          מספר_מסמך?: string | null
          מספר_תנועה?: string
          מפתח_חשבון?: string | null
          מפתח_פריט?: string | null
          מקור_מוצר?: string | null
          מקור_מסמך?: string | null
          'סה"כ_תנועה יציאה'?: number | null
          'סה"כ_תנועה כניסה'?: number | null
          סוג_מסמך?: string | null
          קרטונים?: number | null
          שם_חשבון?: string | null
          שם_פריט?: string | null
          תאריך_אסמכתא?: string | null
        }
        Relationships: []
      }
      pritim: {
        Row: {
          "1=גלידה": string | null
          איתור: string | null
          "בר קוד": string | null
          "יתרה כמתית קרט": number | null
          "כמות באריזה": number | null
          "מחיר מכירה": number | null
          "מחיר קניה": number | null
          "מפתח פריט": string
          "מתי נגמר": string | null
          ספק: string | null
          "פג תוקף": string | null
          פיקדון: string | null
          "קוד מיון": string | null
          "שם פריט": string | null
          "תאריך פתיחת פריט": string | null
          "תאריך קניה אחרון": string | null
          "תת קטגוריה": string | null
        }
        Insert: {
          "1=גלידה"?: string | null
          איתור?: string | null
          "בר קוד"?: string | null
          "יתרה כמתית קרט"?: number | null
          "כמות באריזה"?: number | null
          "מחיר מכירה"?: number | null
          "מחיר קניה"?: number | null
          "מפתח פריט": string
          "מתי נגמר"?: string | null
          ספק?: string | null
          "פג תוקף"?: string | null
          פיקדון?: string | null
          "קוד מיון"?: string | null
          "שם פריט"?: string | null
          "תאריך פתיחת פריט"?: string | null
          "תאריך קניה אחרון"?: string | null
          "תת קטגוריה"?: string | null
        }
        Update: {
          "1=גלידה"?: string | null
          איתור?: string | null
          "בר קוד"?: string | null
          "יתרה כמתית קרט"?: number | null
          "כמות באריזה"?: number | null
          "מחיר מכירה"?: number | null
          "מחיר קניה"?: number | null
          "מפתח פריט"?: string
          "מתי נגמר"?: string | null
          ספק?: string | null
          "פג תוקף"?: string | null
          פיקדון?: string | null
          "קוד מיון"?: string | null
          "שם פריט"?: string | null
          "תאריך פתיחת פריט"?: string | null
          "תאריך קניה אחרון"?: string | null
          "תת קטגוריה"?: string | null
        }
        Relationships: []
      }
      returnsLOSS: {
        Row: {
          KEYR: number
          הפסד_לעסקה: number | null
          כתובת: string | null
          מספר_מסמך: string | null
          מפתח_חשבון: string | null
          'סה"כ_אחרי_הנחה': number | null
          'סה"כ_עלות': number | null
          סוכן: string | null
          עיר: string | null
          שם: string | null
          תאריך_אסמכתא: string | null
        }
        Insert: {
          KEYR?: number
          הפסד_לעסקה?: number | null
          כתובת?: string | null
          מספר_מסמך?: string | null
          מפתח_חשבון?: string | null
          'סה"כ_אחרי_הנחה'?: number | null
          'סה"כ_עלות'?: number | null
          סוכן?: string | null
          עיר?: string | null
          שם?: string | null
          תאריך_אסמכתא?: string | null
        }
        Update: {
          KEYR?: number
          הפסד_לעסקה?: number | null
          כתובת?: string | null
          מספר_מסמך?: string | null
          מפתח_חשבון?: string | null
          'סה"כ_אחרי_הנחה'?: number | null
          'סה"כ_עלות'?: number | null
          סוכן?: string | null
          עיר?: string | null
          שם?: string | null
          תאריך_אסמכתא?: string | null
        }
        Relationships: []
      }
      trucks: {
        Row: {
          height: number | null
          length: number | null
          literperkm: number | null
          truck_id: number
          truck_model: string | null
          width: number | null
        }
        Insert: {
          height?: number | null
          length?: number | null
          literperkm?: number | null
          truck_id: number
          truck_model?: string | null
          width?: number | null
        }
        Update: {
          height?: number | null
          length?: number | null
          literperkm?: number | null
          truck_id?: number
          truck_model?: string | null
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_dis_number: {
        Args: { production_date: string }
        Returns: number
      }
      get_next_distribution_num: {
        Args: { schedule_date: string }
        Returns: number
      }
      get_or_create_schedule_for_group: {
        Args: { group_id: number }
        Returns: number
      }
      get_region_from_group: {
        Args: { group_id: string }
        Returns: string
      }
      produce_schedule: {
        Args: { schedule_id_param: number }
        Returns: number
      }
      update_agent_password: {
        Args: { agent_number: string; new_password: string }
        Returns: boolean
      }
      verify_agent_password: {
        Args: { agent_number: string; input_password: string }
        Returns: boolean
      }
    }
    Enums: {
      drivers: "ארז" | "יוסי" | "שי" | "רוברט" | "קבלן"
      ezorim:
        | "תל אביב-יפו"
        | "ירושלים"
        | "חיפה-קריות"
        | "שרון"
        | "ראשון לציון"
        | "שפלה"
        | "צפון רחוק"
        | "צפון קרוב"
        | "דרום"
        | "אילת"
        | "פתח תקווה"
        | "חדרה"
      frequency: "כל שבוע" | "כל שבוע שני" | "כל שבוע שלישי" | "פעם בחודש"
      Melaktim:
        | "חמי"
        | "לאון"
        | "חיים"
        | "יקיר"
        | "איתי"
        | "נועה"
        | "רוברט"
        | "רמי"
      recommended_day: "ראשון" | "שני" | "שלישי" | "רביעי" | "חמישי" | "שישי"
      separation:
        | "תל אביב-יפו 1"
        | "תל אביב-יפו 2"
        | "תל אביב-יפו 3"
        | "תל אביב-יפו 4"
        | "ירושלים 1"
        | "ירושלים 2"
        | "ירושלים 3"
        | "ירושלים 4"
        | "חיפה-קריות 1"
        | "חיפה-קריות 2"
        | "חיפה-קריות 3"
        | "חיפה-קריות 4"
        | "שרון 1"
        | "שרון 2"
        | "שרון 3"
        | "שרון 4"
        | "ראשון לציון 1"
        | "ראשון לציון 2"
        | "ראשון לציון 3"
        | "ראשון לציון 4"
        | "שפלה 1"
        | "שפלה 2"
        | "שפלה 3"
        | "שפלה 4"
        | "צפון רחוק 1"
        | "צפון רחוק 2"
        | "צפון רחוק 3"
        | "צפון רחוק 4"
        | "צפון קרוב 1"
        | "צפון קרוב 2"
        | "צפון קרוב 3"
        | "צפון קרוב 4"
        | "דרום 1"
        | "דרום 2"
        | "דרום 3"
        | "דרום 4"
        | "אילת 1"
        | "אילת 2"
        | "אילת 3"
        | "אילת 4"
        | "פתח תקווה 1"
        | "פתח תקווה 2"
        | "פתח תקווה 3"
        | "פתח תקווה 4"
        | "חדרה 1"
        | "חדרה 2"
        | "חדרה 3"
        | "חדרה 4"
      subject_message:
        | "לבטל הזמנה"
        | "לדחות"
        | "שינוי מוצרים"
        | "הנחות"
        | "אספקה"
        | "הזמנה על לקוח אחר"
        | "מחסן"
        | "להחזיר הזמנה עם גלידה"
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
      drivers: ["ארז", "יוסי", "שי", "רוברט", "קבלן"],
      ezorim: [
        "תל אביב-יפו",
        "ירושלים",
        "חיפה-קריות",
        "שרון",
        "ראשון לציון",
        "שפלה",
        "צפון רחוק",
        "צפון קרוב",
        "דרום",
        "אילת",
        "פתח תקווה",
        "חדרה",
      ],
      frequency: ["כל שבוע", "כל שבוע שני", "כל שבוע שלישי", "פעם בחודש"],
      Melaktim: ["חמי", "לאון", "חיים", "יקיר", "איתי", "נועה", "רוברט", "רמי"],
      recommended_day: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"],
      separation: [
        "תל אביב-יפו 1",
        "תל אביב-יפו 2",
        "תל אביב-יפו 3",
        "תל אביב-יפו 4",
        "ירושלים 1",
        "ירושלים 2",
        "ירושלים 3",
        "ירושלים 4",
        "חיפה-קריות 1",
        "חיפה-קריות 2",
        "חיפה-קריות 3",
        "חיפה-קריות 4",
        "שרון 1",
        "שרון 2",
        "שרון 3",
        "שרון 4",
        "ראשון לציון 1",
        "ראשון לציון 2",
        "ראשון לציון 3",
        "ראשון לציון 4",
        "שפלה 1",
        "שפלה 2",
        "שפלה 3",
        "שפלה 4",
        "צפון רחוק 1",
        "צפון רחוק 2",
        "צפון רחוק 3",
        "צפון רחוק 4",
        "צפון קרוב 1",
        "צפון קרוב 2",
        "צפון קרוב 3",
        "צפון קרוב 4",
        "דרום 1",
        "דרום 2",
        "דרום 3",
        "דרום 4",
        "אילת 1",
        "אילת 2",
        "אילת 3",
        "אילת 4",
        "פתח תקווה 1",
        "פתח תקווה 2",
        "פתח תקווה 3",
        "פתח תקווה 4",
        "חדרה 1",
        "חדרה 2",
        "חדרה 3",
        "חדרה 4",
      ],
      subject_message: [
        "לבטל הזמנה",
        "לדחות",
        "שינוי מוצרים",
        "הנחות",
        "אספקה",
        "הזמנה על לקוח אחר",
        "מחסן",
        "להחזיר הזמנה עם גלידה",
      ],
    },
  },
} as const
