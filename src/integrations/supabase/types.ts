export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          agentname: string
          agentnumber: string
          id: string
        }
        Insert: {
          agentname: string
          agentnumber: string
          id?: string
        }
        Update: {
          agentname?: string
          agentnumber?: string
          id?: string
        }
        Relationships: []
      }
      customerlist: {
        Row: {
          address: string | null
          agentnumber: string | null
          arvot: string | null
          city: string | null
          customername: string | null
          customernumber: string
          discount: number | null
          discountdetails: string | null
          mobile: string | null
          obligolimit: number | null
          obligotoday: number | null
          opencustomer: string | null
          phone: string | null
          shotefname: string | null
          shotefnumber: number | null
          sumcustomer: number | null
          supplydetails: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          city?: string | null
          customername?: string | null
          customernumber: string
          discount?: number | null
          discountdetails?: string | null
          mobile?: string | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          phone?: string | null
          shotefname?: string | null
          shotefnumber?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          agentnumber?: string | null
          arvot?: string | null
          city?: string | null
          customername?: string | null
          customernumber?: string
          discount?: number | null
          discountdetails?: string | null
          mobile?: string | null
          obligolimit?: number | null
          obligotoday?: number | null
          opencustomer?: string | null
          phone?: string | null
          shotefname?: string | null
          shotefnumber?: number | null
          sumcustomer?: number | null
          supplydetails?: string | null
          type?: string | null
        }
        Relationships: []
      }
      distribution_groups: {
        Row: {
          agents: Json | null
          day: string | null
          frequency: string | null
          groups_id: number
          separation: string | null
        }
        Insert: {
          agents?: Json | null
          day?: string | null
          frequency?: string | null
          groups_id?: number
          separation?: string | null
        }
        Update: {
          agents?: Json | null
          day?: string | null
          frequency?: string | null
          groups_id?: number
          separation?: string | null
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
          groups_id: number | null
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
          groups_id?: number | null
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
          groups_id?: number | null
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
          american_pallet: number | null
          average_time_for_carton: string | null
          city: string | null
          create_at_order: string | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          Delete_extra: string | null
          done_mainorder: string | null
          end_picking_time: string | null
          euro_pallet: number | null
          icecream: string | null
          invoicedate: string | null
          invoicenumber: number | null
          melaketID: number | null
          mistake_melaket: string | null
          office_mistake: string | null
          ordercancel: string | null
          orderdate: string | null
          ordernumber: number
          orders_PROFIT_id: string | null
          paymentdate: string | null
          priority: string | null
          red_stamp: number | null
          return_reason: Json | null
          schedule_id: number | null
          schedule_id_if_changed: Json | null
          start_picking_time: string | null
          time: string | null
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
          american_pallet?: number | null
          average_time_for_carton?: string | null
          city?: string | null
          create_at_order?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          Delete_extra?: string | null
          done_mainorder?: string | null
          end_picking_time?: string | null
          euro_pallet?: number | null
          icecream?: string | null
          invoicedate?: string | null
          invoicenumber?: number | null
          melaketID?: number | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          ordercancel?: string | null
          orderdate?: string | null
          ordernumber: number
          orders_PROFIT_id?: string | null
          paymentdate?: string | null
          priority?: string | null
          red_stamp?: number | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          start_picking_time?: string | null
          time?: string | null
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
          american_pallet?: number | null
          average_time_for_carton?: string | null
          city?: string | null
          create_at_order?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          Delete_extra?: string | null
          done_mainorder?: string | null
          end_picking_time?: string | null
          euro_pallet?: number | null
          icecream?: string | null
          invoicedate?: string | null
          invoicenumber?: number | null
          melaketID?: number | null
          mistake_melaket?: string | null
          office_mistake?: string | null
          ordercancel?: string | null
          orderdate?: string | null
          ordernumber?: number
          orders_PROFIT_id?: string | null
          paymentdate?: string | null
          priority?: string | null
          red_stamp?: number | null
          return_reason?: Json | null
          schedule_id?: number | null
          schedule_id_if_changed?: Json | null
          start_picking_time?: string | null
          time?: string | null
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
          city: string | null
          create_at_return: string | null
          customergroup: string | null
          customername: string | null
          customernumber: string | null
          done_return: string | null
          icecream: string | null
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
          city?: string | null
          create_at_return?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          done_return?: string | null
          icecream?: string | null
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
          city?: string | null
          create_at_return?: string | null
          customergroup?: string | null
          customername?: string | null
          customernumber?: string | null
          done_return?: string | null
          icecream?: string | null
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
      nahagim: {
        Row: {
          id: number
          nahag: string | null
          truck_id: number | null
        }
        Insert: {
          id: number
          nahag?: string | null
          truck_id?: number | null
        }
        Update: {
          id?: number
          nahag?: string | null
          truck_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nahagim_truck_id_fkey"
            columns: ["truck_id"]
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
          truck_id: number
          truck_model: string | null
          width: number | null
        }
        Insert: {
          height?: number | null
          length?: number | null
          truck_id: number
          truck_model?: string | null
          width?: number | null
        }
        Update: {
          height?: number | null
          length?: number | null
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
    },
  },
} as const
