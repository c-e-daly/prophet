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
      addressbook: {
        Row: {
          addressLabel: string | null
          city: string | null
          contactEmail: string | null
          contactName: string | null
          contactPhone: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          geoAddress: Json | null
          id: number
          modifiedDate: string | null
          postalCode: string | null
          province: string | null
          state: string | null
          streetName: string | null
          streetNumber: string | null
          userid: string | null
        }
        Insert: {
          addressLabel?: string | null
          city?: string | null
          contactEmail?: string | null
          contactName?: string | null
          contactPhone?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          geoAddress?: Json | null
          id?: number
          modifiedDate?: string | null
          postalCode?: string | null
          province?: string | null
          state?: string | null
          streetName?: string | null
          streetNumber?: string | null
          userid?: string | null
        }
        Update: {
          addressLabel?: string | null
          city?: string | null
          contactEmail?: string | null
          contactName?: string | null
          contactPhone?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          geoAddress?: Json | null
          id?: number
          modifiedDate?: string | null
          postalCode?: string | null
          province?: string | null
          state?: string | null
          streetName?: string | null
          streetNumber?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      billing: {
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
      campaignGoals: {
        Row: {
          campaign: number | null
          created_at: string
          goal: string
          goalMetric: string
          goalValue: number
          id: number
          shop: number | null
        }
        Insert: {
          campaign?: number | null
          created_at?: string
          goal: string
          goalMetric: string
          goalValue: number
          id?: number
          shop?: number | null
        }
        Update: {
          campaign?: number | null
          created_at?: string
          goal?: string
          goalMetric?: string
          goalValue?: number
          id?: number
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaignGoals_campaign_fkey"
            columns: ["campaign"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaignGoals_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      campaignMetrics: {
        Row: {
          campaign: number | null
          created_at: string
          grossDiscounts: number | null
          grossItems: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number
          orders: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnSales: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
        }
        Insert: {
          campaign?: number | null
          created_at?: string
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          orders?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
        }
        Update: {
          campaign?: number | null
          created_at?: string
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          orders?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaignMetrics_campaign_fkey"
            columns: ["campaign"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          campaignGoals: Json | null
          campaignName: string | null
          codePrefix: string | null
          created_at: string
          created_date: string | null
          createdBy: string | null
          description: string | null
          endDate: string
          id: number
          isDefault: boolean
          modifiedDate: string | null
          shop: number
          shopDomain: string | null
          startDate: string
          status: Database["public"]["Enums"]["campaignStatus"]
        }
        Insert: {
          budget?: number | null
          campaignGoals?: Json | null
          campaignName?: string | null
          codePrefix?: string | null
          created_at?: string
          created_date?: string | null
          createdBy?: string | null
          description?: string | null
          endDate: string
          id?: number
          isDefault: boolean
          modifiedDate?: string | null
          shop: number
          shopDomain?: string | null
          startDate: string
          status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Update: {
          budget?: number | null
          campaignGoals?: Json | null
          campaignName?: string | null
          codePrefix?: string | null
          created_at?: string
          created_date?: string | null
          createdBy?: string | null
          description?: string | null
          endDate?: string
          id?: number
          isDefault?: boolean
          modifiedDate?: string | null
          shop?: number
          shopDomain?: string | null
          startDate?: string
          status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      cartitems: {
        Row: {
          cart: number | null
          cartToken: string
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          modifiedDate: string | null
          offer: number | null
          offerToken: string | null
          product: number | null
          productCartKey: string | null
          productGID: string | null
          productHTML: string | null
          productID: string | null
          productName: string | null
          shop: number | null
          storeUrl: string | null
          template: string | null
          variant: number | null
          variantGID: string | null
          variantID: string
          variantQuantity: number | null
          variantSellingPrice: number | null
          variantSettlementPrice: number | null
          variantSKU: string | null
        }
        Insert: {
          cart?: number | null
          cartToken: string
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modifiedDate?: string | null
          offer?: number | null
          offerToken?: string | null
          product?: number | null
          productCartKey?: string | null
          productGID?: string | null
          productHTML?: string | null
          productID?: string | null
          productName?: string | null
          shop?: number | null
          storeUrl?: string | null
          template?: string | null
          variant?: number | null
          variantGID?: string | null
          variantID: string
          variantQuantity?: number | null
          variantSellingPrice?: number | null
          variantSettlementPrice?: number | null
          variantSKU?: string | null
        }
        Update: {
          cart?: number | null
          cartToken?: string
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modifiedDate?: string | null
          offer?: number | null
          offerToken?: string | null
          product?: number | null
          productCartKey?: string | null
          productGID?: string | null
          productHTML?: string | null
          productID?: string | null
          productName?: string | null
          shop?: number | null
          storeUrl?: string | null
          template?: string | null
          variant?: number | null
          variantGID?: string | null
          variantID?: string
          variantQuantity?: number | null
          variantSellingPrice?: number | null
          variantSettlementPrice?: number | null
          variantSKU?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cartitems_cart_fkey"
            columns: ["cart"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_offer_fkey"
            columns: ["offer"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_product_fkey"
            columns: ["product"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_variant_fkey"
            columns: ["variant"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          bbl_consumerid: string | null
          bbl_offerid: string | null
          bbl_shopid: string | null
          cartCreateDate: string | null
          cartDiscountMarkup: number | null
          cartFinanceMarkup: number | null
          cartItemCount: number | null
          cartItemsSubtotal: number | null
          cartMarketMarkup: number | null
          cartOtherMarkup: number | null
          cartProfitMarkup: number | null
          cartShrinkMarkup: number | null
          cartStatus: string | null
          cartToken: string | null
          cartTotalPrice: number | null
          cartUnitCount: number | null
          cartUrl: string | null
          consumer: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          modifiedDate: string | null
          shop: number | null
        }
        Insert: {
          bbl_consumerid?: string | null
          bbl_offerid?: string | null
          bbl_shopid?: string | null
          cartCreateDate?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: string | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUrl?: string | null
          consumer?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modifiedDate?: string | null
          shop?: number | null
        }
        Update: {
          bbl_consumerid?: string | null
          bbl_offerid?: string | null
          bbl_shopid?: string | null
          cartCreateDate?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: string | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUrl?: string | null
          consumer?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modifiedDate?: string | null
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
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
      consumer12m: {
        Row: {
          categoriesShopped: number | null
          consumer: number | null
          created_at: string
          frequency: number | null
          grossCOGS: number | null
          grossDiscounts: number | null
          grossItems: number | null
          grossReturns: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number
          lastPurchaseDate: string | null
          monetary: number | null
          orders: number | null
          recency: number | null
          returnCOGS: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          shop: number | null
          shopsShopped: number | null
        }
        Insert: {
          categoriesShopped?: number | null
          consumer?: number | null
          created_at?: string
          frequency?: number | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossReturns?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lastPurchaseDate?: string | null
          monetary?: number | null
          orders?: number | null
          recency?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          shop?: number | null
          shopsShopped?: number | null
        }
        Update: {
          categoriesShopped?: number | null
          consumer?: number | null
          created_at?: string
          frequency?: number | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossReturns?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lastPurchaseDate?: string | null
          monetary?: number | null
          orders?: number | null
          recency?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          shop?: number | null
          shopsShopped?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer12M_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer12M_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerCategoryIndex: {
        Row: {
          category: string | null
          consumer: number | null
          created_at: string
          id: number
          shop: number | null
        }
        Insert: {
          category?: string | null
          consumer?: number | null
          created_at?: string
          id?: number
          shop?: number | null
        }
        Update: {
          category?: string | null
          consumer?: number | null
          created_at?: string
          id?: number
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerCategoryIndex_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerCategoryIndex_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerLTV: {
        Row: {
          consumer: number | null
          created_at: string
          firstPurchaseDate: string | null
          grossCOGS: number | null
          grossDiscounts: number | null
          grossFinanceCost: number | null
          grossItems: number | null
          grossProfitMarkup: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossShrinkCost: number | null
          grossUnits: number | null
          highestOrderValue: number | null
          id: number
          lastPurchaseDate: string | null
          lowestOrderValue: number | null
          returnCOGS: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnProfitMarkup: number | null
          returnSales: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          uniqueCategoriesShopped: number | null
        }
        Insert: {
          consumer?: number | null
          created_at?: string
          firstPurchaseDate?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossFinanceCost?: number | null
          grossItems?: number | null
          grossProfitMarkup?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossShrinkCost?: number | null
          grossUnits?: number | null
          highestOrderValue?: number | null
          id?: number
          lastPurchaseDate?: string | null
          lowestOrderValue?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnProfitMarkup?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          uniqueCategoriesShopped?: number | null
        }
        Update: {
          consumer?: number | null
          created_at?: string
          firstPurchaseDate?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossFinanceCost?: number | null
          grossItems?: number | null
          grossProfitMarkup?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossShrinkCost?: number | null
          grossUnits?: number | null
          highestOrderValue?: number | null
          id?: number
          lastPurchaseDate?: string | null
          lowestOrderValue?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnProfitMarkup?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          uniqueCategoriesShopped?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerLTV_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerPortfolioMeasures: {
        Row: {
          consumer: number | null
          cpEndDate: string | null
          cpGrossFinanceCost: number | null
          cpGrossItems: number | null
          cpGrossReturns: number | null
          cpGrossSales: number | null
          cpGrossShippingCost: number | null
          cpGrossSrinkCost: number | null
          cpOrders: number | null
          cpProfitMarkup: number | null
          cpReturnCOGS: number | null
          cpReturnDiscounts: number | null
          cpReturnItems: number | null
          cpReturnSales: number | null
          cpReturnUnits: number | null
          cpStartDate: string | null
          cpStoresShopped: number | null
          createDate: string | null
          createdby: string | null
          cxpGrossCOGS: number | null
          id: number
          modifieDate: string | null
          periodType: string | null
          ppCategoriesShopped: number | null
          ppEndDate: string | null
          ppGrossCOGS: number | null
          ppGrossDiscounts: number | null
          ppGrossFinanceCost: number | null
          ppGrossItems: number | null
          ppGrossSales: number | null
          ppGrossShipCost: number | null
          ppGrossShrinkCost: number | null
          ppGrossUnits: number | null
          ppProfitMarkup: number | null
          ppReturnCOGS: number | null
          ppReturnItems: number | null
          ppReturnSales: number | null
          ppReturnUnits: number | null
          ppStartDate: string | null
          ppStoresShopped: number | null
          shop: string | null
        }
        Insert: {
          consumer?: number | null
          cpEndDate?: string | null
          cpGrossFinanceCost?: number | null
          cpGrossItems?: number | null
          cpGrossReturns?: number | null
          cpGrossSales?: number | null
          cpGrossShippingCost?: number | null
          cpGrossSrinkCost?: number | null
          cpOrders?: number | null
          cpProfitMarkup?: number | null
          cpReturnCOGS?: number | null
          cpReturnDiscounts?: number | null
          cpReturnItems?: number | null
          cpReturnSales?: number | null
          cpReturnUnits?: number | null
          cpStartDate?: string | null
          cpStoresShopped?: number | null
          createDate?: string | null
          createdby?: string | null
          cxpGrossCOGS?: number | null
          id?: number
          modifieDate?: string | null
          periodType?: string | null
          ppCategoriesShopped?: number | null
          ppEndDate?: string | null
          ppGrossCOGS?: number | null
          ppGrossDiscounts?: number | null
          ppGrossFinanceCost?: number | null
          ppGrossItems?: number | null
          ppGrossSales?: number | null
          ppGrossShipCost?: number | null
          ppGrossShrinkCost?: number | null
          ppGrossUnits?: number | null
          ppProfitMarkup?: number | null
          ppReturnCOGS?: number | null
          ppReturnItems?: number | null
          ppReturnSales?: number | null
          ppReturnUnits?: number | null
          ppStartDate?: string | null
          ppStoresShopped?: number | null
          shop?: string | null
        }
        Update: {
          consumer?: number | null
          cpEndDate?: string | null
          cpGrossFinanceCost?: number | null
          cpGrossItems?: number | null
          cpGrossReturns?: number | null
          cpGrossSales?: number | null
          cpGrossShippingCost?: number | null
          cpGrossSrinkCost?: number | null
          cpOrders?: number | null
          cpProfitMarkup?: number | null
          cpReturnCOGS?: number | null
          cpReturnDiscounts?: number | null
          cpReturnItems?: number | null
          cpReturnSales?: number | null
          cpReturnUnits?: number | null
          cpStartDate?: string | null
          cpStoresShopped?: number | null
          createDate?: string | null
          createdby?: string | null
          cxpGrossCOGS?: number | null
          id?: number
          modifieDate?: string | null
          periodType?: string | null
          ppCategoriesShopped?: number | null
          ppEndDate?: string | null
          ppGrossCOGS?: number | null
          ppGrossDiscounts?: number | null
          ppGrossFinanceCost?: number | null
          ppGrossItems?: number | null
          ppGrossSales?: number | null
          ppGrossShipCost?: number | null
          ppGrossShrinkCost?: number | null
          ppGrossUnits?: number | null
          ppProfitMarkup?: number | null
          ppReturnCOGS?: number | null
          ppReturnItems?: number | null
          ppReturnSales?: number | null
          ppReturnUnits?: number | null
          ppStartDate?: string | null
          ppStoresShopped?: number | null
          shop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerMetrics_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerPortfolioScores: {
        Row: {
          consumer: number | null
          cpEndDate: string | null
          cpQuintile: number | null
          cpStartDate: string | null
          created_at: string
          id: number
          portfolioPeriod: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate: string | null
          ppQuintile: number | null
          ppStartDate: string | null
          shop: number | null
        }
        Insert: {
          consumer?: number | null
          cpEndDate?: string | null
          cpQuintile?: number | null
          cpStartDate?: string | null
          created_at?: string
          id?: number
          portfolioPeriod: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate?: string | null
          ppQuintile?: number | null
          ppStartDate?: string | null
          shop?: number | null
        }
        Update: {
          consumer?: number | null
          cpEndDate?: string | null
          cpQuintile?: number | null
          cpStartDate?: string | null
          created_at?: string
          id?: number
          portfolioPeriod?: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate?: string | null
          ppQuintile?: number | null
          ppStartDate?: string | null
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_protfolio_scores_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerPortfolioScores_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumers: {
        Row: {
          address: string | null
          carts: string[] | null
          city: string | null
          consumerShops: number | null
          created_at: string
          created_by: string | null
          created_date: string | null
          customerGID: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          geo_address: Json | null
          id: number
          last_name: string | null
          merchant: string[] | null
          modified_date: string | null
          offers: string[] | null
          phone: string | null
          postal_code: string | null
          shops: number[] | null
          state_province: string | null
          store_url: string[] | null
        }
        Insert: {
          address?: string | null
          carts?: string[] | null
          city?: string | null
          consumerShops?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customerGID?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          geo_address?: Json | null
          id?: number
          last_name?: string | null
          merchant?: string[] | null
          modified_date?: string | null
          offers?: string[] | null
          phone?: string | null
          postal_code?: string | null
          shops?: number[] | null
          state_province?: string | null
          store_url?: string[] | null
        }
        Update: {
          address?: string | null
          carts?: string[] | null
          city?: string | null
          consumerShops?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customerGID?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          geo_address?: Json | null
          id?: number
          last_name?: string | null
          merchant?: string[] | null
          modified_date?: string | null
          offers?: string[] | null
          phone?: string | null
          postal_code?: string | null
          shops?: number[] | null
          state_province?: string | null
          store_url?: string[] | null
        }
        Relationships: []
      }
      consumerShopMetrics: {
        Row: {
          consumer: number | null
          created_at: string
          id: number
          shop: number | null
        }
        Insert: {
          consumer?: number | null
          created_at?: string
          id?: number
          shop?: number | null
        }
        Update: {
          consumer?: number | null
          created_at?: string
          id?: number
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cosnumerShops_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosnumerShops_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          bbl_merchant: string | null
          cartToken: string | null
          code: string | null
          combineOrders: boolean | null
          combineProduct: boolean | null
          combineShipping: boolean | null
          consumer: number | null
          created_at: string
          createDate: string | null
          createDateAPI: string | null
          createdBy: string | null
          datecreated: string | null
          discountAmount: number | null
          discountTitle: string | null
          emailRestriction: string | null
          expiryEndDate: string | null
          expiryStartDate: string | null
          id: number
          modifiedDate: string | null
          order: number | null
          shop: number | null
          shopifyCustomerGID: string | null
          usageCount: number | null
        }
        Insert: {
          bbl_merchant?: string | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumer?: number | null
          created_at?: string
          createDate?: string | null
          createDateAPI?: string | null
          createdBy?: string | null
          datecreated?: string | null
          discountAmount?: number | null
          discountTitle?: string | null
          emailRestriction?: string | null
          expiryEndDate?: string | null
          expiryStartDate?: string | null
          id?: number
          modifiedDate?: string | null
          order?: number | null
          shop?: number | null
          shopifyCustomerGID?: string | null
          usageCount?: number | null
        }
        Update: {
          bbl_merchant?: string | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumer?: number | null
          created_at?: string
          createDate?: string | null
          createDateAPI?: string | null
          createdBy?: string | null
          datecreated?: string | null
          discountAmount?: number | null
          discountTitle?: string | null
          emailRestriction?: string | null
          expiryEndDate?: string | null
          expiryStartDate?: string | null
          id?: number
          modifiedDate?: string | null
          order?: number | null
          shop?: number | null
          shopifyCustomerGID?: string | null
          usageCount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_order_fkey"
            columns: ["order"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      gdprconsumerreq: {
        Row: {
          consumer: number | null
          created_at: string
          customer_email: string | null
          customerGID: string | null
          id: number
          payload: Json | null
          reqeust_completed: string | null
          requested_date: string | null
          shop: number | null
          shop_domain: string | null
          status: string | null
        }
        Insert: {
          consumer?: number | null
          created_at?: string
          customer_email?: string | null
          customerGID?: string | null
          id?: number
          payload?: Json | null
          reqeust_completed?: string | null
          requested_date?: string | null
          shop?: number | null
          shop_domain?: string | null
          status?: string | null
        }
        Update: {
          consumer?: number | null
          created_at?: string
          customer_email?: string | null
          customerGID?: string | null
          id?: number
          payload?: Json | null
          reqeust_completed?: string | null
          requested_date?: string | null
          shop?: number | null
          shop_domain?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdprconsumerreq_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdprconsumerreq_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      gdprrequests: {
        Row: {
          consumer: number | null
          consumerGID: number | null
          created_at: string
          created_by: string | null
          created_date: string | null
          customer_email: string | null
          customer_id: string | null
          customer_phone: string | null
          data_request_id: string | null
          id: number
          modified_date: string | null
          orders_requested: string | null
          orders_to_redact: string | null
          request_type: string | null
          shop: number | null
          shop_domain: string | null
          shop_id: number | null
        }
        Insert: {
          consumer?: number | null
          consumerGID?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          data_request_id?: string | null
          id?: number
          modified_date?: string | null
          orders_requested?: string | null
          orders_to_redact?: string | null
          request_type?: string | null
          shop?: number | null
          shop_domain?: string | null
          shop_id?: number | null
        }
        Update: {
          consumer?: number | null
          consumerGID?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          data_request_id?: string | null
          id?: number
          modified_date?: string | null
          orders_requested?: string | null
          orders_to_redact?: string | null
          request_type?: string | null
          shop?: number | null
          shop_domain?: string | null
          shop_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gdprrequests_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdprrequests_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          createDate: string | null
          createdby: string | null
          id: number
          interestCategory: string | null
          modifiedDate: string | null
          possibleProducts: Json[] | null
          possibleShops: Json[] | null
          specificInterests: string | null
          user: number | null
        }
        Insert: {
          created_at?: string
          createDate?: string | null
          createdby?: string | null
          id?: number
          interestCategory?: string | null
          modifiedDate?: string | null
          possibleProducts?: Json[] | null
          possibleShops?: Json[] | null
          specificInterests?: string | null
          user?: number | null
        }
        Update: {
          created_at?: string
          createDate?: string | null
          createdby?: string | null
          id?: number
          interestCategory?: string | null
          modifiedDate?: string | null
          possibleProducts?: Json[] | null
          possibleShops?: Json[] | null
          specificInterests?: string | null
          user?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interests_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          shop_id: number | null
          state: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: number
          shop_id?: number | null
          state?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: number
          shop_id?: number | null
          state?: string | null
        }
        Relationships: []
      }
      offerMetrics: {
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
      offers: {
        Row: {
          approvedDiscountPrice: number | null
          approvedPrice: number | null
          bbl_consumer: string | null
          bbl_shop: string | null
          calendarWeek: number | null
          campaignCode: string | null
          campaignName: string | null
          campaigns: number | null
          cart: number | null
          cartProfitMarkup: number | null
          cartToken: string | null
          cartTotalMarkup: number | null
          cartTotalPrice: number | null
          checkoutUrl: string | null
          consumer: number | null
          consumerEmail: string | null
          consumerName: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          discountCode: string | null
          id: number
          modifiedDate: string | null
          offerCreateDate: string | null
          offerDiscountPercent: number | null
          offerDiscountPrice: number | null
          offerExpiryEnd: string | null
          offerExpiryMinutes: number | null
          offerExpiryStart: string | null
          offerItems: number | null
          offerPrice: number | null
          offerStatus: string | null
          offerToken: string | null
          offerTOSCheckedDate: string | null
          offerUnits: number | null
          period: number | null
          programAcceptRate: number | null
          programDeclineRate: number | null
          programName: string | null
          programs: number | null
          shop: number | null
          storeBrand: string | null
          storeUrl: string | null
        }
        Insert: {
          approvedDiscountPrice?: number | null
          approvedPrice?: number | null
          bbl_consumer?: string | null
          bbl_shop?: string | null
          calendarWeek?: number | null
          campaignCode?: string | null
          campaignName?: string | null
          campaigns?: number | null
          cart?: number | null
          cartProfitMarkup?: number | null
          cartToken?: string | null
          cartTotalMarkup?: number | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumer?: number | null
          consumerEmail?: string | null
          consumerName?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountCode?: string | null
          id?: number
          modifiedDate?: string | null
          offerCreateDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerExpiryEnd?: string | null
          offerExpiryMinutes?: number | null
          offerExpiryStart?: string | null
          offerItems?: number | null
          offerPrice?: number | null
          offerStatus?: string | null
          offerToken?: string | null
          offerTOSCheckedDate?: string | null
          offerUnits?: number | null
          period?: number | null
          programAcceptRate?: number | null
          programDeclineRate?: number | null
          programName?: string | null
          programs?: number | null
          shop?: number | null
          storeBrand?: string | null
          storeUrl?: string | null
        }
        Update: {
          approvedDiscountPrice?: number | null
          approvedPrice?: number | null
          bbl_consumer?: string | null
          bbl_shop?: string | null
          calendarWeek?: number | null
          campaignCode?: string | null
          campaignName?: string | null
          campaigns?: number | null
          cart?: number | null
          cartProfitMarkup?: number | null
          cartToken?: string | null
          cartTotalMarkup?: number | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumer?: number | null
          consumerEmail?: string | null
          consumerName?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountCode?: string | null
          id?: number
          modifiedDate?: string | null
          offerCreateDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerExpiryEnd?: string | null
          offerExpiryMinutes?: number | null
          offerExpiryStart?: string | null
          offerItems?: number | null
          offerPrice?: number | null
          offerStatus?: string | null
          offerToken?: string | null
          offerTOSCheckedDate?: string | null
          offerUnits?: number | null
          period?: number | null
          programAcceptRate?: number | null
          programDeclineRate?: number | null
          programName?: string | null
          programs?: number | null
          shop?: number | null
          storeBrand?: string | null
          storeUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_campaigns_fkey"
            columns: ["campaigns"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_cart_fkey"
            columns: ["cart"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_period_fkey"
            columns: ["period"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_programs_fkey"
            columns: ["programs"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orderDiscounts: {
        Row: {
          created_at: string
          discount: number | null
          id: number
          order: number | null
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: number
          order?: number | null
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: number
          order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orderDiscounts_discount_fkey"
            columns: ["discount"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDiscounts_order_fkey"
            columns: ["order"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cart: number | null
          categoriesShopped: number | null
          consumer: number | null
          created_at: string
          discount: number | null
          grossDiscounts: number | null
          grossItems: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number
          offer: number | null
          orderDateTime: string | null
          paymentMethod: string | null
          returItems: number | null
          returnDiscounts: number | null
          returnSales: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          salesChannel: string | null
          shop: number | null
        }
        Insert: {
          cart?: number | null
          categoriesShopped?: number | null
          consumer?: number | null
          created_at?: string
          discount?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          offer?: number | null
          orderDateTime?: string | null
          paymentMethod?: string | null
          returItems?: number | null
          returnDiscounts?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          salesChannel?: string | null
          shop?: number | null
        }
        Update: {
          cart?: number | null
          categoriesShopped?: number | null
          consumer?: number | null
          created_at?: string
          discount?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          offer?: number | null
          orderDateTime?: string | null
          paymentMethod?: string | null
          returItems?: number | null
          returnDiscounts?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          salesChannel?: string | null
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cart_fkey"
            columns: ["cart"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_discount_fkey"
            columns: ["discount"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_fkey"
            columns: ["offer"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          calendarDateEnd: string | null
          calendarDateStart: string | null
          calendarDayOfWeek: number | null
          calendarmnth: string | null
          calendarMonth: number | null
          calendarqtr: string | null
          calendarQuarter: number | null
          calendarweek: number | null
          calendarWeek: string | null
          calendarWeekDay: string | null
          calendaryear: number | null
          calendarYear: string | null
          created_at: string
          createDate: string | null
          createdby: string | null
          id: number
          modifiedDate: string | null
        }
        Insert: {
          calendarDateEnd?: string | null
          calendarDateStart?: string | null
          calendarDayOfWeek?: number | null
          calendarmnth?: string | null
          calendarMonth?: number | null
          calendarqtr?: string | null
          calendarQuarter?: number | null
          calendarweek?: number | null
          calendarWeek?: string | null
          calendarWeekDay?: string | null
          calendaryear?: number | null
          calendarYear?: string | null
          created_at?: string
          createDate?: string | null
          createdby?: string | null
          id?: number
          modifiedDate?: string | null
        }
        Update: {
          calendarDateEnd?: string | null
          calendarDateStart?: string | null
          calendarDayOfWeek?: number | null
          calendarmnth?: string | null
          calendarMonth?: number | null
          calendarqtr?: string | null
          calendarQuarter?: number | null
          calendarweek?: number | null
          calendarWeek?: string | null
          calendarWeekDay?: string | null
          calendaryear?: number | null
          calendarYear?: string | null
          created_at?: string
          createDate?: string | null
          createdby?: string | null
          id?: number
          modifiedDate?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          cappedAmount: number | null
          created_at: string
          createdBy: string | null
          createdDate: string | null
          description: string | null
          id: number
          interval: string | null
          isOneTime: boolean | null
          modifiedDate: string | null
          name: string | null
          price: number | null
          returnUrl: string | null
          slug: string | null
          terms: string | null
          trialDays: number | null
        }
        Insert: {
          cappedAmount?: number | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          description?: string | null
          id?: number
          interval?: string | null
          isOneTime?: boolean | null
          modifiedDate?: string | null
          name?: string | null
          price?: number | null
          returnUrl?: string | null
          slug?: string | null
          terms?: string | null
          trialDays?: number | null
        }
        Update: {
          cappedAmount?: number | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          description?: string | null
          id?: number
          interval?: string | null
          isOneTime?: boolean | null
          modifiedDate?: string | null
          name?: string | null
          price?: number | null
          returnUrl?: string | null
          slug?: string | null
          terms?: string | null
          trialDays?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: number | null
          created_at: string
          createdBy: string | null
          createdDate: string | null
          id: number
          merchant: string | null
          modifiedDate: string | null
          productGID: string | null
          productID: string | null
          productName: string | null
          productRegularPrice: number | null
          shop: number | null
        }
        Insert: {
          category?: number | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          id?: number
          merchant?: string | null
          modifiedDate?: string | null
          productGID?: string | null
          productID?: string | null
          productName?: string | null
          productRegularPrice?: number | null
          shop?: number | null
        }
        Update: {
          category?: number | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          id?: number
          merchant?: string | null
          modifiedDate?: string | null
          productGID?: string | null
          productID?: string | null
          productName?: string | null
          productRegularPrice?: number | null
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      programgoals: {
        Row: {
          created_at: string
          goalMetric: Database["public"]["Enums"]["goalMetric"] | null
          goalType: Database["public"]["Enums"]["goal"]
          goalValue: number | null
          id: number
          program: number
        }
        Insert: {
          created_at?: string
          goalMetric?: Database["public"]["Enums"]["goalMetric"] | null
          goalType: Database["public"]["Enums"]["goal"]
          goalValue?: number | null
          id?: number
          program: number
        }
        Update: {
          created_at?: string
          goalMetric?: Database["public"]["Enums"]["goalMetric"] | null
          goalType?: Database["public"]["Enums"]["goal"]
          goalValue?: number | null
          id?: number
          program?: number
        }
        Relationships: [
          {
            foreignKeyName: "programgoals_program_fkey"
            columns: ["program"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programMetrics: {
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
      programs: {
        Row: {
          acceptRate: number | null
          campaign: number | null
          codePrefix: string | null
          combineOrderDiscounts: boolean | null
          combineProductDiscounts: boolean | null
          combineShippingDiscounts: boolean | null
          created_at: string
          createdBy: string | null
          createdDate: string | null
          declineRate: number | null
          endDate: string
          expiryTimeMinutes: number | null
          id: number
          isDefault: boolean | null
          modifiedDate: string | null
          programFocus: string | null
          programid: number | null
          programName: string | null
          shop: number | null
          startDate: string
          status: Database["public"]["Enums"]["programStatus"]
        }
        Insert: {
          acceptRate?: number | null
          campaign?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          declineRate?: number | null
          endDate?: string
          expiryTimeMinutes?: number | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          programFocus?: string | null
          programid?: number | null
          programName?: string | null
          shop?: number | null
          startDate?: string
          status?: Database["public"]["Enums"]["programStatus"]
        }
        Update: {
          acceptRate?: number | null
          campaign?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createdBy?: string | null
          createdDate?: string | null
          declineRate?: number | null
          endDate?: string
          expiryTimeMinutes?: number | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          programFocus?: string | null
          programid?: number | null
          programName?: string | null
          shop?: number | null
          startDate?: string
          status?: Database["public"]["Enums"]["programStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "programs_campaign_fkey"
            columns: ["campaign"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          functionName: string
          id: string
          promptFields: Json | null
          reportName: string
          runType: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          functionName: string
          id?: string
          promptFields?: Json | null
          reportName: string
          runType?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          functionName?: string
          id?: string
          promptFields?: Json | null
          reportName?: string
          runType?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          access_token: string | null
          account_owner: boolean | null
          collaborator: boolean | null
          created_at: string
          email: string | null
          email_verified: boolean | null
          expires: string | null
          first_name: string | null
          id: number
          isonline: boolean | null
          last_name: string | null
          locale: string | null
          scope: string | null
          sessionid: string | null
          shop: string | null
          state: string | null
          userid: number | null
        }
        Insert: {
          access_token?: string | null
          account_owner?: boolean | null
          collaborator?: boolean | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          expires?: string | null
          first_name?: string | null
          id?: number
          isonline?: boolean | null
          last_name?: string | null
          locale?: string | null
          scope?: string | null
          sessionid?: string | null
          shop?: string | null
          state?: string | null
          userid?: number | null
        }
        Update: {
          access_token?: string | null
          account_owner?: boolean | null
          collaborator?: boolean | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          expires?: string | null
          first_name?: string | null
          id?: number
          isonline?: boolean | null
          last_name?: string | null
          locale?: string | null
          scope?: string | null
          sessionid?: string | null
          shop?: string | null
          state?: string | null
          userid?: number | null
        }
        Relationships: []
      }
      shopauth: {
        Row: {
          accessToken: string | null
          created_date: string | null
          createdBy: string | null
          id: string
          modifiedDate: string | null
          shop: number | null
          shop_id: number | null
          shopifyScope: string | null
          shopName: string | null
        }
        Insert: {
          accessToken?: string | null
          created_date?: string | null
          createdBy?: string | null
          id: string
          modifiedDate?: string | null
          shop?: number | null
          shop_id?: number | null
          shopifyScope?: string | null
          shopName?: string | null
        }
        Update: {
          accessToken?: string | null
          created_date?: string | null
          createdBy?: string | null
          id?: string
          modifiedDate?: string | null
          shop?: number | null
          shop_id?: number | null
          shopifyScope?: string | null
          shopName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopauth_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopBilling: {
        Row: {
          created_at: string
          id: number
          shop: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          shop?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopBilling_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          brandName: string | null
          commercePlatform: string | null
          companyAddress: Json | null
          companyLegalName: string | null
          companyPhone: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          modified_date: string | null
          shopAuth: string | null
          shopDomain: string | null
          shopID: number | null
          signupValidationToken: string | null
          storeCurrency: string | null
          storeLogo: string | null
        }
        Insert: {
          brandName?: string | null
          commercePlatform?: string | null
          companyAddress?: Json | null
          companyLegalName?: string | null
          companyPhone?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modified_date?: string | null
          shopAuth?: string | null
          shopDomain?: string | null
          shopID?: number | null
          signupValidationToken?: string | null
          storeCurrency?: string | null
          storeLogo?: string | null
        }
        Update: {
          brandName?: string | null
          commercePlatform?: string | null
          companyAddress?: Json | null
          companyLegalName?: string | null
          companyPhone?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          modified_date?: string | null
          shopAuth?: string | null
          shopDomain?: string | null
          shopID?: number | null
          signupValidationToken?: string | null
          storeCurrency?: string | null
          storeLogo?: string | null
        }
        Relationships: []
      }
      shopSettings: {
        Row: {
          created_at: string
          id: number
          shop: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          shop?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          shop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopSettings_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopstores: {
        Row: {
          city: string | null
          countrycode: string | null
          created_at: string
          createdby: string | null
          createddate: string | null
          domain: string | null
          email: string | null
          hasdiscounts: boolean | null
          hasgiftcards: boolean | null
          hasstorefront: boolean | null
          id: number
          modifieddate: string | null
          phone: string | null
          shop: number | null
          storeaddress: Json | null
          storecheckoutapi: boolean | null
          storeid: string | null
          storename: string | null
          storeurl: string | null
        }
        Insert: {
          city?: string | null
          countrycode?: string | null
          created_at?: string
          createdby?: string | null
          createddate?: string | null
          domain?: string | null
          email?: string | null
          hasdiscounts?: boolean | null
          hasgiftcards?: boolean | null
          hasstorefront?: boolean | null
          id?: number
          modifieddate?: string | null
          phone?: string | null
          shop?: number | null
          storeaddress?: Json | null
          storecheckoutapi?: boolean | null
          storeid?: string | null
          storename?: string | null
          storeurl?: string | null
        }
        Update: {
          city?: string | null
          countrycode?: string | null
          created_at?: string
          createdby?: string | null
          createddate?: string | null
          domain?: string | null
          email?: string | null
          hasdiscounts?: boolean | null
          hasgiftcards?: boolean | null
          hasstorefront?: boolean | null
          id?: number
          modifieddate?: string | null
          phone?: string | null
          shop?: number | null
          storeaddress?: Json | null
          storecheckoutapi?: boolean | null
          storeid?: string | null
          storename?: string | null
          storeurl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopstores_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      storeleads: {
        Row: {
          average_product_price: string | null
          average_product_price_usd: string | null
          avgannualsales: number | null
          avgannualtraffic: number | null
          avgmonthlysales: number | null
          avgmonthlytraffic: number | null
          avgproductprice: number | null
          campaign: string | null
          categories: string | null
          city: string | null
          company_ids: string | null
          company_location: string | null
          country_code: string | null
          created: string | null
          currency: string | null
          currencycode: string | null
          description: string | null
          domain: string | null
          domain_url: string | null
          emails: string | null
          employee_count: number | null
          estimated_monthly_pageviews: number | null
          estimated_monthly_sales: string | null
          estimated_monthly_visits: number | null
          estimated_yearly_sales: string | null
          facebook: string | null
          highproductprice: number | null
          id: string
          instagram: string | null
          linkedin_account: string | null
          linkedin_url: string | null
          lowproductprice: number | null
          maximum_product_price: string | null
          merchant_name: string | null
          meta_description: string | null
          meta_keywords: string | null
          minimum_product_price: string | null
          most_recent_product_title: string | null
          phones: string | null
          pinterest: string | null
          pinterest_followers: number | null
          plan: string | null
          platform: string | null
          platform_rank: number | null
          product_variants: number | null
          products_created_365: number | null
          products_sold: number | null
          rank: number | null
          sales_channels: string | null
          selected: boolean | null
          selecteddate: string | null
          state: string | null
          status: string | null
          street_address: string | null
          tiktok: string | null
          tiktok_followers: number | null
          tiktok_url: string | null
          twitter: string | null
          twitter_followers: number | null
          youtube: string | null
          youtube_followers: number | null
          youtube_url: string | null
          zip: number | null
        }
        Insert: {
          average_product_price?: string | null
          average_product_price_usd?: string | null
          avgannualsales?: number | null
          avgannualtraffic?: number | null
          avgmonthlysales?: number | null
          avgmonthlytraffic?: number | null
          avgproductprice?: number | null
          campaign?: string | null
          categories?: string | null
          city?: string | null
          company_ids?: string | null
          company_location?: string | null
          country_code?: string | null
          created?: string | null
          currency?: string | null
          currencycode?: string | null
          description?: string | null
          domain?: string | null
          domain_url?: string | null
          emails?: string | null
          employee_count?: number | null
          estimated_monthly_pageviews?: number | null
          estimated_monthly_sales?: string | null
          estimated_monthly_visits?: number | null
          estimated_yearly_sales?: string | null
          facebook?: string | null
          highproductprice?: number | null
          id?: string
          instagram?: string | null
          linkedin_account?: string | null
          linkedin_url?: string | null
          lowproductprice?: number | null
          maximum_product_price?: string | null
          merchant_name?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          minimum_product_price?: string | null
          most_recent_product_title?: string | null
          phones?: string | null
          pinterest?: string | null
          pinterest_followers?: number | null
          plan?: string | null
          platform?: string | null
          platform_rank?: number | null
          product_variants?: number | null
          products_created_365?: number | null
          products_sold?: number | null
          rank?: number | null
          sales_channels?: string | null
          selected?: boolean | null
          selecteddate?: string | null
          state?: string | null
          status?: string | null
          street_address?: string | null
          tiktok?: string | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          twitter?: string | null
          twitter_followers?: number | null
          youtube?: string | null
          youtube_followers?: number | null
          youtube_url?: string | null
          zip?: number | null
        }
        Update: {
          average_product_price?: string | null
          average_product_price_usd?: string | null
          avgannualsales?: number | null
          avgannualtraffic?: number | null
          avgmonthlysales?: number | null
          avgmonthlytraffic?: number | null
          avgproductprice?: number | null
          campaign?: string | null
          categories?: string | null
          city?: string | null
          company_ids?: string | null
          company_location?: string | null
          country_code?: string | null
          created?: string | null
          currency?: string | null
          currencycode?: string | null
          description?: string | null
          domain?: string | null
          domain_url?: string | null
          emails?: string | null
          employee_count?: number | null
          estimated_monthly_pageviews?: number | null
          estimated_monthly_sales?: string | null
          estimated_monthly_visits?: number | null
          estimated_yearly_sales?: string | null
          facebook?: string | null
          highproductprice?: number | null
          id?: string
          instagram?: string | null
          linkedin_account?: string | null
          linkedin_url?: string | null
          lowproductprice?: number | null
          maximum_product_price?: string | null
          merchant_name?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          minimum_product_price?: string | null
          most_recent_product_title?: string | null
          phones?: string | null
          pinterest?: string | null
          pinterest_followers?: number | null
          plan?: string | null
          platform?: string | null
          platform_rank?: number | null
          product_variants?: number | null
          products_created_365?: number | null
          products_sold?: number | null
          rank?: number | null
          sales_channels?: string | null
          selected?: boolean | null
          selecteddate?: string | null
          state?: string | null
          status?: string | null
          street_address?: string | null
          tiktok?: string | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          twitter?: string | null
          twitter_followers?: number | null
          youtube?: string | null
          youtube_followers?: number | null
          youtube_url?: string | null
          zip?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          apierror: string | null
          confirmationurl: string | null
          created_at: string
          createdby: string | null
          createddate: string | null
          enddate: string | null
          hsdealid: string | null
          id: number
          interval: string | null
          modifieddate: string | null
          plan: string | null
          renewalautomatically: boolean | null
          shop: number | null
          startdate: string | null
          status: string | null
          subscriptiongid: string | null
          trialstartdate: string | null
          usedfreetrail: boolean | null
          user: string | null
        }
        Insert: {
          apierror?: string | null
          confirmationurl?: string | null
          created_at?: string
          createdby?: string | null
          createddate?: string | null
          enddate?: string | null
          hsdealid?: string | null
          id?: number
          interval?: string | null
          modifieddate?: string | null
          plan?: string | null
          renewalautomatically?: boolean | null
          shop?: number | null
          startdate?: string | null
          status?: string | null
          subscriptiongid?: string | null
          trialstartdate?: string | null
          usedfreetrail?: boolean | null
          user?: string | null
        }
        Update: {
          apierror?: string | null
          confirmationurl?: string | null
          created_at?: string
          createdby?: string | null
          createddate?: string | null
          enddate?: string | null
          hsdealid?: string | null
          id?: number
          interval?: string | null
          modifieddate?: string | null
          plan?: string | null
          renewalautomatically?: boolean | null
          shop?: number | null
          startdate?: string | null
          status?: string | null
          subscriptiongid?: string | null
          trialstartdate?: string | null
          usedfreetrail?: boolean | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      userBilling: {
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
      userProfile: {
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
      users: {
        Row: {
          authemail: string | null
          authemailconfirmed: boolean | null
          created_at: string
          createddate: string | null
          firstname: string | null
          hscontactid: string | null
          id: number
          lastname: string | null
          merchant: string | null
          modifieddate: string | null
          onboardingcampaign: string | null
          onboardingstart: boolean | null
          phonenumber: string | null
          profilepicture: string | null
          rolepermissions: string | null
          storeurl: string | null
          tosagreement: boolean | null
          tosagreementdate: string | null
          userid: string | null
          usersignedup: boolean | null
        }
        Insert: {
          authemail?: string | null
          authemailconfirmed?: boolean | null
          created_at?: string
          createddate?: string | null
          firstname?: string | null
          hscontactid?: string | null
          id?: number
          lastname?: string | null
          merchant?: string | null
          modifieddate?: string | null
          onboardingcampaign?: string | null
          onboardingstart?: boolean | null
          phonenumber?: string | null
          profilepicture?: string | null
          rolepermissions?: string | null
          storeurl?: string | null
          tosagreement?: boolean | null
          tosagreementdate?: string | null
          userid?: string | null
          usersignedup?: boolean | null
        }
        Update: {
          authemail?: string | null
          authemailconfirmed?: boolean | null
          created_at?: string
          createddate?: string | null
          firstname?: string | null
          hscontactid?: string | null
          id?: number
          lastname?: string | null
          merchant?: string | null
          modifieddate?: string | null
          onboardingcampaign?: string | null
          onboardingstart?: boolean | null
          phonenumber?: string | null
          profilepicture?: string | null
          rolepermissions?: string | null
          storeurl?: string | null
          tosagreement?: boolean | null
          tosagreementdate?: string | null
          userid?: string | null
          usersignedup?: boolean | null
        }
        Relationships: []
      }
      variants: {
        Row: {
          allowanceDiscountsMarkup: number | null
          allowanceFinancingMarkup: number | null
          allowanceMarketMarkup: number | null
          allowanceOtherMarkup: number | null
          allowanceShippingMarkup: number | null
          allowanceShrink: number | null
          "bb.l_merchant": string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          imuPrice: number | null
          inventoryQuantity: number | null
          isDefault: boolean | null
          modifiedDate: string | null
          product: number | null
          productVariantGID: string | null
          producVvariantID: string | null
          profitMarkup: number | null
          sellingPrice: number | null
          settlementPrice: number | null
          shop: number | null
          shopifyPrice: number | null
          variantCost: number | null
          variantName: string | null
          variantSKU: string | null
        }
        Insert: {
          allowanceDiscountsMarkup?: number | null
          allowanceFinancingMarkup?: number | null
          allowanceMarketMarkup?: number | null
          allowanceOtherMarkup?: number | null
          allowanceShippingMarkup?: number | null
          allowanceShrink?: number | null
          "bb.l_merchant"?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imuPrice?: number | null
          inventoryQuantity?: number | null
          isDefault?: boolean | null
          modifiedDate?: string | null
          product?: number | null
          productVariantGID?: string | null
          producVvariantID?: string | null
          profitMarkup?: number | null
          sellingPrice?: number | null
          settlementPrice?: number | null
          shop?: number | null
          shopifyPrice?: number | null
          variantCost?: number | null
          variantName?: string | null
          variantSKU?: string | null
        }
        Update: {
          allowanceDiscountsMarkup?: number | null
          allowanceFinancingMarkup?: number | null
          allowanceMarketMarkup?: number | null
          allowanceOtherMarkup?: number | null
          allowanceShippingMarkup?: number | null
          allowanceShrink?: number | null
          "bbl_merchant"?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imuPrice?: number | null
          inventoryQuantity?: number | null
          isDefault?: boolean | null
          modifiedDate?: string | null
          product?: number | null
          productVariantGID?: string | null
          producVvariantID?: string | null
          profitMarkup?: number | null
          sellingPrice?: number | null
          settlementPrice?: number | null
          shop?: number | null
          shopifyPrice?: number | null
          variantCost?: number | null
          variantName?: string | null
          variantSKU?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_fkey"
            columns: ["product"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consumer_12m_install: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      consumer_12m_update: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      consumer_geolocation: {
        Args: { p_shop_id: number }
        Returns: Json
      }
      dashboard_sales_summary: {
        Args: { p_shop_id: number }
        Returns: Json
      }
      "gdpr-consumer-request": {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      "gdpr-shop-redact": {
        Args: { shopid: number }
        Returns: Json
      }
      "gdprrequest-foreign-keys": {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      campaignStatus:
        | "Draft"
        | "Pending"
        | "Active"
        | "Paused"
        | "Complete"
        | "Archived"
      goal:
        | "Gross Margin"
        | "Average Order Value"
        | "New Customers"
        | "Reactivate Customers"
        | "Increase LTV"
        | "Conversion Rate"
        | "Category Sell Through"
        | "Unit Volume"
        | "Transaction Volume"
        | "Other"
      goalMetric:
        | "Consumers"
        | "Orders"
        | "Units"
        | "Bundles"
        | "Items"
        | "Dollars"
      offer_status:
        | "Auto Accepted"
        | "Auto Declined"
        | "Pending Review"
        | "Counter Accepted"
        | "Counter Declined"
        | "Reviewed Accepted"
        | "Reviewed Countered"
        | "Reviewed Declined"
        | "Accepted Expired"
        | "Counter Accepted Expired"
      portfolioPeriod: "12 Months" | "6 Months" | "3 Months"
      programStatus:
        | "Draft"
        | "Pending"
        | "Active"
        | "Paused"
        | "Complete"
        | "Archived"
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
      campaignStatus: [
        "Draft",
        "Pending",
        "Active",
        "Paused",
        "Complete",
        "Archived",
      ],
      goal: [
        "Gross Margin",
        "Average Order Value",
        "New Customers",
        "Reactivate Customers",
        "Increase LTV",
        "Conversion Rate",
        "Category Sell Through",
        "Unit Volume",
        "Transaction Volume",
        "Other",
      ],
      goalMetric: [
        "Consumers",
        "Orders",
        "Units",
        "Bundles",
        "Items",
        "Dollars",
      ],
      offer_status: [
        "Auto Accepted",
        "Auto Declined",
        "Pending Review",
        "Counter Accepted",
        "Counter Declined",
        "Reviewed Accepted",
        "Reviewed Countered",
        "Reviewed Declined",
        "Accepted Expired",
        "Counter Accepted Expired",
      ],
      portfolioPeriod: ["12 Months", "6 Months", "3 Months"],
      programStatus: [
        "Draft",
        "Pending",
        "Active",
        "Paused",
        "Complete",
        "Archived",
      ],
    },
  },
} as const
