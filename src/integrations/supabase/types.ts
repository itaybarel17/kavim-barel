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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agentname: string
          agentnumber: string
          id: string
          lastsignin: string | null
          password_hash: string | null
        }
        Insert: {
          agentname: string
          agentnumber: string
          id?: string
          lastsignin?: string | null
          password_hash?: string | null
        }
        Update: {
          agentname?: string
          agentnumber?: string
          id?: string
          lastsignin?: string | null
          password_hash?: string | null
        }
        Relationships: []
      }
      allitems: {
        Row: {
          barcode: string | null
          barelitem: string | null
          cartonbarcode: string | null
          cartstock: number | null
          displaypermaster: number | null
          expirydate: string | null
          expirydate2: string | null
          height: number | null
          icecream: string | null
          itemgroup: string | null
          itemgroupname: string | null
          itemid: string
          itemname: string | null
          itemopendate: string | null
          its_expired: string | null
          kosher: string | null
          lastbuydate: string | null
          length: number | null
          location_id: string | null
          location_order: string | null
          masterbarcode: string | null
          maxdiscount: string | null
          maximumorder: string | null
          minimumorder: string | null
          open_to_sell_in_units: number | null
          pikadon: string | null
          price: number | null
          stock_done: string | null
          subcategory: string | null
          supplier: string | null
          unitpercart: number | null
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          barelitem?: string | null
          cartonbarcode?: string | null
          cartstock?: number | null
          displaypermaster?: number | null
          expirydate?: string | null
          expirydate2?: string | null
          height?: number | null
          icecream?: string | null
          itemgroup?: string | null
          itemgroupname?: string | null
          itemid: string
          itemname?: string | null
          itemopendate?: string | null
          its_expired?: string | null
          kosher?: string | null
          lastbuydate?: string | null
          length?: number | null
          location_id?: string | null
          location_order?: string | null
          masterbarcode?: string | null
          maxdiscount?: string | null
          maximumorder?: string | null
          minimumorder?: string | null
          open_to_sell_in_units?: number | null
          pikadon?: string | null
          price?: number | null
          stock_done?: string | null
          subcategory?: string | null
          supplier?: string | null
          unitpercart?: number | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          barelitem?: string | null
          cartonbarcode?: string | null
          cartstock?: number | null
          displaypermaster?: number | null
          expirydate?: string | null
          expirydate2?: string | null
          height?: number | null
          icecream?: string | null
          itemgroup?: string | null
          itemgroupname?: string | null
          itemid?: string
          itemname?: string | null
          itemopendate?: string | null
          its_expired?: string | null
          kosher?: string | null
          lastbuydate?: string | null
          length?: number | null
          location_id?: string | null
          location_order?: string | null
          masterbarcode?: string | null
          maxdiscount?: string | null
          maximumorder?: string | null
          minimumorder?: string | null
          open_to_sell_in_units?: number | null
          pikadon?: string | null
          price?: number | null
          stock_done?: string | null
          subcategory?: string | null
          supplier?: string | null
          unitpercart?: number | null
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      candycustomerlist: {
        Row: {
          address: string | null
          agentnumber: string | null
          averagesupply: number | null
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
          selected_day: string | null
          selected_day_extra: string | null
          supplydetails: string | null
        }
        Insert: {
          address?: string | null
          agentnumber?: string | null
          averagesupply?: number | null
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
          selected_day?: string | null
          selected_day_extra?: string | null
          supplydetails?: string | null
        }
        Update: {
          address?: string | null
          agentnumber?: string | null
          averagesupply?: number | null
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
          selected_day?: string | null
          selected_day_extra?: string | null
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
      comm_return: {
        Row: {
          address: string | null
          agent_doc: string | null
          barcode: string | null
          cartons: number | null
          city: string | null
          customerdiscount: number | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          discountrow: number | null
          doctypenumber: string | null
          finalnetprice: number | null
          grosslineprice: number | null
          icecream: string | null
          itemid: string | null
          itemname: string | null
          movement_id: string | null
          netlineprice: number | null
          remark: string | null
          returndate: string | null
          returnnumber: string | null
          unitpercart: number | null
          units: number | null
        }
        Insert: {
          address?: string | null
          agent_doc?: string | null
          barcode?: string | null
          cartons?: number | null
          city?: string | null
          customerdiscount?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          discountrow?: number | null
          doctypenumber?: string | null
          finalnetprice?: number | null
          grosslineprice?: number | null
          icecream?: string | null
          itemid?: string | null
          itemname?: string | null
          movement_id?: string | null
          netlineprice?: number | null
          remark?: string | null
          returndate?: string | null
          returnnumber?: string | null
          unitpercart?: number | null
          units?: number | null
        }
        Update: {
          address?: string | null
          agent_doc?: string | null
          barcode?: string | null
          cartons?: number | null
          city?: string | null
          customerdiscount?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          discountrow?: number | null
          doctypenumber?: string | null
          finalnetprice?: number | null
          grosslineprice?: number | null
          icecream?: string | null
          itemid?: string | null
          itemname?: string | null
          movement_id?: string | null
          netlineprice?: number | null
          remark?: string | null
          returndate?: string | null
          returnnumber?: string | null
          unitpercart?: number | null
          units?: number | null
        }
        Relationships: []
      }
      customerlist: {
        Row: {
          active: string | null
          activemonth: number | null
          address: string | null
          agentnumber: string | null
          arvot: string | null
          average_inv_month: number | null
          averagesupply: number | null
          cash_discount: number | null
          city: string | null
          city_area: string | null
          copies_print: number | null
          customergroup: string | null
          customername: string | null
          customernumber: string
          deliverhour: Json | null
          discount: number | null
          discountdetails: string | null
          drink_discount: number | null
          extraarea: string | null
          final_score: number | null
          full_return: number | null
          ice_cream_discount: number | null
          import_discount: number | null
          lat: number | null
          lng: number | null
          misharit_also_local: number | null
          misharit_discount: number | null
          mobile: string | null
          monthopen_calc: number | null
          newarea: string | null
          no_returns_discount: number | null
          nodeliverday: Json | null
          obligolimit: number | null
          obligotoday: number | null
          opencustomer: string | null
          parallel_discount: number | null
          phone: string | null
          recency: number | null
          selected_day: string | null
          selected_day_extra: string | null
          shotefname: string | null
          shotefnumber: number | null
          spread: number | null
          sumcustomer: number | null
          supplydetails: string | null
          type: string | null
          vat_exemption: string | null
        }
        Insert: {
          active?: string | null
          activemonth?: number | null
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          average_inv_month?: number | null
          averagesupply?: number | null
          cash_discount?: number | null
          city?: string | null
          city_area?: string | null
          copies_print?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber: string
          deliverhour?: Json | null
          discount?: number | null
          discountdetails?: string | null
          drink_discount?: number | null
          extraarea?: string | null
          final_score?: number | null
          full_return?: number | null
          ice_cream_discount?: number | null
          import_discount?: number | null
          lat?: number | null
          lng?: number | null
          misharit_also_local?: number | null
          misharit_discount?: number | null
          mobile?: string | null
          monthopen_calc?: number | null
          newarea?: string | null
          no_returns_discount?: number | null
          nodeliverday?: Json | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          parallel_discount?: number | null
          phone?: string | null
          recency?: number | null
          selected_day?: string | null
          selected_day_extra?: string | null
          shotefname?: string | null
          shotefnumber?: number | null
          spread?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
          vat_exemption?: string | null
        }
        Update: {
          active?: string | null
          activemonth?: number | null
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          average_inv_month?: number | null
          averagesupply?: number | null
          cash_discount?: number | null
          city?: string | null
          city_area?: string | null
          copies_print?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string
          deliverhour?: Json | null
          discount?: number | null
          discountdetails?: string | null
          drink_discount?: number | null
          extraarea?: string | null
          final_score?: number | null
          full_return?: number | null
          ice_cream_discount?: number | null
          import_discount?: number | null
          lat?: number | null
          lng?: number | null
          misharit_also_local?: number | null
          misharit_discount?: number | null
          mobile?: string | null
          monthopen_calc?: number | null
          newarea?: string | null
          no_returns_discount?: number | null
          nodeliverday?: Json | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          parallel_discount?: number | null
          phone?: string | null
          recency?: number | null
          selected_day?: string | null
          selected_day_extra?: string | null
          shotefname?: string | null
          shotefnumber?: number | null
          spread?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
          vat_exemption?: string | null
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
          groups_id?: number
          orderlabelinkavim?: number | null
          separation?: string | null
          totalsupplyspots?: number | null
        }
        Relationships: []
      }
      distribution_routes: {
        Row: {
          created_at: string | null
          id: string
          route_data: Json
          schedule_id: number | null
          total_distance: number | null
          total_duration: number | null
          waypoints: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          route_data: Json
          schedule_id?: number | null
          total_distance?: number | null
          total_duration?: number | null
          waypoints?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          route_data?: Json
          schedule_id?: number | null
          total_distance?: number | null
          total_duration?: number | null
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_routes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "distribution_schedule"
            referencedColumns: ["schedule_id"]
          },
        ]
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
          live_app_melaket: boolean | null
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
          live_app_melaket?: boolean | null
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
          live_app_melaket?: boolean | null
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
          invoicenumber: string
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
          invoicenumber: string
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
          invoicenumber?: string
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
          city: string | null
          copied_to_hashavshevet: boolean | null
          create_at_order: string | null
          custom_check_time: string | null
          customerdiscount: number | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          day1: string | null
          day2: string | null
          Delete_extra: string | null
          docdate: string | null
          doctype_to_hash: string | null
          done_mainorder: string | null
          end_checking_boolean: boolean | null
          end_checking_time: string | null
          end_picking_boolean: boolean | null
          end_picking_time: string | null
          ezor1: string | null
          ezor2: string | null
          hashavshevet: string | null
          hour: string | null
          icecream: string | null
          ignore_icecream: boolean | null
          invoicedate: string | null
          invoicenumber: number | null
          likut_check_time: string | null
          melaket: string | null
          melaket_check: string | null
          melaket_check_id: number | null
          melaketID: number | null
          message_alert: boolean | null
          mistake_melaket: string | null
          office_mistake: string | null
          online_check: boolean | null
          online_likut: boolean | null
          online_temp_save: boolean | null
          ordercancel: string | null
          ordercancel_reason: string | null
          orderdate: string | null
          ordernumber: number
          orders_PROFIT_id: string | null
          pallets: number | null
          paymentdate: string | null
          priority: string | null
          quotation_doc: number | null
          red_stamp: number | null
          remark: string | null
          return_reason: Json | null
          schedule_id: number | null
          schedule_id_if_changed: Json | null
          set_aside: boolean | null
          start_checking_time: string | null
          start_picking_time: string | null
          temp_save_time: Json | null
          Total_cartons: number | null
          totalinvoice: number | null
          totalorder: number | null
          valuedate: string | null
          vat: number | null
          volume: number | null
          warehouse_code: number | null
          weight_order: number | null
        }
        Insert: {
          address?: string | null
          agentname?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          city?: string | null
          copied_to_hashavshevet?: boolean | null
          create_at_order?: string | null
          custom_check_time?: string | null
          customerdiscount?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          day1?: string | null
          day2?: string | null
          Delete_extra?: string | null
          docdate?: string | null
          doctype_to_hash?: string | null
          done_mainorder?: string | null
          end_checking_boolean?: boolean | null
          end_checking_time?: string | null
          end_picking_boolean?: boolean | null
          end_picking_time?: string | null
          ezor1?: string | null
          ezor2?: string | null
          hashavshevet?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          invoicedate?: string | null
          invoicenumber?: number | null
          likut_check_time?: string | null
          melaket?: string | null
          melaket_check?: string | null
          melaket_check_id?: number | null
          melaketID?: number | null
          message_alert?: boolean | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          online_check?: boolean | null
          online_likut?: boolean | null
          online_temp_save?: boolean | null
          ordercancel?: string | null
          ordercancel_reason?: string | null
          orderdate?: string | null
          ordernumber: number
          orders_PROFIT_id?: string | null
          pallets?: number | null
          paymentdate?: string | null
          priority?: string | null
          quotation_doc?: number | null
          red_stamp?: number | null
          remark?: string | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          set_aside?: boolean | null
          start_checking_time?: string | null
          start_picking_time?: string | null
          temp_save_time?: Json | null
          Total_cartons?: number | null
          totalinvoice?: number | null
          totalorder?: number | null
          valuedate?: string | null
          vat?: number | null
          volume?: number | null
          warehouse_code?: number | null
          weight_order?: number | null
        }
        Update: {
          address?: string | null
          agentname?: string | null
          agentnumber?: string | null
          alert_status?: boolean | null
          city?: string | null
          copied_to_hashavshevet?: boolean | null
          create_at_order?: string | null
          custom_check_time?: string | null
          customerdiscount?: number | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          day1?: string | null
          day2?: string | null
          Delete_extra?: string | null
          docdate?: string | null
          doctype_to_hash?: string | null
          done_mainorder?: string | null
          end_checking_boolean?: boolean | null
          end_checking_time?: string | null
          end_picking_boolean?: boolean | null
          end_picking_time?: string | null
          ezor1?: string | null
          ezor2?: string | null
          hashavshevet?: string | null
          hour?: string | null
          icecream?: string | null
          ignore_icecream?: boolean | null
          invoicedate?: string | null
          invoicenumber?: number | null
          likut_check_time?: string | null
          melaket?: string | null
          melaket_check?: string | null
          melaket_check_id?: number | null
          melaketID?: number | null
          message_alert?: boolean | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          online_check?: boolean | null
          online_likut?: boolean | null
          online_temp_save?: boolean | null
          ordercancel?: string | null
          ordercancel_reason?: string | null
          orderdate?: string | null
          ordernumber?: number
          orders_PROFIT_id?: string | null
          pallets?: number | null
          paymentdate?: string | null
          priority?: string | null
          quotation_doc?: number | null
          red_stamp?: number | null
          remark?: string | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          set_aside?: boolean | null
          start_checking_time?: string | null
          start_picking_time?: string | null
          temp_save_time?: Json | null
          Total_cartons?: number | null
          totalinvoice?: number | null
          totalorder?: number | null
          valuedate?: string | null
          vat?: number | null
          volume?: number | null
          warehouse_code?: number | null
          weight_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mainorder_melaket_check_id_fkey"
            columns: ["melaket_check_id"]
            isOneToOne: false
            referencedRelation: "meltaktim"
            referencedColumns: ["id"]
          },
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
          move_picked_items_to_end: boolean | null
          move_to_next_item: boolean | null
        }
        Insert: {
          id?: number
          melaket?: string | null
          move_picked_items_to_end?: boolean | null
          move_to_next_item?: boolean | null
        }
        Update: {
          id?: number
          melaket?: string | null
          move_picked_items_to_end?: boolean | null
          move_to_next_item?: boolean | null
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
          note: string | null
          updated_at: string | null
        }
        Insert: {
          id: number
          nahag?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          nahag?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          barcode: string | null
          cart: number | null
          carton_after_onlysave_picking: number | null
          cartonafterpicking: number | null
          cartonbarcode: string | null
          customername: string | null
          customernumber: string | null
          discountrow: number | null
          discountrow_updated: number | null
          done: boolean | null
          expirydate: string | null
          finalcarton: number | null
          finalunit: number | null
          grosslineprice: number | null
          icecream: string | null
          itemid: string | null
          itemname: string | null
          local: string | null
          movement_id: number
          orderdate: string | null
          ordernumber: number | null
          pikadon: string | null
          serialnumber: number | null
          unit: number | null
          unit_after_onlysave_picking: number | null
          unitafterpicking: number | null
          unitpercart: number | null
        }
        Insert: {
          barcode?: string | null
          cart?: number | null
          carton_after_onlysave_picking?: number | null
          cartonafterpicking?: number | null
          cartonbarcode?: string | null
          customername?: string | null
          customernumber?: string | null
          discountrow?: number | null
          discountrow_updated?: number | null
          done?: boolean | null
          expirydate?: string | null
          finalcarton?: number | null
          finalunit?: number | null
          grosslineprice?: number | null
          icecream?: string | null
          itemid?: string | null
          itemname?: string | null
          local?: string | null
          movement_id: number
          orderdate?: string | null
          ordernumber?: number | null
          pikadon?: string | null
          serialnumber?: number | null
          unit?: number | null
          unit_after_onlysave_picking?: number | null
          unitafterpicking?: number | null
          unitpercart?: number | null
        }
        Update: {
          barcode?: string | null
          cart?: number | null
          carton_after_onlysave_picking?: number | null
          cartonafterpicking?: number | null
          cartonbarcode?: string | null
          customername?: string | null
          customernumber?: string | null
          discountrow?: number | null
          discountrow_updated?: number | null
          done?: boolean | null
          expirydate?: string | null
          finalcarton?: number | null
          finalunit?: number | null
          grosslineprice?: number | null
          icecream?: string | null
          itemid?: string | null
          itemname?: string | null
          local?: string | null
          movement_id?: number
          orderdate?: string | null
          ordernumber?: number | null
          pikadon?: string | null
          serialnumber?: number | null
          unit?: number | null
          unit_after_onlysave_picking?: number | null
          unitafterpicking?: number | null
          unitpercart?: number | null
        }
        Relationships: []
      }
      other_doctype_list: {
        Row: {
          created_at: string
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          doctype: number | null
          id: number
        }
        Insert: {
          created_at?: string
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          doctype?: number | null
          id?: number
        }
        Update: {
          created_at?: string
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          doctype?: number | null
          id?: number
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
      pointer_tokens: {
        Row: {
          access_token: string
          consecutive_failures: number | null
          created_at: string | null
          expires_at: string
          id: string
          last_login_failure: string | null
        }
        Insert: {
          access_token: string
          consecutive_failures?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          last_login_failure?: string | null
        }
        Update: {
          access_token?: string
          consecutive_failures?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          last_login_failure?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          melaket_id: number
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          melaket_id: number
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          melaket_id?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_melaket_id_fkey"
            columns: ["melaket_id"]
            isOneToOne: true
            referencedRelation: "meltaktim"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_locations: {
        Row: {
          address: string | null
          created_at: string | null
          direction: number | null
          engine_coolant: number | null
          engine_hours: number | null
          engine_on_sum: number | null
          engine_speed: number | null
          fms_datetime: string | null
          fuel_level: number | null
          gps_datetime: string
          id: string
          ignition_on: boolean | null
          last_driver_name: string | null
          last_driver_num: number | null
          latitude: number
          longitude: number
          odometer: number | null
          pto_state: number | null
          speed: number | null
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          direction?: number | null
          engine_coolant?: number | null
          engine_hours?: number | null
          engine_on_sum?: number | null
          engine_speed?: number | null
          fms_datetime?: string | null
          fuel_level?: number | null
          gps_datetime: string
          id?: string
          ignition_on?: boolean | null
          last_driver_name?: string | null
          last_driver_num?: number | null
          latitude: number
          longitude: number
          odometer?: number | null
          pto_state?: number | null
          speed?: number | null
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          direction?: number | null
          engine_coolant?: number | null
          engine_hours?: number | null
          engine_on_sum?: number | null
          engine_speed?: number | null
          fms_datetime?: string | null
          fuel_level?: number | null
          gps_datetime?: string
          id?: string
          ignition_on?: boolean | null
          last_driver_name?: string | null
          last_driver_num?: number | null
          latitude?: number
          longitude?: number
          odometer?: number | null
          pto_state?: number | null
          speed?: number | null
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      vehicle_trips: {
        Row: {
          created_at: string | null
          distance_meter: number | null
          driver_id: number | null
          driver_name: string | null
          duration_second: number | null
          end_address: string | null
          end_datetime: string
          end_latitude: number
          end_longitude: number
          id: string
          idle: number | null
          item_id: number
          start_address: string | null
          start_datetime: string
          start_latitude: number
          start_longitude: number
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          distance_meter?: number | null
          driver_id?: number | null
          driver_name?: string | null
          duration_second?: number | null
          end_address?: string | null
          end_datetime: string
          end_latitude: number
          end_longitude: number
          id?: string
          idle?: number | null
          item_id: number
          start_address?: string | null
          start_datetime: string
          start_latitude: number
          start_longitude: number
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          distance_meter?: number | null
          driver_id?: number | null
          driver_name?: string | null
          duration_second?: number | null
          end_address?: string | null
          end_datetime?: string
          end_latitude?: number
          end_longitude?: number
          id?: string
          idle?: number | null
          item_id?: number
          start_address?: string | null
          start_datetime?: string
          start_latitude?: number
          start_longitude?: number
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          agent_id: string | null
          driver_id: number | null
          height: number | null
          is_company_vehicle: boolean | null
          length: number | null
          literperkm: number | null
          model: string | null
          num_of_pallets: number | null
          "vehicle number": number | null
          vehicle_id: number
          width: number | null
        }
        Insert: {
          agent_id?: string | null
          driver_id?: number | null
          height?: number | null
          is_company_vehicle?: boolean | null
          length?: number | null
          literperkm?: number | null
          model?: string | null
          num_of_pallets?: number | null
          "vehicle number"?: number | null
          vehicle_id: number
          width?: number | null
        }
        Update: {
          agent_id?: string | null
          driver_id?: number | null
          height?: number | null
          is_company_vehicle?: boolean | null
          length?: number | null
          literperkm?: number | null
          model?: string | null
          num_of_pallets?: number | null
          "vehicle number"?: number | null
          vehicle_id?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agentnumber"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "nahagim"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_driver_to_vehicle: {
        Args: { p_driver_id: number; p_notes?: string; p_vehicle_id: number }
        Returns: string
      }
      calculate_docdate: { Args: { input_date: string }; Returns: string }
      calculate_total_spots_for_area: {
        Args: { area_separation: string }
        Returns: number
      }
      calculate_valuedate:
        | {
            Args: { customer_num: string; end_check_time: string }
            Returns: string
          }
        | { Args: { customer_num: string; doc_date: string }; Returns: string }
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] }
      dblink_cancel_query: { Args: { "": string }; Returns: string }
      dblink_close: { Args: { "": string }; Returns: string }
      dblink_connect: { Args: { "": string }; Returns: string }
      dblink_connect_u: { Args: { "": string }; Returns: string }
      dblink_current_query: { Args: never; Returns: string }
      dblink_disconnect:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      dblink_error_message: { Args: { "": string }; Returns: string }
      dblink_exec: { Args: { "": string }; Returns: string }
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      dblink_get_connections: { Args: never; Returns: string[] }
      dblink_get_notify:
        | { Args: never; Returns: Record<string, unknown>[] }
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
      dblink_get_pkey: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
        SetofOptions: {
          from: "*"
          to: "dblink_pkey_results"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dblink_get_result: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: { Args: { "": string }; Returns: number }
      exec_sql: { Args: { sql: string }; Returns: Json }
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
      get_region_from_group: { Args: { group_id: string }; Returns: string }
      get_user_melaket: {
        Args: never
        Returns: {
          melaket_id: number
          melaket_name: string
          user_role: string
        }[]
      }
      orders_export_for_hashavshevet_hadash: {
        Args: never
        Returns: {
          address: string
          agentnumber: string
          city: string
          copies_print: number
          custom_check_time: string
          customerdiscount: number
          customername: string
          customernumber: string
          discountrow_updated: number
          distribution_date: string
          docdate: string
          doctype: string
          end_checking_time: string
          end_picking_time: string
          expirydate: string
          finalcarton: number
          finalunit: number
          grosslineprice: number
          icecream: string
          itemid: string
          likut_check_time: string
          melaket: string
          melaket_check: string
          movement_id: number
          ordercancel_reason: string
          orderdate: string
          ordernumber: number
          pallets: number
          quotation_doc: number
          remark: string
          schedule_id: number
          serialnumber: number
          valuedate: string
          vat: number
          volume: number
          warehouse_code: number
          weight_order: number
        }[]
      }
      produce_schedule: { Args: { schedule_id_param: number }; Returns: number }
      sync_averagesupply: { Args: { data: Json }; Returns: undefined }
      update_agent_password: {
        Args: { agent_number: string; new_password: string }
        Returns: boolean
      }
      update_all_quotation_doc: { Args: never; Returns: undefined }
      update_discount_rows_by_customer_discounts: {
        Args: { order_num: number }
        Returns: undefined
      }
      update_quotation_doc_for_customer: {
        Args: { target_customergroup: string; target_customernumber: string }
        Returns: undefined
      }
      update_quotation_doc_for_group: {
        Args: { target_customergroup: string }
        Returns: undefined
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
      dblink_pkey_results: {
        position: number | null
        colname: string | null
      }
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
