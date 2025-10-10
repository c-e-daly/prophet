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
    PostgrestVersion: "13.0.5"
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
      app_errors: {
        Row: {
          at: string
          carts_id: number | null
          consumers_id: number | null
          context: string | null
          detail: string | null
          fn: string
          hint: string | null
          id: number
          message: string | null
          payload: Json | null
          shops_id: number | null
          sqlstate: string | null
        }
        Insert: {
          at?: string
          carts_id?: number | null
          consumers_id?: number | null
          context?: string | null
          detail?: string | null
          fn: string
          hint?: string | null
          id?: number
          message?: string | null
          payload?: Json | null
          shops_id?: number | null
          sqlstate?: string | null
        }
        Update: {
          at?: string
          carts_id?: number | null
          consumers_id?: number | null
          context?: string | null
          detail?: string | null
          fn?: string
          hint?: string | null
          id?: number
          message?: string | null
          payload?: Json | null
          shops_id?: number | null
          sqlstate?: string | null
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
          shops: number | null
        }
        Insert: {
          campaign?: number | null
          created_at?: string
          goal: string
          goalMetric: string
          goalValue: number
          id?: number
          shops?: number | null
        }
        Update: {
          campaign?: number | null
          created_at?: string
          goal?: string
          goalMetric?: string
          goalValue?: number
          id?: number
          shops?: number | null
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
            foreignKeyName: "campaignGoals_shops_fkey"
            columns: ["shops"]
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
          shops: number | null
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
          shops?: number | null
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
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaignMetrics_campaign_fkey"
            columns: ["campaign"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaignMetrics_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          codePrefix: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          dates: Json | null
          description: string | null
          endDate: string | null
          goals: Json | null
          id: number
          isDefault: boolean
          modifiedDate: string | null
          name: string | null
          shops: number
          startDate: string | null
          status: Database["public"]["Enums"]["campaignStatus"]
        }
        Insert: {
          budget?: number | null
          codePrefix?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          createdByUser?: number | null
          dates?: Json | null
          description?: string | null
          endDate?: string | null
          goals?: Json | null
          id?: number
          isDefault: boolean
          modifiedDate?: string | null
          name?: string | null
          shops: number
          startDate?: string | null
          status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Update: {
          budget?: number | null
          codePrefix?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          createdByUser?: number | null
          dates?: Json | null
          description?: string | null
          endDate?: string | null
          goals?: Json | null
          id?: number
          isDefault?: boolean
          modifiedDate?: string | null
          name?: string | null
          shops?: number
          startDate?: string | null
          status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      cartitems: {
        Row: {
          carts: number | null
          cartToken: string
          consumers: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          imageURL: string | null
          lineAllowances: number | null
          lineCost: number | null
          lineDiscount: number | null
          lineMarkupRetained: number | null
          linePrice: number | null
          lineProfit: number | null
          lineSettlePrice: number | null
          modifiedDate: string | null
          name: string | null
          offers: number | null
          productGID: string | null
          productID: string | null
          productImageURL: string | null
          productName: string | null
          products: number | null
          productURL: string | null
          shops: number | null
          sku: string | null
          status: Database["public"]["Enums"]["itemStatus"] | null
          template: string | null
          unitAllowances: number | null
          unitCost: number | null
          unitDiscount: number | null
          unitDiscountAllow: number | null
          unitFinanceAllow: number | null
          unitMarketAdjust: number | null
          unitMarkup: number | null
          unitOfferPrice: number | null
          unitPrice: number | null
          unitProfitMU: number | null
          units: number | null
          unitSettlePrice: number | null
          unitShippingAllow: number | null
          unitShrinkAllow: number | null
          variantGID: string | null
          variantID: string
          variants: number | null
        }
        Insert: {
          carts?: number | null
          cartToken: string
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imageURL?: string | null
          lineAllowances?: number | null
          lineCost?: number | null
          lineDiscount?: number | null
          lineMarkupRetained?: number | null
          linePrice?: number | null
          lineProfit?: number | null
          lineSettlePrice?: number | null
          modifiedDate?: string | null
          name?: string | null
          offers?: number | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          productName?: string | null
          products?: number | null
          productURL?: string | null
          shops?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["itemStatus"] | null
          template?: string | null
          unitAllowances?: number | null
          unitCost?: number | null
          unitDiscount?: number | null
          unitDiscountAllow?: number | null
          unitFinanceAllow?: number | null
          unitMarketAdjust?: number | null
          unitMarkup?: number | null
          unitOfferPrice?: number | null
          unitPrice?: number | null
          unitProfitMU?: number | null
          units?: number | null
          unitSettlePrice?: number | null
          unitShippingAllow?: number | null
          unitShrinkAllow?: number | null
          variantGID?: string | null
          variantID: string
          variants?: number | null
        }
        Update: {
          carts?: number | null
          cartToken?: string
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imageURL?: string | null
          lineAllowances?: number | null
          lineCost?: number | null
          lineDiscount?: number | null
          lineMarkupRetained?: number | null
          linePrice?: number | null
          lineProfit?: number | null
          lineSettlePrice?: number | null
          modifiedDate?: string | null
          name?: string | null
          offers?: number | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          productName?: string | null
          products?: number | null
          productURL?: string | null
          shops?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["itemStatus"] | null
          template?: string | null
          unitAllowances?: number | null
          unitCost?: number | null
          unitDiscount?: number | null
          unitDiscountAllow?: number | null
          unitFinanceAllow?: number | null
          unitMarketAdjust?: number | null
          unitMarkup?: number | null
          unitOfferPrice?: number | null
          unitPrice?: number | null
          unitProfitMU?: number | null
          units?: number | null
          unitSettlePrice?: number | null
          unitShippingAllow?: number | null
          unitShrinkAllow?: number | null
          variantGID?: string | null
          variantID?: string
          variants?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cartitems_carts_fkey"
            columns: ["carts"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "cartitems_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_products_fkey"
            columns: ["products"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartitems_variants_fkey"
            columns: ["variants"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          cartCOGS: number | null
          cartComposition: string | null
          cartDiscountMarkup: number | null
          cartFinanceMarkup: number | null
          cartItemCount: number | null
          cartItemsSubtotal: number | null
          cartMarketMarkup: number | null
          cartOtherMarkup: number | null
          cartProfitMarkup: number | null
          cartShrinkMarkup: number | null
          cartStatus: Database["public"]["Enums"]["cartStatus"] | null
          cartToken: string | null
          cartTotalPrice: number | null
          cartUnitCount: number | null
          cartUpdateDate: string | null
          consumers: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          currency: string | null
          id: number
          modifiedDate: string | null
          offers: number | null
          shops: number | null
        }
        Insert: {
          cartCOGS?: number | null
          cartComposition?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: Database["public"]["Enums"]["cartStatus"] | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUpdateDate?: string | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currency?: string | null
          id?: number
          modifiedDate?: string | null
          offers?: number | null
          shops?: number | null
        }
        Update: {
          cartCOGS?: number | null
          cartComposition?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: Database["public"]["Enums"]["cartStatus"] | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUpdateDate?: string | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currency?: string | null
          id?: number
          modifiedDate?: string | null
          offers?: number | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "carts_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          categoryName: string | null
          created_at: string
          description: string | null
          id: number
        }
        Insert: {
          categoryName?: string | null
          created_at?: string
          description?: string | null
          id?: number
        }
        Update: {
          categoryName?: string | null
          created_at?: string
          description?: string | null
          id?: number
        }
        Relationships: []
      }
      collections: {
        Row: {
          collectionTitle: string | null
          created_at: string
          description: string | null
          id: number
          shops: number | null
          variants: Json | null
        }
        Insert: {
          collectionTitle?: string | null
          created_at?: string
          description?: string | null
          id?: number
          shops?: number | null
          variants?: Json | null
        }
        Update: {
          collectionTitle?: string | null
          created_at?: string
          description?: string | null
          id?: number
          shops?: number | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerDemographics: {
        Row: {
          consumers: number | null
          created_at: string
          id: number
        }
        Insert: {
          consumers?: number | null
          created_at?: string
          id?: number
        }
        Update: {
          consumers?: number | null
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumerDemographics_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerDemographics_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
        ]
      }
      consumerLTV: {
        Row: {
          consumer: number | null
          created_at: string
          firstOfferDate: string | null
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
          lastOfferDate: string | null
          lastPurchaseDate: string | null
          lifetimeOfferLost: number | null
          lifetimeOffersExpired: number | null
          lifetimeOffersMade: number | null
          lifetimeOffersWon: number | null
          lifettimeAveragOfferDiscount: number | null
          lowestOrderValue: number | null
          numberOfShopsOffered: number | null
          numberOfShopsShopped: number | null
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
          firstOfferDate?: string | null
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
          lastOfferDate?: string | null
          lastPurchaseDate?: string | null
          lifetimeOfferLost?: number | null
          lifetimeOffersExpired?: number | null
          lifetimeOffersMade?: number | null
          lifetimeOffersWon?: number | null
          lifettimeAveragOfferDiscount?: number | null
          lowestOrderValue?: number | null
          numberOfShopsOffered?: number | null
          numberOfShopsShopped?: number | null
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
          firstOfferDate?: string | null
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
          lastOfferDate?: string | null
          lastPurchaseDate?: string | null
          lifetimeOfferLost?: number | null
          lifetimeOffersExpired?: number | null
          lifetimeOffersMade?: number | null
          lifetimeOffersWon?: number | null
          lifettimeAveragOfferDiscount?: number | null
          lowestOrderValue?: number | null
          numberOfShopsOffered?: number | null
          numberOfShopsShopped?: number | null
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
          {
            foreignKeyName: "consumerLTV_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
        ]
      }
      consumers: {
        Row: {
          address: string | null
          carts: string[] | null
          city: string | null
          consumerSampleID: number | null
          created_at: string
          created_by: string | null
          createDate: string | null
          customerShopifyGID: string | null
          displayName: string | null
          email: string | null
          firstName: string | null
          geoAddress: Json | null
          id: number
          lastName: string | null
          modifiedDate: string | null
          offers: string[] | null
          phone: string | null
          postalCode: string | null
          stateProvince: string | null
        }
        Insert: {
          address?: string | null
          carts?: string[] | null
          city?: string | null
          consumerSampleID?: number | null
          created_at?: string
          created_by?: string | null
          createDate?: string | null
          customerShopifyGID?: string | null
          displayName?: string | null
          email?: string | null
          firstName?: string | null
          geoAddress?: Json | null
          id?: number
          lastName?: string | null
          modifiedDate?: string | null
          offers?: string[] | null
          phone?: string | null
          postalCode?: string | null
          stateProvince?: string | null
        }
        Update: {
          address?: string | null
          carts?: string[] | null
          city?: string | null
          consumerSampleID?: number | null
          created_at?: string
          created_by?: string | null
          createDate?: string | null
          customerShopifyGID?: string | null
          displayName?: string | null
          email?: string | null
          firstName?: string | null
          geoAddress?: Json | null
          id?: number
          lastName?: string | null
          modifiedDate?: string | null
          offers?: string[] | null
          phone?: string | null
          postalCode?: string | null
          stateProvince?: string | null
        }
        Relationships: []
      }
      consumerShop: {
        Row: {
          consumers: number
          created_at: string
          shops: number
        }
        Insert: {
          consumers: number
          created_at?: string
          shops: number
        }
        Update: {
          consumers?: number
          created_at?: string
          shops?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumerShop_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerShop_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "consumerShop_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopCategoryIndex: {
        Row: {
          category: string | null
          consumer: number | null
          created_at: string
          id: number
          shops: number | null
        }
        Insert: {
          category?: string | null
          consumer?: number | null
          created_at?: string
          id?: number
          shops?: number | null
        }
        Update: {
          category?: string | null
          consumer?: number | null
          created_at?: string
          id?: number
          shops?: number | null
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
            foreignKeyName: "consumerCategoryIndex_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "consumerShopCategoryIndex_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopCPM: {
        Row: {
          consumers: number | null
          cpEndDate: string | null
          cpGrossDiscounts: number | null
          cpGrossFinanceCost: number | null
          cpGrossItems: number | null
          cpGrossReturns: number | null
          cpGrossSales: number | null
          cpGrossShippingCost: number | null
          cpGrossSrinkCost: number | null
          cpGrossUnits: number | null
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
          ppOrders: number | null
          ppProfitMarkup: number | null
          ppReturnCOGS: number | null
          ppReturnItems: number | null
          ppReturnSales: number | null
          ppReturnUnits: number | null
          ppStartDate: string | null
          ppStoresShopped: number | null
          shops: number | null
        }
        Insert: {
          consumers?: number | null
          cpEndDate?: string | null
          cpGrossDiscounts?: number | null
          cpGrossFinanceCost?: number | null
          cpGrossItems?: number | null
          cpGrossReturns?: number | null
          cpGrossSales?: number | null
          cpGrossShippingCost?: number | null
          cpGrossSrinkCost?: number | null
          cpGrossUnits?: number | null
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
          ppOrders?: number | null
          ppProfitMarkup?: number | null
          ppReturnCOGS?: number | null
          ppReturnItems?: number | null
          ppReturnSales?: number | null
          ppReturnUnits?: number | null
          ppStartDate?: string | null
          ppStoresShopped?: number | null
          shops?: number | null
        }
        Update: {
          consumers?: number | null
          cpEndDate?: string | null
          cpGrossDiscounts?: number | null
          cpGrossFinanceCost?: number | null
          cpGrossItems?: number | null
          cpGrossReturns?: number | null
          cpGrossSales?: number | null
          cpGrossShippingCost?: number | null
          cpGrossSrinkCost?: number | null
          cpGrossUnits?: number | null
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
          ppOrders?: number | null
          ppProfitMarkup?: number | null
          ppReturnCOGS?: number | null
          ppReturnItems?: number | null
          ppReturnSales?: number | null
          ppReturnUnits?: number | null
          ppStartDate?: string | null
          ppStoresShopped?: number | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerShopCPM_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerShopCPM_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "consumerShopPortfolioMeasures_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopCPMS: {
        Row: {
          consumers: number | null
          cpEndDate: string | null
          cpQuintile: number | null
          cpStartDate: string | null
          created_at: string
          id: number
          isActive: boolean
          name: Database["public"]["Enums"]["portfolioName"] | null
          portfolioPeriod: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate: string | null
          ppQuintile: number | null
          ppStartDate: string | null
          shops: number | null
        }
        Insert: {
          consumers?: number | null
          cpEndDate?: string | null
          cpQuintile?: number | null
          cpStartDate?: string | null
          created_at?: string
          id?: number
          isActive?: boolean
          name?: Database["public"]["Enums"]["portfolioName"] | null
          portfolioPeriod: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate?: string | null
          ppQuintile?: number | null
          ppStartDate?: string | null
          shops?: number | null
        }
        Update: {
          consumers?: number | null
          cpEndDate?: string | null
          cpQuintile?: number | null
          cpStartDate?: string | null
          created_at?: string
          id?: number
          isActive?: boolean
          name?: Database["public"]["Enums"]["portfolioName"] | null
          portfolioPeriod?: Database["public"]["Enums"]["portfolioPeriod"]
          ppEndDate?: string | null
          ppQuintile?: number | null
          ppStartDate?: string | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerShopCPMS_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerShopCPMS_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "consumerShopPortfolioScores_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopLTV: {
        Row: {
          averageOrderValue: number | null
          brandDuration: number | null
          consumers: number | null
          created_at: string
          distinctCategories: number | null
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
          salesVelocity: number | null
          shops: number | null
          topCategory: string | null
          totalGrossProfit: number | null
          totalItems: number | null
          totalNetSales: number | null
          totalNORSales: number | null
          totalOffers: number | null
          totalOrders: number | null
          totalShippingSales: number | null
          totalUnits: number | null
          uniqueCategoriesShopped: number | null
          updated_at: string | null
        }
        Insert: {
          averageOrderValue?: number | null
          brandDuration?: number | null
          consumers?: number | null
          created_at?: string
          distinctCategories?: number | null
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
          salesVelocity?: number | null
          shops?: number | null
          topCategory?: string | null
          totalGrossProfit?: number | null
          totalItems?: number | null
          totalNetSales?: number | null
          totalNORSales?: number | null
          totalOffers?: number | null
          totalOrders?: number | null
          totalShippingSales?: number | null
          totalUnits?: number | null
          uniqueCategoriesShopped?: number | null
          updated_at?: string | null
        }
        Update: {
          averageOrderValue?: number | null
          brandDuration?: number | null
          consumers?: number | null
          created_at?: string
          distinctCategories?: number | null
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
          salesVelocity?: number | null
          shops?: number | null
          topCategory?: string | null
          totalGrossProfit?: number | null
          totalItems?: number | null
          totalNetSales?: number | null
          totalNORSales?: number | null
          totalOffers?: number | null
          totalOrders?: number | null
          totalShippingSales?: number | null
          totalUnits?: number | null
          uniqueCategoriesShopped?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerShopLTV_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumerShopLTV_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "consumerShopLTV_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      counterOffers: {
        Row: {
          approvedAt: string | null
          approvedByUser: number | null
          confidenceScore: number | null
          consumerResponse: string | null
          consumerResponseDate: string | null
          counterConfig: Json | null
          counterOfferPrice: number
          counterReason: string | null
          counterTemplates: number | null
          counterType: string | null
          createDate: string | null
          createdByUser: number
          description: string | null
          estimatedMarginCents: number | null
          estimatedMarginPercent: number | null
          expectedMarginCents: number | null
          expectedRevenueCents: number | null
          expectedValueScore: number | null
          expirationDate: string | null
          finalAmountCents: number | null
          headline: string | null
          id: number
          internalNotes: string | null
          marginImpactCents: number | null
          modifiedDate: string | null
          offers: number
          offerStatus: Database["public"]["Enums"]["offerStatus"] | null
          originalMarginCents: number | null
          originalMarginPercent: number | null
          predictedAcceptanceProbability: number | null
          predictionFactors: Json | null
          requiresApproval: boolean | null
          shops: number
          strategyRationale: string | null
          totalDiscountCents: number | null
        }
        Insert: {
          approvedAt?: string | null
          approvedByUser?: number | null
          confidenceScore?: number | null
          consumerResponse?: string | null
          consumerResponseDate?: string | null
          counterConfig?: Json | null
          counterOfferPrice: number
          counterReason?: string | null
          counterTemplates?: number | null
          counterType?: string | null
          createDate?: string | null
          createdByUser: number
          description?: string | null
          estimatedMarginCents?: number | null
          estimatedMarginPercent?: number | null
          expectedMarginCents?: number | null
          expectedRevenueCents?: number | null
          expectedValueScore?: number | null
          expirationDate?: string | null
          finalAmountCents?: number | null
          headline?: string | null
          id?: number
          internalNotes?: string | null
          marginImpactCents?: number | null
          modifiedDate?: string | null
          offers: number
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          originalMarginCents?: number | null
          originalMarginPercent?: number | null
          predictedAcceptanceProbability?: number | null
          predictionFactors?: Json | null
          requiresApproval?: boolean | null
          shops: number
          strategyRationale?: string | null
          totalDiscountCents?: number | null
        }
        Update: {
          approvedAt?: string | null
          approvedByUser?: number | null
          confidenceScore?: number | null
          consumerResponse?: string | null
          consumerResponseDate?: string | null
          counterConfig?: Json | null
          counterOfferPrice?: number
          counterReason?: string | null
          counterTemplates?: number | null
          counterType?: string | null
          createDate?: string | null
          createdByUser?: number
          description?: string | null
          estimatedMarginCents?: number | null
          estimatedMarginPercent?: number | null
          expectedMarginCents?: number | null
          expectedRevenueCents?: number | null
          expectedValueScore?: number | null
          expirationDate?: string | null
          finalAmountCents?: number | null
          headline?: string | null
          id?: number
          internalNotes?: string | null
          marginImpactCents?: number | null
          modifiedDate?: string | null
          offers?: number
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          originalMarginCents?: number | null
          originalMarginPercent?: number | null
          predictedAcceptanceProbability?: number | null
          predictionFactors?: Json | null
          requiresApproval?: boolean | null
          shops?: number
          strategyRationale?: string | null
          totalDiscountCents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "counterOffers_approvedByUser_fkey"
            columns: ["approvedByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterOffers_counterTemplates_fkey"
            columns: ["counterTemplates"]
            isOneToOne: false
            referencedRelation: "counterTemplates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterOffers_createdByUser_fkey"
            columns: ["createdByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterOffers_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterOffers_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      counterTemplates: {
        Row: {
          accepted: number | null
          acceptRate: number | null
          category: string | null
          config: Json
          createDate: string | null
          createdByUser: number | null
          description: string | null
          headline: string | null
          id: number
          isActive: boolean | null
          isDefault: boolean | null
          maxCartValueCents: number | null
          maxDiscountPercent: number | null
          message: string | null
          minCartValueCents: number | null
          minMarginPercent: number | null
          modifiedDate: string | null
          name: string
          requiresApproval: boolean | null
          shops: number
          target: string[] | null
          type: string
          usage: number | null
        }
        Insert: {
          accepted?: number | null
          acceptRate?: number | null
          category?: string | null
          config: Json
          createDate?: string | null
          createdByUser?: number | null
          description?: string | null
          headline?: string | null
          id?: number
          isActive?: boolean | null
          isDefault?: boolean | null
          maxCartValueCents?: number | null
          maxDiscountPercent?: number | null
          message?: string | null
          minCartValueCents?: number | null
          minMarginPercent?: number | null
          modifiedDate?: string | null
          name: string
          requiresApproval?: boolean | null
          shops: number
          target?: string[] | null
          type: string
          usage?: number | null
        }
        Update: {
          accepted?: number | null
          acceptRate?: number | null
          category?: string | null
          config?: Json
          createDate?: string | null
          createdByUser?: number | null
          description?: string | null
          headline?: string | null
          id?: number
          isActive?: boolean | null
          isDefault?: boolean | null
          maxCartValueCents?: number | null
          maxDiscountPercent?: number | null
          message?: string | null
          minCartValueCents?: number | null
          minMarginPercent?: number | null
          modifiedDate?: string | null
          name?: string
          requiresApproval?: boolean | null
          shops?: number
          target?: string[] | null
          type?: string
          usage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "counterTemplates_createdByUser_fkey"
            columns: ["createdByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterTemplates_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          carts: number | null
          cartToken: string | null
          code: string | null
          combineOrders: boolean | null
          combineProduct: boolean | null
          combineShipping: boolean | null
          consumers: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          datecreated: string | null
          discountAmount: number | null
          discountTitle: string | null
          emailRestriction: string | null
          expiryEndDate: string | null
          expiryStartDate: string | null
          id: number
          minimumSubtotal: number | null
          modifiedDate: string | null
          offers: number | null
          orders: number | null
          programs: number | null
          shopifyCodeEcho: string | null
          shopifyCustomerGID: string | null
          shopifyDiscountGID: string | null
          shopifyPostedDate: string | null
          shopifyResponse: Json | null
          shops: number | null
          usageCount: number | null
        }
        Insert: {
          carts?: number | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          datecreated?: string | null
          discountAmount?: number | null
          discountTitle?: string | null
          emailRestriction?: string | null
          expiryEndDate?: string | null
          expiryStartDate?: string | null
          id?: number
          minimumSubtotal?: number | null
          modifiedDate?: string | null
          offers?: number | null
          orders?: number | null
          programs?: number | null
          shopifyCodeEcho?: string | null
          shopifyCustomerGID?: string | null
          shopifyDiscountGID?: string | null
          shopifyPostedDate?: string | null
          shopifyResponse?: Json | null
          shops?: number | null
          usageCount?: number | null
        }
        Update: {
          carts?: number | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          datecreated?: string | null
          discountAmount?: number | null
          discountTitle?: string | null
          emailRestriction?: string | null
          expiryEndDate?: string | null
          expiryStartDate?: string | null
          id?: number
          minimumSubtotal?: number | null
          modifiedDate?: string | null
          offers?: number | null
          orders?: number | null
          programs?: number | null
          shopifyCodeEcho?: string | null
          shopifyCustomerGID?: string | null
          shopifyDiscountGID?: string | null
          shopifyPostedDate?: string | null
          shopifyResponse?: Json | null
          shops?: number | null
          usageCount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_carts_fkey"
            columns: ["carts"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "discounts_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "v_order_facts"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "discounts_programs_fkey"
            columns: ["programs"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      gdprconsumerreq: {
        Row: {
          consumers: number | null
          created_at: string
          customer_email: string | null
          customerGID: string | null
          id: number
          payload: Json | null
          reqeust_completed: string | null
          requested_date: string | null
          shop_domain: string | null
          shops: number | null
          status: string | null
        }
        Insert: {
          consumers?: number | null
          created_at?: string
          customer_email?: string | null
          customerGID?: string | null
          id?: number
          payload?: Json | null
          reqeust_completed?: string | null
          requested_date?: string | null
          shop_domain?: string | null
          shops?: number | null
          status?: string | null
        }
        Update: {
          consumers?: number | null
          created_at?: string
          customer_email?: string | null
          customerGID?: string | null
          id?: number
          payload?: Json | null
          reqeust_completed?: string | null
          requested_date?: string | null
          shop_domain?: string | null
          shops?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdprconsumerreq_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdprconsumerreq_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "gdprconsumerreq_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      gdprrequests: {
        Row: {
          consumers: number | null
          created_at: string
          created_by: string | null
          created_date: string | null
          customer_email: string | null
          customer_id: string | null
          customer_phone: string | null
          customerGID: string | null
          data_request_id: string | null
          id: number
          modified_date: string | null
          orders_requested: string | null
          orders_to_redact: string | null
          processed_at: string | null
          received_at: string | null
          request_type: string | null
          scheduled_for: string | null
          shop_domain: string | null
          shop_id: string | null
          shops: number | null
          topic: string | null
        }
        Insert: {
          consumers?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          customerGID?: string | null
          data_request_id?: string | null
          id?: number
          modified_date?: string | null
          orders_requested?: string | null
          orders_to_redact?: string | null
          processed_at?: string | null
          received_at?: string | null
          request_type?: string | null
          scheduled_for?: string | null
          shop_domain?: string | null
          shop_id?: string | null
          shops?: number | null
          topic?: string | null
        }
        Update: {
          consumers?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          customerGID?: string | null
          data_request_id?: string | null
          id?: number
          modified_date?: string | null
          orders_requested?: string | null
          orders_to_redact?: string | null
          processed_at?: string | null
          received_at?: string | null
          request_type?: string | null
          scheduled_for?: string | null
          shop_domain?: string | null
          shop_id?: string | null
          shops?: number | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdprrequests_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdprrequests_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "gdprrequests_shops_fkey"
            columns: ["shops"]
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
            referencedRelation: "shopifyUsers"
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
      offerAssignments: {
        Row: {
          assignedByUser: number | null
          assignedDate: string | null
          assignedUser: number | null
          completedDate: string | null
          id: number
          notes: string | null
          offers: number
          status: string | null
        }
        Insert: {
          assignedByUser?: number | null
          assignedDate?: string | null
          assignedUser?: number | null
          completedDate?: string | null
          id?: number
          notes?: string | null
          offers: number
          status?: string | null
        }
        Update: {
          assignedByUser?: number | null
          assignedDate?: string | null
          assignedUser?: number | null
          completedDate?: string | null
          id?: number
          notes?: string | null
          offers?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offerAssignments_assignedByUser_fkey"
            columns: ["assignedByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerAssignments_assignedUser_fkey"
            columns: ["assignedUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerAssignments_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offerMetrics: {
        Row: {
          created_at: string
          id: number
          shops: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          shops?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offerMetrics_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          approvedDate: string | null
          approvedDiscountPrice: number | null
          approvedItems: number | null
          approvedPrice: number | null
          approvedUnits: number | null
          assignedUser: number | null
          calendarWeek: number | null
          campaign: string | null
          campaignCode: string | null
          campaigns: number | null
          cartComposition: string | null
          cartItems: Json[] | null
          carts: number | null
          cartSampleID: number | null
          cartToken: string | null
          cartTotalPrice: number | null
          checkoutUrl: string | null
          consumerEmail: string | null
          consumerName: string | null
          consumers: number | null
          consumerSampleID: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          declinedDate: string | null
          discountCode: string | null
          discounts: number | null
          expiryEnd: string | null
          expiryMinutes: number | null
          expiryStart: string | null
          id: number
          items: number | null
          lastActivityByUser: number | null
          lastUserActivityDate: string | null
          modifiedDate: string | null
          offerDeclineDate: string | null
          offerDiscountPercent: number | null
          offerDiscountPrice: number | null
          offerPrice: number | null
          offerSampleID: number | null
          offerStatus: Database["public"]["Enums"]["offerStatus"] | null
          orders: number | null
          periods: number | null
          program: string | null
          programAcceptRate: number | null
          programCode: string | null
          programDeclineRate: number | null
          programs: number | null
          reviewedByUser: number | null
          reviewedDate: string | null
          shops: number | null
          tosCheckDate: string | null
          units: number | null
        }
        Insert: {
          approvedDate?: string | null
          approvedDiscountPrice?: number | null
          approvedItems?: number | null
          approvedPrice?: number | null
          approvedUnits?: number | null
          assignedUser?: number | null
          calendarWeek?: number | null
          campaign?: string | null
          campaignCode?: string | null
          campaigns?: number | null
          cartComposition?: string | null
          cartItems?: Json[] | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumerEmail?: string | null
          consumerName?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          declinedDate?: string | null
          discountCode?: string | null
          discounts?: number | null
          expiryEnd?: string | null
          expiryMinutes?: number | null
          expiryStart?: string | null
          id?: number
          items?: number | null
          lastActivityByUser?: number | null
          lastUserActivityDate?: string | null
          modifiedDate?: string | null
          offerDeclineDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerPrice?: number | null
          offerSampleID?: number | null
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          orders?: number | null
          periods?: number | null
          program?: string | null
          programAcceptRate?: number | null
          programCode?: string | null
          programDeclineRate?: number | null
          programs?: number | null
          reviewedByUser?: number | null
          reviewedDate?: string | null
          shops?: number | null
          tosCheckDate?: string | null
          units?: number | null
        }
        Update: {
          approvedDate?: string | null
          approvedDiscountPrice?: number | null
          approvedItems?: number | null
          approvedPrice?: number | null
          approvedUnits?: number | null
          assignedUser?: number | null
          calendarWeek?: number | null
          campaign?: string | null
          campaignCode?: string | null
          campaigns?: number | null
          cartComposition?: string | null
          cartItems?: Json[] | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumerEmail?: string | null
          consumerName?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          declinedDate?: string | null
          discountCode?: string | null
          discounts?: number | null
          expiryEnd?: string | null
          expiryMinutes?: number | null
          expiryStart?: string | null
          id?: number
          items?: number | null
          lastActivityByUser?: number | null
          lastUserActivityDate?: string | null
          modifiedDate?: string | null
          offerDeclineDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerPrice?: number | null
          offerSampleID?: number | null
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          orders?: number | null
          periods?: number | null
          program?: string | null
          programAcceptRate?: number | null
          programCode?: string | null
          programDeclineRate?: number | null
          programs?: number | null
          reviewedByUser?: number | null
          reviewedDate?: string | null
          shops?: number | null
          tosCheckDate?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_assignedUser_fkey"
            columns: ["assignedUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_campaigns_fkey"
            columns: ["campaigns"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_carts_fkey"
            columns: ["carts"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "offers_discounts_fkey"
            columns: ["discounts"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lastActivityByUser_fkey"
            columns: ["lastActivityByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_periods_fkey"
            columns: ["periods"]
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
            foreignKeyName: "offers_reviewedByUser_fkey"
            columns: ["reviewedByUser"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orderDetails: {
        Row: {
          allowDiscounts: number | null
          allowFinance: number | null
          allowOther: number | null
          allowShipping: number | null
          allowShrink: number | null
          created_at: string
          discountAllocation: number | null
          discountsTaken: number | null
          financeTaken: number | null
          id: number
          itemStatus: Database["public"]["Enums"]["itemStatus"] | null
          lineItemID: string | null
          marketAdjust: number | null
          orders: number | null
          product: number | null
          profitMarkup: number | null
          profitRetained: number | null
          sellPrice: number | null
          settlePrice: number | null
          shippingTaken: number | null
          shops: number | null
          shrinkTaken: number | null
          totalMarkup: number | null
          variantCOGS: number | null
          variantGID: string | null
          variantName: string | null
          variants: number | null
        }
        Insert: {
          allowDiscounts?: number | null
          allowFinance?: number | null
          allowOther?: number | null
          allowShipping?: number | null
          allowShrink?: number | null
          created_at?: string
          discountAllocation?: number | null
          discountsTaken?: number | null
          financeTaken?: number | null
          id?: number
          itemStatus?: Database["public"]["Enums"]["itemStatus"] | null
          lineItemID?: string | null
          marketAdjust?: number | null
          orders?: number | null
          product?: number | null
          profitMarkup?: number | null
          profitRetained?: number | null
          sellPrice?: number | null
          settlePrice?: number | null
          shippingTaken?: number | null
          shops?: number | null
          shrinkTaken?: number | null
          totalMarkup?: number | null
          variantCOGS?: number | null
          variantGID?: string | null
          variantName?: string | null
          variants?: number | null
        }
        Update: {
          allowDiscounts?: number | null
          allowFinance?: number | null
          allowOther?: number | null
          allowShipping?: number | null
          allowShrink?: number | null
          created_at?: string
          discountAllocation?: number | null
          discountsTaken?: number | null
          financeTaken?: number | null
          id?: number
          itemStatus?: Database["public"]["Enums"]["itemStatus"] | null
          lineItemID?: string | null
          marketAdjust?: number | null
          orders?: number | null
          product?: number | null
          profitMarkup?: number | null
          profitRetained?: number | null
          sellPrice?: number | null
          settlePrice?: number | null
          shippingTaken?: number | null
          shops?: number | null
          shrinkTaken?: number | null
          totalMarkup?: number | null
          variantCOGS?: number | null
          variantGID?: string | null
          variantName?: string | null
          variants?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orderDetails_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDetails_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "v_order_facts"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "orderDetails_product_fkey"
            columns: ["product"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDetails_variants_fkey"
            columns: ["variants"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orderDiscounts: {
        Row: {
          created_at: string
          discounts: number | null
          id: number
          orders: number | null
        }
        Insert: {
          created_at?: string
          discounts?: number | null
          id?: number
          orders?: number | null
        }
        Update: {
          created_at?: string
          discounts?: number | null
          id?: number
          orders?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orderDiscounts_discounts_fkey"
            columns: ["discounts"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDiscounts_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderDiscounts_orders_fkey"
            columns: ["orders"]
            isOneToOne: false
            referencedRelation: "v_order_facts"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelledAt: string | null
          cancelReason: string | null
          carts: number | null
          cartSampleID: number | null
          cartToken: string | null
          categoriesShopped: number | null
          checkoutToken: string | null
          consumers: number | null
          consumerSampleID: number | null
          discountCodes: Json | null
          discounts: number | null
          financialStatus: string | null
          fulfillmentStatus: string | null
          grossCOGS: number | null
          grossDiscounts: number | null
          grossFinanceCost: number | null
          grossItems: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number
          lineItems: Json | null
          modifiedDate: string | null
          netCOGS: number | null
          netDiscount: number | null
          netItems: number | null
          netSales: number | null
          netShippingSales: number | null
          netUnits: number | null
          norSales: number | null
          norShippingSales: number | null
          offers: number | null
          offerSampleID: number | null
          orderDate: string
          orderDateTime: string | null
          orderGID: string | null
          orderSampleID: number | null
          payload: Json | null
          paymentMethod: string | null
          returnCOGS: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnSales: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          salesChannel: string | null
          shopGID: string | null
          shopifyOrderId: string | null
          shops: number | null
          totalPrice: number | null
          totalTax: number | null
        }
        Insert: {
          cancelledAt?: string | null
          cancelReason?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          categoriesShopped?: number | null
          checkoutToken?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          discountCodes?: Json | null
          discounts?: number | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossFinanceCost?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lineItems?: Json | null
          modifiedDate?: string | null
          netCOGS?: number | null
          netDiscount?: number | null
          netItems?: number | null
          netSales?: number | null
          netShippingSales?: number | null
          netUnits?: number | null
          norSales?: number | null
          norShippingSales?: number | null
          offers?: number | null
          offerSampleID?: number | null
          orderDate?: string
          orderDateTime?: string | null
          orderGID?: string | null
          orderSampleID?: number | null
          payload?: Json | null
          paymentMethod?: string | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          salesChannel?: string | null
          shopGID?: string | null
          shopifyOrderId?: string | null
          shops?: number | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Update: {
          cancelledAt?: string | null
          cancelReason?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          categoriesShopped?: number | null
          checkoutToken?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          discountCodes?: Json | null
          discounts?: number | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossFinanceCost?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lineItems?: Json | null
          modifiedDate?: string | null
          netCOGS?: number | null
          netDiscount?: number | null
          netItems?: number | null
          netSales?: number | null
          netShippingSales?: number | null
          netUnits?: number | null
          norSales?: number | null
          norShippingSales?: number | null
          offers?: number | null
          offerSampleID?: number | null
          orderDate?: string
          orderDateTime?: string | null
          orderGID?: string | null
          orderSampleID?: number | null
          payload?: Json | null
          paymentMethod?: string | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnSales?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          salesChannel?: string | null
          shopGID?: string | null
          shopifyOrderId?: string | null
          shops?: number | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_carts_fkey"
            columns: ["carts"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "orders_discounts_fkey"
            columns: ["discounts"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          bbl_periods: string | null
          calendarDateEnd: string | null
          calendarDateStart: string | null
          calendarDayOfWeek: number | null
          calendarMNTH: string | null
          calendarMonth: number | null
          calendarQTR: string | null
          calendarQuarter: number | null
          calendarWeek: number | null
          calendarWK: string | null
          calendarWKDAY: string | null
          calendarYear: string | null
          created_at: string
          createDate: string | null
          createdby: string | null
          id: number
          modifiedDate: string | null
        }
        Insert: {
          bbl_periods?: string | null
          calendarDateEnd?: string | null
          calendarDateStart?: string | null
          calendarDayOfWeek?: number | null
          calendarMNTH?: string | null
          calendarMonth?: number | null
          calendarQTR?: string | null
          calendarQuarter?: number | null
          calendarWeek?: number | null
          calendarWK?: string | null
          calendarWKDAY?: string | null
          calendarYear?: string | null
          created_at?: string
          createDate?: string | null
          createdby?: string | null
          id?: number
          modifiedDate?: string | null
        }
        Update: {
          bbl_periods?: string | null
          calendarDateEnd?: string | null
          calendarDateStart?: string | null
          calendarDayOfWeek?: number | null
          calendarMNTH?: string | null
          calendarMonth?: number | null
          calendarQTR?: string | null
          calendarQuarter?: number | null
          calendarWeek?: number | null
          calendarWK?: string | null
          calendarWKDAY?: string | null
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
      productCategory: {
        Row: {
          categories: number | null
          created_at: string
          createDate: string | null
          id: number
          products: number | null
          shops: number | null
        }
        Insert: {
          categories?: number | null
          created_at?: string
          createDate?: string | null
          id?: number
          products?: number | null
          shops?: number | null
        }
        Update: {
          categories?: number | null
          created_at?: string
          createDate?: string | null
          id?: number
          products?: number | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productCategory_categories_fkey"
            columns: ["categories"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productCategory_products_fkey"
            columns: ["products"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productCategory_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: number | null
          comparePrice: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          description: string | null
          id: number
          imuPrice: number | null
          modifiedDate: string | null
          name: string | null
          productGID: string | null
          productID: string | null
          productImageURL: string | null
          regularPrice: number | null
          shops: number | null
          shortDescription: string | null
          type: string | null
        }
        Insert: {
          category?: number | null
          comparePrice?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          id?: number
          imuPrice?: number | null
          modifiedDate?: string | null
          name?: string | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          regularPrice?: number | null
          shops?: number | null
          shortDescription?: string | null
          type?: string | null
        }
        Update: {
          category?: number | null
          comparePrice?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          id?: number
          imuPrice?: number | null
          modifiedDate?: string | null
          name?: string | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          regularPrice?: number | null
          shops?: number | null
          shortDescription?: string | null
          type?: string | null
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
            foreignKeyName: "products_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      programGoals: {
        Row: {
          created_at: string
          goalMetric: Database["public"]["Enums"]["goalMetric"] | null
          goalType: Database["public"]["Enums"]["programGoal"]
          goalValue: number | null
          id: number
          program: number
          shops: number | null
        }
        Insert: {
          created_at?: string
          goalMetric?: Database["public"]["Enums"]["goalMetric"] | null
          goalType: Database["public"]["Enums"]["programGoal"]
          goalValue?: number | null
          id?: number
          program: number
          shops?: number | null
        }
        Update: {
          created_at?: string
          goalMetric?: Database["public"]["Enums"]["goalMetric"] | null
          goalType?: Database["public"]["Enums"]["programGoal"]
          goalValue?: number | null
          id?: number
          program?: number
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programgoals_program_fkey"
            columns: ["program"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programgoals_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      programMetrics: {
        Row: {
          created_at: string
          id: number
          programs: number | null
          shops: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          programs?: number | null
          shops?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          programs?: number | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programMetrics_programs_fkey"
            columns: ["programs"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programMetrics_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          acceptRate: number | null
          campaigns: number | null
          codePrefix: string | null
          combineOrderDiscounts: boolean | null
          combineProductDiscounts: boolean | null
          combineShippingDiscounts: boolean | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          declineRate: number | null
          description: string | null
          discountPrefix: string | null
          endDate: string | null
          expiryMinutes: number | null
          focus: Database["public"]["Enums"]["programFocus"] | null
          goals: Database["public"]["Enums"]["programGoal"] | null
          id: number
          isDefault: boolean | null
          modifiedDate: string | null
          name: string | null
          shops: number | null
          startDate: string | null
          status: Database["public"]["Enums"]["programStatus"]
          usageCount: number | null
        }
        Insert: {
          acceptRate?: number | null
          campaigns?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          createdByUser?: number | null
          declineRate?: number | null
          description?: string | null
          discountPrefix?: string | null
          endDate?: string | null
          expiryMinutes?: number | null
          focus?: Database["public"]["Enums"]["programFocus"] | null
          goals?: Database["public"]["Enums"]["programGoal"] | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          name?: string | null
          shops?: number | null
          startDate?: string | null
          status?: Database["public"]["Enums"]["programStatus"]
          usageCount?: number | null
        }
        Update: {
          acceptRate?: number | null
          campaigns?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          createdByUser?: number | null
          declineRate?: number | null
          description?: string | null
          discountPrefix?: string | null
          endDate?: string | null
          expiryMinutes?: number | null
          focus?: Database["public"]["Enums"]["programFocus"] | null
          goals?: Database["public"]["Enums"]["programGoal"] | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          name?: string | null
          shops?: number | null
          startDate?: string | null
          status?: Database["public"]["Enums"]["programStatus"]
          usageCount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_campaigns_fkey"
            columns: ["campaigns"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_shops_fkey"
            columns: ["shops"]
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
      rpc_versions: {
        Row: {
          file_path: string
          git_sha: string | null
          modified_at: string
          name: string
          notes: string | null
          updated_on: string | null
          version: number
        }
        Insert: {
          file_path: string
          git_sha?: string | null
          modified_at?: string
          name: string
          notes?: string | null
          updated_on?: string | null
          version: number
        }
        Update: {
          file_path?: string
          git_sha?: string | null
          modified_at?: string
          name?: string
          notes?: string | null
          updated_on?: string | null
          version?: number
        }
        Relationships: []
      }
      sessions: {
        Row: {
          accessToken: string | null
          accountOwner: boolean | null
          collaborator: boolean | null
          created_at: string
          email: string | null
          emailVerified: boolean | null
          expires: string | null
          firstName: string | null
          id: number
          isOnline: boolean | null
          lastName: string | null
          locale: string | null
          onlineAccessInfo: string | null
          scope: string | null
          sessionid: string | null
          shop: string | null
          shopId: string | null
          shops: number | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          accessToken?: string | null
          accountOwner?: boolean | null
          collaborator?: boolean | null
          created_at?: string
          email?: string | null
          emailVerified?: boolean | null
          expires?: string | null
          firstName?: string | null
          id?: number
          isOnline?: boolean | null
          lastName?: string | null
          locale?: string | null
          onlineAccessInfo?: string | null
          scope?: string | null
          sessionid?: string | null
          shop?: string | null
          shopId?: string | null
          shops?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          accessToken?: string | null
          accountOwner?: boolean | null
          collaborator?: boolean | null
          created_at?: string
          email?: string | null
          emailVerified?: boolean | null
          expires?: string | null
          firstName?: string | null
          id?: number
          isOnline?: boolean | null
          lastName?: string | null
          locale?: string | null
          onlineAccessInfo?: string | null
          scope?: string | null
          sessionid?: string | null
          shop?: string | null
          shopId?: string | null
          shops?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopauth: {
        Row: {
          accessToken: string | null
          createDate: string | null
          createdBy: string | null
          id: string
          modifiedDate: string | null
          shopGID: string | null
          shopifyScope: string | null
          shopName: string | null
          shops: number | null
        }
        Insert: {
          accessToken?: string | null
          createDate?: string | null
          createdBy?: string | null
          id: string
          modifiedDate?: string | null
          shopGID?: string | null
          shopifyScope?: string | null
          shopName?: string | null
          shops?: number | null
        }
        Update: {
          accessToken?: string | null
          createDate?: string | null
          createdBy?: string | null
          id?: string
          modifiedDate?: string | null
          shopGID?: string | null
          shopifyScope?: string | null
          shopName?: string | null
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopauth_shops_fkey"
            columns: ["shops"]
            isOneToOne: true
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
      shopBusinessInfo: {
        Row: {
          billingAddress1: string | null
          billingAddress2: string | null
          billingCity: string | null
          billingCountry: string | null
          billingPhone: string | null
          billingProvince: string | null
          billingZip: string | null
          brandName: string | null
          companyName: string | null
          contactEmail: string | null
          createdAt: string | null
          currencyCode: string | null
          customerEmail: string | null
          id: number
          lastFetchedAt: string | null
          legalName: string | null
          planName: string | null
          shopCreatedAt: string | null
          shopDomain: string
          shopOwnerEmail: string | null
          shopOwnerName: string | null
          shops: number | null
          timezone: string | null
          updatedAt: string | null
        }
        Insert: {
          billingAddress1?: string | null
          billingAddress2?: string | null
          billingCity?: string | null
          billingCountry?: string | null
          billingPhone?: string | null
          billingProvince?: string | null
          billingZip?: string | null
          brandName?: string | null
          companyName?: string | null
          contactEmail?: string | null
          createdAt?: string | null
          currencyCode?: string | null
          customerEmail?: string | null
          id?: number
          lastFetchedAt?: string | null
          legalName?: string | null
          planName?: string | null
          shopCreatedAt?: string | null
          shopDomain: string
          shopOwnerEmail?: string | null
          shopOwnerName?: string | null
          shops?: number | null
          timezone?: string | null
          updatedAt?: string | null
        }
        Update: {
          billingAddress1?: string | null
          billingAddress2?: string | null
          billingCity?: string | null
          billingCountry?: string | null
          billingPhone?: string | null
          billingProvince?: string | null
          billingZip?: string | null
          brandName?: string | null
          companyName?: string | null
          contactEmail?: string | null
          createdAt?: string | null
          currencyCode?: string | null
          customerEmail?: string | null
          id?: number
          lastFetchedAt?: string | null
          legalName?: string | null
          planName?: string | null
          shopCreatedAt?: string | null
          shopDomain?: string
          shopOwnerEmail?: string | null
          shopOwnerName?: string | null
          shops?: number | null
          timezone?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopBusinessInfo_shops_fkey"
            columns: ["shops"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyCheckouts: {
        Row: {
          cartToken: string | null
          consumers: number | null
          created_at: string
          createDate: string | null
          currency: string | null
          discountCodes: Json | null
          email: string | null
          id: number
          inserted_at: string | null
          lineItems: Json | null
          modifiedDate: string | null
          offers: number | null
          payload: Json
          shopDomain: string | null
          shopifyCheckoutId: string | null
          shops: number | null
          token: string | null
          totalPrice: number | null
          totalTax: number | null
        }
        Insert: {
          cartToken?: string | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          currency?: string | null
          discountCodes?: Json | null
          email?: string | null
          id?: number
          inserted_at?: string | null
          lineItems?: Json | null
          modifiedDate?: string | null
          offers?: number | null
          payload: Json
          shopDomain?: string | null
          shopifyCheckoutId?: string | null
          shops?: number | null
          token?: string | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Update: {
          cartToken?: string | null
          consumers?: number | null
          created_at?: string
          createDate?: string | null
          currency?: string | null
          discountCodes?: Json | null
          email?: string | null
          id?: number
          inserted_at?: string | null
          lineItems?: Json | null
          modifiedDate?: string | null
          offers?: number | null
          payload?: Json
          shopDomain?: string | null
          shopifyCheckoutId?: string | null
          shops?: number | null
          token?: string | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkouts_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "checkouts_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkouts_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyOrderDetails: {
        Row: {
          cogs_total: number | null
          cogs_unit: number | null
          consumers: number | null
          discount_allocations: Json | null
          discount_amount: number | null
          duties: Json | null
          duty_amount: number | null
          grams: number | null
          gross_line_revenue: number | null
          id: number
          inserted_at: string
          is_cancelled: boolean | null
          is_refunded: boolean | null
          line_item_id: number
          margin_amount: number | null
          margin_amount_with_ship: number | null
          margin_pct: number | null
          margin_pct_with_ship: number | null
          net_line_revenue: number | null
          net_line_with_shipping: number | null
          offers: number | null
          order_id: number
          pre_tax_price: number | null
          price: number | null
          product_id: number | null
          product_type: string | null
          quantity: number | null
          raw_fulfillments: Json | null
          raw_line_item: Json
          raw_shipping_lines: Json | null
          requires_shipping: boolean | null
          shipping_cogs_alloc: number | null
          shipping_discount_alloc: number | null
          shipping_revenue_alloc: number | null
          shipping_tax_alloc: number | null
          shops: number
          sku: string | null
          tax_amount: number | null
          tax_lines: Json | null
          title: string | null
          total_discount: number | null
          updated_at_supabase: string
          variant_id: number | null
          variant_title: string | null
          vendor: string | null
        }
        Insert: {
          cogs_total?: number | null
          cogs_unit?: number | null
          consumers?: number | null
          discount_allocations?: Json | null
          discount_amount?: number | null
          duties?: Json | null
          duty_amount?: number | null
          grams?: number | null
          gross_line_revenue?: number | null
          id?: number
          inserted_at?: string
          is_cancelled?: boolean | null
          is_refunded?: boolean | null
          line_item_id: number
          margin_amount?: number | null
          margin_amount_with_ship?: number | null
          margin_pct?: number | null
          margin_pct_with_ship?: number | null
          net_line_revenue?: number | null
          net_line_with_shipping?: number | null
          offers?: number | null
          order_id: number
          pre_tax_price?: number | null
          price?: number | null
          product_id?: number | null
          product_type?: string | null
          quantity?: number | null
          raw_fulfillments?: Json | null
          raw_line_item: Json
          raw_shipping_lines?: Json | null
          requires_shipping?: boolean | null
          shipping_cogs_alloc?: number | null
          shipping_discount_alloc?: number | null
          shipping_revenue_alloc?: number | null
          shipping_tax_alloc?: number | null
          shops: number
          sku?: string | null
          tax_amount?: number | null
          tax_lines?: Json | null
          title?: string | null
          total_discount?: number | null
          updated_at_supabase?: string
          variant_id?: number | null
          variant_title?: string | null
          vendor?: string | null
        }
        Update: {
          cogs_total?: number | null
          cogs_unit?: number | null
          consumers?: number | null
          discount_allocations?: Json | null
          discount_amount?: number | null
          duties?: Json | null
          duty_amount?: number | null
          grams?: number | null
          gross_line_revenue?: number | null
          id?: number
          inserted_at?: string
          is_cancelled?: boolean | null
          is_refunded?: boolean | null
          line_item_id?: number
          margin_amount?: number | null
          margin_amount_with_ship?: number | null
          margin_pct?: number | null
          margin_pct_with_ship?: number | null
          net_line_revenue?: number | null
          net_line_with_shipping?: number | null
          offers?: number | null
          order_id?: number
          pre_tax_price?: number | null
          price?: number | null
          product_id?: number | null
          product_type?: string | null
          quantity?: number | null
          raw_fulfillments?: Json | null
          raw_line_item?: Json
          raw_shipping_lines?: Json | null
          requires_shipping?: boolean | null
          shipping_cogs_alloc?: number | null
          shipping_discount_alloc?: number | null
          shipping_revenue_alloc?: number | null
          shipping_tax_alloc?: number | null
          shops?: number
          sku?: string | null
          tax_amount?: number | null
          tax_lines?: Json | null
          title?: string | null
          total_discount?: number | null
          updated_at_supabase?: string
          variant_id?: number | null
          variant_title?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopifyOrderDetails_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyOrders: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          current_total_price: number | null
          customer: Json | null
          email: string | null
          financial_status: string | null
          fulfillment_status: string | null
          fulfillments: Json | null
          id: number
          inserted_at: string
          line_items: Json | null
          order_id: number | null
          presentment_currency: string | null
          processed_at: string | null
          raw_payload: Json
          shipping_address: Json | null
          shipping_lines: Json | null
          shops: number
          subtotal_price: number | null
          total_price: number | null
          total_tax: number | null
          updated_at: string | null
          updated_at_supabase: string
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_total_price?: number | null
          customer?: Json | null
          email?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          fulfillments?: Json | null
          id: number
          inserted_at?: string
          line_items?: Json | null
          order_id?: number | null
          presentment_currency?: string | null
          processed_at?: string | null
          raw_payload: Json
          shipping_address?: Json | null
          shipping_lines?: Json | null
          shops: number
          subtotal_price?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string | null
          updated_at_supabase?: string
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_total_price?: number | null
          customer?: Json | null
          email?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          fulfillments?: Json | null
          id?: number
          inserted_at?: string
          line_items?: Json | null
          order_id?: number | null
          presentment_currency?: string | null
          processed_at?: string | null
          raw_payload?: Json
          shipping_address?: Json | null
          shipping_lines?: Json | null
          shops?: number
          subtotal_price?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string | null
          updated_at_supabase?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopifyOrders_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyRefundDetails: {
        Row: {
          id: number
          inserted_at: string
          line_item_id: number
          order_id: number
          product_type: string | null
          quantity: number
          raw_refund_line: Json
          refund_cogs: number
          refund_discount: number
          refund_duty: number
          refund_gross: number
          refund_id: number
          refund_tax: number
          requires_shipping: boolean | null
          shops: number
        }
        Insert: {
          id?: number
          inserted_at?: string
          line_item_id: number
          order_id: number
          product_type?: string | null
          quantity: number
          raw_refund_line: Json
          refund_cogs: number
          refund_discount: number
          refund_duty: number
          refund_gross: number
          refund_id: number
          refund_tax: number
          requires_shipping?: boolean | null
          shops: number
        }
        Update: {
          id?: number
          inserted_at?: string
          line_item_id?: number
          order_id?: number
          product_type?: string | null
          quantity?: number
          raw_refund_line?: Json
          refund_cogs?: number
          refund_discount?: number
          refund_duty?: number
          refund_gross?: number
          refund_id?: number
          refund_tax?: number
          requires_shipping?: boolean | null
          shops?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopifyRefundDetails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyRefundDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyRefundShipping: {
        Row: {
          id: number
          order_id: number
          raw_refund: Json
          refund_id: number
          ship_refund_cost: number
          ship_refund_sales: number
          shops: number
        }
        Insert: {
          id?: number
          order_id: number
          raw_refund: Json
          refund_id: number
          ship_refund_cost: number
          ship_refund_sales: number
          shops: number
        }
        Update: {
          id?: number
          order_id?: number
          raw_refund?: Json
          refund_id?: number
          ship_refund_cost?: number
          ship_refund_sales?: number
          shops?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopifyRefundShipping_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyRefundShipping_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyUserActivity: {
        Row: {
          actionType: string
          created_at: string | null
          details: Json | null
          entityID: number
          entityType: string
          id: number
          shopifyUsers: number
          shops: number
        }
        Insert: {
          actionType: string
          created_at?: string | null
          details?: Json | null
          entityID: number
          entityType: string
          id?: number
          shopifyUsers: number
          shops: number
        }
        Update: {
          actionType?: string
          created_at?: string | null
          details?: Json | null
          entityID?: number
          entityType?: string
          id?: number
          shopifyUsers?: number
          shops?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopifyUserActivity_shopifyUsers_fkey"
            columns: ["shopifyUsers"]
            isOneToOne: false
            referencedRelation: "shopifyUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyUserActivity_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyUsers: {
        Row: {
          created_at: string
          createDate: string | null
          dashboardPrefs: Json | null
          displayName: string | null
          email: string | null
          emailConfirmed: boolean | null
          firstLogin: string | null
          firstName: string | null
          hsContactID: string | null
          id: number
          isActive: boolean | null
          lastLogin: string | null
          lastName: string | null
          modifiedDate: string | null
          notificationPref: Json | null
          onboardingCampaign: string | null
          onboardingstart: boolean | null
          phone: string | null
          profilePicture: string | null
          shops: number | null
          userid: string | null
          userRole: Database["public"]["Enums"]["shopRoles"] | null
        }
        Insert: {
          created_at?: string
          createDate?: string | null
          dashboardPrefs?: Json | null
          displayName?: string | null
          email?: string | null
          emailConfirmed?: boolean | null
          firstLogin?: string | null
          firstName?: string | null
          hsContactID?: string | null
          id?: number
          isActive?: boolean | null
          lastLogin?: string | null
          lastName?: string | null
          modifiedDate?: string | null
          notificationPref?: Json | null
          onboardingCampaign?: string | null
          onboardingstart?: boolean | null
          phone?: string | null
          profilePicture?: string | null
          shops?: number | null
          userid?: string | null
          userRole?: Database["public"]["Enums"]["shopRoles"] | null
        }
        Update: {
          created_at?: string
          createDate?: string | null
          dashboardPrefs?: Json | null
          displayName?: string | null
          email?: string | null
          emailConfirmed?: boolean | null
          firstLogin?: string | null
          firstName?: string | null
          hsContactID?: string | null
          id?: number
          isActive?: boolean | null
          lastLogin?: string | null
          lastName?: string | null
          modifiedDate?: string | null
          notificationPref?: Json | null
          onboardingCampaign?: string | null
          onboardingstart?: boolean | null
          phone?: string | null
          profilePicture?: string | null
          shops?: number | null
          userid?: string | null
          userRole?: Database["public"]["Enums"]["shopRoles"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shopifyUsers_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shopifyvariantproductmap: {
        Row: {
          created_date: string | null
          id: number
          imageURL: string | null
          index_product_id_idx: number | null
          productGID: string
          productID: number
          productImageURL: string | null
          productTitle: string | null
          variantCompareAtPrice: number | null
          variantGID: string
          variantID: string
          variantImageURL: string | null
          variantPrice: number | null
        }
        Insert: {
          created_date?: string | null
          id?: number
          imageURL?: string | null
          index_product_id_idx?: number | null
          productGID: string
          productID: number
          productImageURL?: string | null
          productTitle?: string | null
          variantCompareAtPrice?: number | null
          variantGID: string
          variantID: string
          variantImageURL?: string | null
          variantPrice?: number | null
        }
        Update: {
          created_date?: string | null
          id?: number
          imageURL?: string | null
          index_product_id_idx?: number | null
          productGID?: string
          productID?: number
          productImageURL?: string | null
          productTitle?: string | null
          variantCompareAtPrice?: number | null
          variantGID?: string
          variantID?: string
          variantImageURL?: string | null
          variantPrice?: number | null
        }
        Relationships: []
      }
      shops: {
        Row: {
          bbl_merchants: string | null
          brandName: string | null
          commercePlatform: string | null
          companyAddress: Json | null
          companyLegalName: string | null
          companyPhone: string | null
          createDate: string
          createdBy: string | null
          id: number
          installedDate: string | null
          isActive: boolean | null
          modifiedDate: string | null
          shopAuth: string | null
          shopCurrency: string | null
          shopDomain: string | null
          shopsGID: string | null
          signupValidationToken: string | null
          storeLogo: string | null
          uninstalledDate: string | null
        }
        Insert: {
          bbl_merchants?: string | null
          brandName?: string | null
          commercePlatform?: string | null
          companyAddress?: Json | null
          companyLegalName?: string | null
          companyPhone?: string | null
          createDate?: string
          createdBy?: string | null
          id?: number
          installedDate?: string | null
          isActive?: boolean | null
          modifiedDate?: string | null
          shopAuth?: string | null
          shopCurrency?: string | null
          shopDomain?: string | null
          shopsGID?: string | null
          signupValidationToken?: string | null
          storeLogo?: string | null
          uninstalledDate?: string | null
        }
        Update: {
          bbl_merchants?: string | null
          brandName?: string | null
          commercePlatform?: string | null
          companyAddress?: Json | null
          companyLegalName?: string | null
          companyPhone?: string | null
          createDate?: string
          createdBy?: string | null
          id?: number
          installedDate?: string | null
          isActive?: boolean | null
          modifiedDate?: string | null
          shopAuth?: string | null
          shopCurrency?: string | null
          shopDomain?: string | null
          shopsGID?: string | null
          signupValidationToken?: string | null
          storeLogo?: string | null
          uninstalledDate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_shopAuth_fkey"
            columns: ["shopAuth"]
            isOneToOne: false
            referencedRelation: "shopauth"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptionAttempts: {
        Row: {
          created_at: string
          id: number
          insertedAt: string | null
          occurredAt: string | null
          orderID: string | null
          payload: Json
          shopDomain: string | null
          shopifyAttemptId: string | null
          shopifySubscriptionGID: string | null
          shops: number | null
          status: string | null
          subscriptions: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          insertedAt?: string | null
          occurredAt?: string | null
          orderID?: string | null
          payload: Json
          shopDomain?: string | null
          shopifyAttemptId?: string | null
          shopifySubscriptionGID?: string | null
          shops?: number | null
          status?: string | null
          subscriptions?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          insertedAt?: string | null
          occurredAt?: string | null
          orderID?: string | null
          payload?: Json
          shopDomain?: string | null
          shopifyAttemptId?: string | null
          shopifySubscriptionGID?: string | null
          shops?: number | null
          status?: string | null
          subscriptions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptionAttempts_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptionAttempts_subscriptions_fkey"
            columns: ["subscriptions"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptionBilling: {
        Row: {
          cappedAmount: number | null
          created_at: string
          currentPeriodEnd: string | null
          id: number
          inserted_at: string | null
          modifiedDate: string | null
          name: string | null
          payload: Json
          shopDomain: string | null
          shopifiyBillingId: string | null
          shops: number | null
          status: string | null
          subscriptions: number | null
          usageBalance: number | null
        }
        Insert: {
          cappedAmount?: number | null
          created_at?: string
          currentPeriodEnd?: string | null
          id?: number
          inserted_at?: string | null
          modifiedDate?: string | null
          name?: string | null
          payload: Json
          shopDomain?: string | null
          shopifiyBillingId?: string | null
          shops?: number | null
          status?: string | null
          subscriptions?: number | null
          usageBalance?: number | null
        }
        Update: {
          cappedAmount?: number | null
          created_at?: string
          currentPeriodEnd?: string | null
          id?: number
          inserted_at?: string | null
          modifiedDate?: string | null
          name?: string | null
          payload?: Json
          shopDomain?: string | null
          shopifiyBillingId?: string | null
          shops?: number | null
          status?: string | null
          subscriptions?: number | null
          usageBalance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptionBilling_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptionBilling_subscriptions_fkey"
            columns: ["subscriptions"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          apiError: string | null
          cappedAmount: number | null
          confirmationURL: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          currentPeriodEnd: string | null
          endDate: string | null
          hsDealId: string | null
          id: number
          inserted_at: string | null
          interval: string | null
          modifiedDate: string | null
          name: string | null
          payload: Json
          plan: string | null
          plans: number | null
          renewalAutomatically: boolean | null
          shop: number | null
          shopDomain: string | null
          shopifyCustomerGID: string | null
          shopifySubscriptionId: string | null
          startDate: string | null
          status: string | null
          subscriptionGID: string | null
          trialStartDate: string | null
          usageBalance: number | null
          usedFreeTrial: boolean | null
          user: string | null
        }
        Insert: {
          apiError?: string | null
          cappedAmount?: number | null
          confirmationURL?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currentPeriodEnd?: string | null
          endDate?: string | null
          hsDealId?: string | null
          id?: number
          inserted_at?: string | null
          interval?: string | null
          modifiedDate?: string | null
          name?: string | null
          payload: Json
          plan?: string | null
          plans?: number | null
          renewalAutomatically?: boolean | null
          shop?: number | null
          shopDomain?: string | null
          shopifyCustomerGID?: string | null
          shopifySubscriptionId?: string | null
          startDate?: string | null
          status?: string | null
          subscriptionGID?: string | null
          trialStartDate?: string | null
          usageBalance?: number | null
          usedFreeTrial?: boolean | null
          user?: string | null
        }
        Update: {
          apiError?: string | null
          cappedAmount?: number | null
          confirmationURL?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currentPeriodEnd?: string | null
          endDate?: string | null
          hsDealId?: string | null
          id?: number
          inserted_at?: string | null
          interval?: string | null
          modifiedDate?: string | null
          name?: string | null
          payload?: Json
          plan?: string | null
          plans?: number | null
          renewalAutomatically?: boolean | null
          shop?: number | null
          shopDomain?: string | null
          shopifyCustomerGID?: string | null
          shopifySubscriptionId?: string | null
          startDate?: string | null
          status?: string | null
          subscriptionGID?: string | null
          trialStartDate?: string | null
          usageBalance?: number | null
          usedFreeTrial?: boolean | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plans_fkey"
            columns: ["plans"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_shop_fkey"
            columns: ["shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_debug: {
        Row: {
          created_at: string | null
          id: number
          message: string | null
          session_data: Json | null
          trigger_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          message?: string | null
          session_data?: Json | null
          trigger_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string | null
          session_data?: Json | null
          trigger_name?: string | null
        }
        Relationships: []
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
      variantPricing: {
        Row: {
          allowanceDiscounts: number | null
          allowanceFinance: number | null
          allowanceShipping: number | null
          allowanceShrink: number | null
          approvedByUser: number | null
          builderPrice: number | null
          createDate: string | null
          createdByUser: number | null
          createdByUserName: string | null
          currency: string | null
          id: number
          isPublished: boolean | null
          itemCost: number | null
          marketAdjustment: number | null
          modifiedDate: string
          notes: string | null
          priceBuilder: Json | null
          productID: string
          profitMarkup: number | null
          publishedDate: string | null
          publishedPrice: number | null
          shops: number
          source: string | null
          updatedBy: string | null
          variantID: string
          variants: number
          version: number | null
        }
        Insert: {
          allowanceDiscounts?: number | null
          allowanceFinance?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          approvedByUser?: number | null
          builderPrice?: number | null
          createDate?: string | null
          createdByUser?: number | null
          createdByUserName?: string | null
          currency?: string | null
          id?: number
          isPublished?: boolean | null
          itemCost?: number | null
          marketAdjustment?: number | null
          modifiedDate?: string
          notes?: string | null
          priceBuilder?: Json | null
          productID: string
          profitMarkup?: number | null
          publishedDate?: string | null
          publishedPrice?: number | null
          shops: number
          source?: string | null
          updatedBy?: string | null
          variantID: string
          variants: number
          version?: number | null
        }
        Update: {
          allowanceDiscounts?: number | null
          allowanceFinance?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          approvedByUser?: number | null
          builderPrice?: number | null
          createDate?: string | null
          createdByUser?: number | null
          createdByUserName?: string | null
          currency?: string | null
          id?: number
          isPublished?: boolean | null
          itemCost?: number | null
          marketAdjustment?: number | null
          modifiedDate?: string
          notes?: string | null
          priceBuilder?: Json | null
          productID?: string
          profitMarkup?: number | null
          publishedDate?: string | null
          publishedPrice?: number | null
          shops?: number
          source?: string | null
          updatedBy?: string | null
          variantID?: string
          variants?: number
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variantpricing_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variantpricing_variants_fkey"
            columns: ["variants"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          categories: Json | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          imageURL: string | null
          inventoryLevel: number | null
          isDefault: boolean | null
          itemCost: number | null
          modifiedDate: string | null
          name: string | null
          pricing: number | null
          productID: string | null
          products: number | null
          shopifyPrice: number | null
          shops: number | null
          variantGID: string | null
          variantID: string | null
          variantSKU: string | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imageURL?: string | null
          inventoryLevel?: number | null
          isDefault?: boolean | null
          itemCost?: number | null
          modifiedDate?: string | null
          name?: string | null
          pricing?: number | null
          productID?: string | null
          products?: number | null
          shopifyPrice?: number | null
          shops?: number | null
          variantGID?: string | null
          variantID?: string | null
          variantSKU?: string | null
        }
        Update: {
          categories?: Json | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          imageURL?: string | null
          inventoryLevel?: number | null
          isDefault?: boolean | null
          itemCost?: number | null
          modifiedDate?: string | null
          name?: string | null
          pricing?: number | null
          productID?: string | null
          products?: number | null
          shopifyPrice?: number | null
          shops?: number | null
          variantGID?: string | null
          variantID?: string | null
          variantSKU?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_pricing_fkey"
            columns: ["pricing"]
            isOneToOne: false
            referencedRelation: "variantPricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_products_fkey"
            columns: ["products"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      consumerShop12m: {
        Row: {
          consumers: number | null
          created_at: string | null
          grossCOGS: number | null
          grossDiscounts: number | null
          grossItems: number | null
          grossReturns: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number | null
          lastPurchaseDate: string | null
          netItems: number | null
          netSales: number | null
          netShippingSales: number | null
          netUnits: number | null
          norSales: number | null
          offersMade: number | null
          orders: number | null
          returnCOGS: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          shops: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerShop_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_campaign_key_measures_daily: {
        Row: {
          aov: number | null
          campaigns_id: number | null
          consumers: number | null
          discount_rate: number | null
          gross_discounts: number | null
          gross_profit: number | null
          gross_profit_net_of_shipping: number | null
          gross_sales: number | null
          gross_units: number | null
          net_cogs: number | null
          net_discount_rate: number | null
          net_sales: number | null
          net_units: number | null
          netaov: number | null
          netupt: number | null
          nor_per_customer: number | null
          nor_sales: number | null
          order_day: string | null
          orders: number | null
          orders_per_customer: number | null
          return_rate: number | null
          returns: number | null
          shops: number | null
          upt: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_order_facts: {
        Row: {
          aur: number | null
          cogs_items: number | null
          cogs_items_plus_ship: number | null
          consumers: number | null
          gross_discounts: number | null
          gross_sales: number | null
          nor_sales: number | null
          nor_with_shipping: number | null
          order_day: string | null
          order_gross: number | null
          order_id: number | null
          order_nor: number | null
          shops: number | null
          units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "orders_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_order_key_measures: {
        Row: {
          aur: number | null
          gross_discounts: number | null
          gross_items: number | null
          gross_profit: number | null
          gross_profit_net_of_shipping: number | null
          gross_sales: number | null
          gross_units: number | null
          "Net COGS": number | null
          net_cogs: number | null
          net_items: number | null
          net_sales: number | null
          net_shipping_returns: number | null
          net_shipping_sales: number | null
          net_units: number | null
          netaur: number | null
          nor_sales: number | null
          order_gross_for_aov: number | null
          order_id: number | null
          order_net_for_aov: number | null
          return_items: number | null
          return_shipping_cost: number | null
          return_shipping_sales: number | null
          return_units: number | null
          returns: number | null
          shipping_cost: number | null
          shipping_sales: number | null
          shops: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopifyOrderDetails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_order_kpis: {
        Row: {
          gross_cogs: number | null
          gross_discounts: number | null
          gross_items: number | null
          gross_product_sales: number | null
          gross_profit: number | null
          gross_profit_net_of_shipping: number | null
          gross_sales: number | null
          gross_service_sales: number | null
          gross_units: number | null
          net_cogs: number | null
          net_items: number | null
          net_sales: number | null
          net_shipping_returns: number | null
          net_shipping_sales: number | null
          net_units: number | null
          nor_sales: number | null
          order_id: number | null
          return_cogs: number | null
          return_items: number | null
          return_shipping_cost: number | null
          return_shipping_sales: number | null
          return_units: number | null
          returns_refunds_cancels_sales: number | null
          shipping_cost: number | null
          shipping_sales: number | null
          shops: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopifyOrderDetails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_orders_lineage_measures: {
        Row: {
          aur: number | null
          campaigns_id: number | null
          consumers: number | null
          gross_discounts: number | null
          gross_items: number | null
          gross_profit: number | null
          gross_profit_net_of_shipping: number | null
          gross_sales: number | null
          gross_units: number | null
          is_offer_derived: boolean | null
          "Net COGS": number | null
          net_cogs: number | null
          net_items: number | null
          net_sales: number | null
          net_shipping_returns: number | null
          net_shipping_sales: number | null
          net_units: number | null
          netaur: number | null
          nor_sales: number | null
          order_day: string | null
          order_gross_for_aov: number | null
          order_id: number | null
          order_net_for_aov: number | null
          programs_id: number | null
          return_items: number | null
          return_shipping_cost: number | null
          return_shipping_sales: number | null
          return_units: number | null
          returns: number | null
          shipping_cost: number | null
          shipping_sales: number | null
          shops: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_programs_fkey"
            columns: ["programs_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_consumers_fkey"
            columns: ["consumers"]
            isOneToOne: false
            referencedRelation: "consumerShop12m"
            referencedColumns: ["consumers"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopifyOrders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_program_key_measures_daily: {
        Row: {
          aov: number | null
          consumers: number | null
          discount_rate: number | null
          gross_discounts: number | null
          gross_profit: number | null
          gross_profit_net_of_shipping: number | null
          gross_sales: number | null
          gross_units: number | null
          net_cogs: number | null
          net_discount_rate: number | null
          net_sales: number | null
          net_units: number | null
          netaov: number | null
          netupt: number | null
          nor_per_customer: number | null
          nor_sales: number | null
          order_day: string | null
          orders: number | null
          orders_per_customer: number | null
          programs_id: number | null
          return_rate: number | null
          returns: number | null
          shops: number | null
          upt: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_programs_fkey"
            columns: ["programs_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopifyOrderDetails_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rpc_versions: {
        Row: {
          file_path: string | null
          git_sha: string | null
          modified_at: string | null
          name: string | null
          notes: string | null
          updated_on: string | null
          version: number | null
        }
        Insert: {
          file_path?: string | null
          git_sha?: string | null
          modified_at?: string | null
          name?: string | null
          notes?: string | null
          updated_on?: string | null
          version?: number | null
        }
        Update: {
          file_path?: string | null
          git_sha?: string | null
          modified_at?: string | null
          name?: string | null
          notes?: string | null
          updated_on?: string | null
          version?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_counter_performance_by_portfolio: {
        Args: { p_end_date: string; p_shop_id: number; p_start_date: string }
        Returns: {
          acceptance_rate: number
          avg_discount_percent: number
          avg_expected_value: number
          avg_margin_percent: number
          portfolio: string
          total_accepted: number
          total_revenue_cents: number
          total_sent: number
        }[]
      }
      analyze_counter_performance_by_type: {
        Args: { p_end_date: string; p_shop_id: number; p_start_date: string }
        Returns: {
          acceptance_rate: number
          avg_discount_cents: number
          avg_expected_value: number
          avg_margin_percent: number
          counter_type: string
          total_accepted: number
          total_margin_cents: number
          total_rejected: number
          total_revenue_cents: number
          total_sent: number
        }[]
      }
      analyze_counter_performance_by_user: {
        Args: { p_end_date: string; p_shop_id: number; p_start_date: string }
        Returns: {
          acceptance_rate: number
          avg_expected_value: number
          total_accepted: number
          total_margin_cents: number
          total_sent: number
          user_id: number
          user_name: string
        }[]
      }
      calculate_shop_portfolios: {
        Args: { p_as_of_date?: string; p_shop_id: number }
        Returns: {
          consumer_id: number
          first_purchase_date: string
          orders_cy: number
          orders_py: number
          portfolio: string
          quintile_cy: number
          quintile_py: number
          sales_cy: number
          sales_py: number
        }[]
      }
      calculate_super_quintiles: {
        Args: { p_as_of_date?: string; p_shop_id: number }
        Returns: {
          consumer_id: number
          orders_cy: number
          orders_py: number
          sales_cy: number
          sales_py: number
          super_quintile_cy: number
          super_quintile_py: number
        }[]
      }
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
      delete_shop_campaign_cascade: {
        Args: { p_campaign_id: number; p_shops_id: number }
        Returns: Json
      }
      delete_shop_campaign_program: {
        Args: { p_program_id: number; p_shops_id: number }
        Returns: Json
      }
      flag_order_details_status: {
        Args: {
          _is_cancelled: boolean
          _is_refunded: boolean
          _order_id: number
        }
        Returns: undefined
      }
      "gdpr-consumer-request": {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      "gdpr-request-foreign-keys": {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      "gdpr-shop-redact": {
        Args: { shopid: number }
        Returns: Json
      }
      get_all_enums: {
        Args: { enum_schema?: string; enum_types?: string[] }
        Returns: Json
      }
      get_shop_campaign_edit: {
        Args: { p_campaigns_id: number; p_shops_id: number }
        Returns: Json
      }
      get_shop_campaign_single_program: {
        Args: { p_programs_id: number; p_shops_id: number }
        Returns: Json
      }
      get_shop_campaigns: {
        Args: { p_shops_id: number }
        Returns: Json[]
      }
      get_shop_cart_items: {
        Args: { p_carts_id: number; p_shops_id: number }
        Returns: Json
      }
      get_shop_carts: {
        Args: {
          p_limit?: number
          p_months_back?: number
          p_page?: number
          p_shops_id: number
          p_statuses?: Database["public"]["Enums"]["cartStatus"][]
        }
        Returns: {
          rows: Json
          total_count: number
        }[]
      }
      get_shop_counter_offer_analytics: {
        Args: { p_end_date: string; p_shop_id: number; p_start_date: string }
        Returns: Json
      }
      get_shop_counter_offer_editor_data: {
        Args: {
          p_counter_offer_id?: number
          p_offers_id?: number
          p_shops_id: number
        }
        Returns: Json
      }
      get_shop_counter_offers: {
        Args: {
          p_limit?: number
          p_months_back?: number
          p_page?: number
          p_shops_id: number
          p_statuses?: Database["public"]["Enums"]["offerStatus"][]
        }
        Returns: {
          rows: Json
          total_count: number
        }[]
      }
      get_shop_counter_offers_for_offer: {
        Args: { p_offers_id: number; p_shops_id: number }
        Returns: {
          approvedAt: string | null
          approvedByUser: number | null
          confidenceScore: number | null
          consumerResponse: string | null
          consumerResponseDate: string | null
          counterConfig: Json | null
          counterOfferPrice: number
          counterReason: string | null
          counterTemplates: number | null
          counterType: string | null
          createDate: string | null
          createdByUser: number
          description: string | null
          estimatedMarginCents: number | null
          estimatedMarginPercent: number | null
          expectedMarginCents: number | null
          expectedRevenueCents: number | null
          expectedValueScore: number | null
          expirationDate: string | null
          finalAmountCents: number | null
          headline: string | null
          id: number
          internalNotes: string | null
          marginImpactCents: number | null
          modifiedDate: string | null
          offers: number
          offerStatus: Database["public"]["Enums"]["offerStatus"] | null
          originalMarginCents: number | null
          originalMarginPercent: number | null
          predictedAcceptanceProbability: number | null
          predictionFactors: Json | null
          requiresApproval: boolean | null
          shops: number
          strategyRationale: string | null
          totalDiscountCents: number | null
        }[]
      }
      get_shop_counter_templates: {
        Args: { p_shops_id: number }
        Returns: {
          accepted: number | null
          acceptRate: number | null
          category: string | null
          config: Json
          createDate: string | null
          createdByUser: number | null
          description: string | null
          headline: string | null
          id: number
          isActive: boolean | null
          isDefault: boolean | null
          maxCartValueCents: number | null
          maxDiscountPercent: number | null
          message: string | null
          minCartValueCents: number | null
          minMarginPercent: number | null
          modifiedDate: string | null
          name: string
          requiresApproval: boolean | null
          shops: number
          target: string[] | null
          type: string
          usage: number | null
        }[]
      }
      get_shop_dashboard: {
        Args: { p_shops_id: number }
        Returns: Json
      }
      get_shop_offers: {
        Args: {
          p_limit?: number
          p_months_back?: number
          p_page?: number
          p_shops_id: number
          p_statuses?: Database["public"]["Enums"]["offerStatus"][]
        }
        Returns: {
          rows: Json
          total_count: number
        }[]
      }
      get_shop_offers_by_status: {
        Args: {
          p_limit?: number
          p_months_back?: number
          p_page?: number
          p_shops_id: number
          p_statuses?: Database["public"]["Enums"]["offerStatus"][]
        }
        Returns: {
          rows: Json
          total_count: number
        }[]
      }
      get_shop_product_variants: {
        Args: {
          p_before_created_at?: string
          p_before_id?: number
          p_limit?: number
          p_months_back?: number
          p_page?: number
          p_shops_id: number
        }
        Returns: Json
      }
      get_shop_single_campaign: {
        Args: { p_campaigns_id: number; p_shops_id: number }
        Returns: {
          budget: number | null
          codePrefix: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          dates: Json | null
          description: string | null
          endDate: string | null
          goals: Json | null
          id: number
          isDefault: boolean
          modifiedDate: string | null
          name: string | null
          shops: number
          startDate: string | null
          status: Database["public"]["Enums"]["campaignStatus"]
        }
      }
      get_shop_single_cart: {
        Args: { p_carts_id: number; p_shops_id: number }
        Returns: Json
      }
      get_shop_single_offer: {
        Args: { p_offers_id: number; p_shops_id: number }
        Returns: Json
      }
      increment_counter_template_usage: {
        Args: { template_id: number }
        Returns: undefined
      }
      ingest_shopify_order: {
        Args: { _payload: Json; _shops_id: number }
        Returns: number
      }
      ingest_shopify_order_text: {
        Args: { _payload_json: string; _shops_id: number }
        Returns: number
      }
      jwt_shops_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_offer_evaluate_offers: {
        Args: { offersid: number }
        Returns: {
          cartsID: number
          consumersID: number
          offersID: number
          programsID: number
          shopsID: number
          status: string
        }[]
      }
      process_offer_shopify_discount: {
        Args: { discountsID: number }
        Returns: Json
      }
      process_offer_shopify_response: {
        Args: { discountsID: number; response: Json }
        Returns: undefined
      }
      process_offer_upsert_cartitems: {
        Args: {
          cartsID: number
          consumersID: number
          payload: Json
          shopsID: number
        }
        Returns: {
          inserted: number
          removed: number
          total_allowance_markup: number
          total_profit_markup: number
          updated: number
        }[]
      }
      process_offer_upsert_carts: {
        Args: { consumersID: number; payload: Json; shopsID: number }
        Returns: {
          cartsID: number
        }[]
      }
      process_offer_upsert_consumers: {
        Args: { payload: Json }
        Returns: {
          consumersID: number
          customerShopifyGID: string
          shopsID: number
        }[]
      }
      process_offer_upsert_discounts: {
        Args: { offersid: number }
        Returns: {
          code: string
          discountsID: number
        }[]
      }
      process_offer_upsert_offers: {
        Args: {
          cartsID: number
          consumersID: number
          payload: Json
          shopsID: number
        }
        Returns: {
          campaignsID: number
          offersID: number
          periodsID: number
          programsID: number
        }[]
      }
      refresh_shopify_order_slim: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      safe_num: {
        Args: { txt: string }
        Returns: number
      }
      safe_ts: {
        Args: { txt: string }
        Returns: string
      }
      save_shop_portfolio_measures: {
        Args: {
          p_as_of_date?: string
          p_period_type?: string
          p_shop_id: number
        }
        Returns: undefined
      }
      save_shop_portfolios: {
        Args: {
          p_as_of_date?: string
          p_period_type?: string
          p_shop_id: number
        }
        Returns: undefined
      }
      update_cart_detailed_markups: {
        Args: { cart_id: number }
        Returns: undefined
      }
      update_consumer_shop_ltv: {
        Args: { p_consumer_id?: number; p_shop_id: number }
        Returns: undefined
      }
      update_single_cart_summary: {
        Args: { cart_id: number }
        Returns: undefined
      }
      upsert_shop_campaign_programs: {
        Args: {
          p_accept_rate?: number
          p_campaigns_id: number
          p_code_prefix?: string
          p_combine_order_discounts?: boolean
          p_combine_product_discounts?: boolean
          p_combine_shipping_discounts?: boolean
          p_decline_rate?: number
          p_end_date?: string
          p_expiry_minutes?: number
          p_focus?: Database["public"]["Enums"]["programFocus"]
          p_is_default?: boolean
          p_name: string
          p_shops_id: number
          p_start_date?: string
          p_status?: Database["public"]["Enums"]["programStatus"]
        }
        Returns: {
          acceptRate: number | null
          campaigns: number | null
          codePrefix: string | null
          combineOrderDiscounts: boolean | null
          combineProductDiscounts: boolean | null
          combineShippingDiscounts: boolean | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          declineRate: number | null
          description: string | null
          discountPrefix: string | null
          endDate: string | null
          expiryMinutes: number | null
          focus: Database["public"]["Enums"]["programFocus"] | null
          goals: Database["public"]["Enums"]["programGoal"] | null
          id: number
          isDefault: boolean | null
          modifiedDate: string | null
          name: string | null
          shops: number | null
          startDate: string | null
          status: Database["public"]["Enums"]["programStatus"]
          usageCount: number | null
        }[]
      }
      upsert_shop_campaign_single_program: {
        Args: { p_payload?: Json; p_programs_id?: number; p_shops_id: number }
        Returns: {
          acceptRate: number | null
          campaigns: number | null
          codePrefix: string | null
          combineOrderDiscounts: boolean | null
          combineProductDiscounts: boolean | null
          combineShippingDiscounts: boolean | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          declineRate: number | null
          description: string | null
          discountPrefix: string | null
          endDate: string | null
          expiryMinutes: number | null
          focus: Database["public"]["Enums"]["programFocus"] | null
          goals: Database["public"]["Enums"]["programGoal"] | null
          id: number
          isDefault: boolean | null
          modifiedDate: string | null
          name: string | null
          shops: number | null
          startDate: string | null
          status: Database["public"]["Enums"]["programStatus"]
          usageCount: number | null
        }
      }
      upsert_shop_campaigns: {
        Args: {
          p_budget?: number
          p_code_prefix?: string
          p_description?: string
          p_end_date?: string
          p_goals?: Json
          p_is_default?: boolean
          p_name: string
          p_shops_id: number
          p_start_date?: string
          p_status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Returns: {
          budget: number | null
          codePrefix: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          createdByUser: number | null
          dates: Json | null
          description: string | null
          endDate: string | null
          goals: Json | null
          id: number
          isDefault: boolean
          modifiedDate: string | null
          name: string | null
          shops: number
          startDate: string | null
          status: Database["public"]["Enums"]["campaignStatus"]
        }[]
      }
      upsert_shop_counter_offer: {
        Args: {
          p_confidence_score: number
          p_counter_config: Json
          p_counter_offer_price: number
          p_counter_templates_id?: number
          p_counter_type: string
          p_created_by_user: number
          p_description: string
          p_estimated_margin_cents: number
          p_estimated_margin_percent: number
          p_expected_margin_cents: number
          p_expected_revenue_cents: number
          p_expected_value_score: number
          p_expires_at?: string
          p_headline: string
          p_internal_notes?: string
          p_margin_impact_cents: number
          p_offers_id: number
          p_original_margin_cents: number
          p_original_margin_percent: number
          p_predicted_acceptance_probability: number
          p_prediction_factors: Json
          p_reason?: string
          p_requires_approval?: boolean
          p_shops_id: number
          p_strategy_rationale?: string
          p_total_discount_cents: number
        }
        Returns: {
          approvedAt: string | null
          approvedByUser: number | null
          confidenceScore: number | null
          consumerResponse: string | null
          consumerResponseDate: string | null
          counterConfig: Json | null
          counterOfferPrice: number
          counterReason: string | null
          counterTemplates: number | null
          counterType: string | null
          createDate: string | null
          createdByUser: number
          description: string | null
          estimatedMarginCents: number | null
          estimatedMarginPercent: number | null
          expectedMarginCents: number | null
          expectedRevenueCents: number | null
          expectedValueScore: number | null
          expirationDate: string | null
          finalAmountCents: number | null
          headline: string | null
          id: number
          internalNotes: string | null
          marginImpactCents: number | null
          modifiedDate: string | null
          offers: number
          offerStatus: Database["public"]["Enums"]["offerStatus"] | null
          originalMarginCents: number | null
          originalMarginPercent: number | null
          predictedAcceptanceProbability: number | null
          predictionFactors: Json | null
          requiresApproval: boolean | null
          shops: number
          strategyRationale: string | null
          totalDiscountCents: number | null
        }[]
      }
      upsert_shop_counter_offer_forecast: {
        Args: { p_counter_offer_id?: number; p_input: Json; p_shops_id: number }
        Returns: Json
      }
      upsert_shop_counter_templates: {
        Args: {
          p_accept_rate?: number
          p_accepted?: number
          p_config: Json
          p_counter_type: string
          p_description?: string
          p_focus?: string
          p_is_active?: boolean
          p_name: string
          p_shops_id: number
          p_usage?: number
        }
        Returns: {
          accepted: number | null
          acceptRate: number | null
          category: string | null
          config: Json
          createDate: string | null
          createdByUser: number | null
          description: string | null
          headline: string | null
          id: number
          isActive: boolean | null
          isDefault: boolean | null
          maxCartValueCents: number | null
          maxDiscountPercent: number | null
          message: string | null
          minCartValueCents: number | null
          minMarginPercent: number | null
          modifiedDate: string | null
          name: string
          requiresApproval: boolean | null
          shops: number
          target: string[] | null
          type: string
          usage: number | null
        }[]
      }
      upsert_shop_single_variant_price: {
        Args: {
          p_allowance_discounts: number
          p_allowance_finance?: number
          p_allowance_shipping?: number
          p_allowance_shrink?: number
          p_created_by_user?: number
          p_effective_price: number
          p_market_adjustment?: number
          p_profit_markup?: number
          p_published?: boolean
          p_published_date?: string
          p_published_price?: number
          p_shops: number
          p_variants: number
        }
        Returns: number
      }
      upsert_shopify_order_details: {
        Args: { _order_id: number }
        Returns: number
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
      cartStatus:
        | "Abandoned"
        | "Offered"
        | "Checkout"
        | "Expired"
        | "Closed-Won"
        | "Closed-Lost"
        | "Archived"
      consumerDeclineReasons:
        | "Price Too High"
        | "Options Not Available"
        | "Just Browsing"
        | "Not Ready To Buy"
        | "Does Not Meet My Needs"
        | "Other"
      counterTypes:
        | "percent_off_item"
        | "percent_off_order"
        | "percent_off_next_order"
        | "price_markdown"
        | "price_markdown_order"
        | "bounceback_current"
        | "bounceback_future"
        | "threshold_one"
        | "threshold_two"
        | "purchase_with_purchase"
        | "gift_with_purchase"
        | "flat_shipping"
        | "free_shipping"
        | "flat_shipping_upgrade"
        | "price_markdown_per_unit"
        | "price_markdown_bundle"
      discountStatus: "Active" | "Claimed" | "Cancelled" | "Expired - Not Used"
      goalMetric:
        | "Consumers"
        | "Orders"
        | "Units"
        | "Bundles"
        | "Items"
        | "Dollars"
        | "Percent"
      itemStatus:
        | "In Cart"
        | "Removed"
        | "Sold"
        | "Returned"
        | "Refunded"
        | "Cancelled"
      offerStatus:
        | "Auto Accepted"
        | "Auto Declined"
        | "Pending Review"
        | "Consumer Accepted"
        | "Consumer Declined"
        | "Reviewed Accepted"
        | "Reviewed Countered"
        | "Reviewed Declined"
        | "Accepted Expired"
        | "Counter Accepted Expired"
        | "Countered Withdrawn"
        | "Requires Approval"
        | "Consumer Countered"
        | "Declined Consumer Counter"
        | "Accepted Consumer Counter"
      offerType:
        | "Customer Generated Offer"
        | "Shop Private Offer"
        | "Shop Counter Offer"
        | "Consumer Counter Offer"
      portfolioName:
        | "New"
        | "Reactivated"
        | "Stable"
        | "Growth"
        | "Declining"
        | "Defected"
      portfolioPeriod: "12 Months" | "6 Months" | "3 Months"
      programFocus:
        | "Acquisition"
        | "Growth"
        | "Reactivation"
        | "Reverse Declining"
        | "Inventory Clearance"
      programGoal:
        | "Gross Margin"
        | "Maintained Markup"
        | "Average Order Value"
        | "New Customers"
        | "Reactivate Customers"
        | "Increase LTV"
        | "Conversion Rate"
        | "Category Sell Through"
        | "Unit Volume"
        | "Transaction Volume"
        | "Other"
      programStatus:
        | "Draft"
        | "Pending"
        | "Active"
        | "Paused"
        | "Complete"
        | "Archived"
      sellerDeclineReasons:
        | "Offer Too Low"
        | "Out of Stock"
        | "Service Issue"
        | "Fulfillment Issue"
        | "Other"
      sellerUserRoles:
        | "Account Admin"
        | "Campaign Admin"
        | "Customer Service User"
        | "Customer Service Admin"
      shopRoles:
        | "owner"
        | "admin"
        | "manager"
        | "staff"
        | "viewer"
        | "Shop Associate"
      subscriptionStatus:
        | "Active"
        | "Cancelled"
        | "Ended"
        | "Paused - Seller"
        | "Paused - User"
        | "Pending"
        | "Refunded"
        | "Trial Stage"
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
      cartStatus: [
        "Abandoned",
        "Offered",
        "Checkout",
        "Expired",
        "Closed-Won",
        "Closed-Lost",
        "Archived",
      ],
      consumerDeclineReasons: [
        "Price Too High",
        "Options Not Available",
        "Just Browsing",
        "Not Ready To Buy",
        "Does Not Meet My Needs",
        "Other",
      ],
      counterTypes: [
        "percent_off_item",
        "percent_off_order",
        "percent_off_next_order",
        "price_markdown",
        "price_markdown_order",
        "bounceback_current",
        "bounceback_future",
        "threshold_one",
        "threshold_two",
        "purchase_with_purchase",
        "gift_with_purchase",
        "flat_shipping",
        "free_shipping",
        "flat_shipping_upgrade",
        "price_markdown_per_unit",
        "price_markdown_bundle",
      ],
      discountStatus: ["Active", "Claimed", "Cancelled", "Expired - Not Used"],
      goalMetric: [
        "Consumers",
        "Orders",
        "Units",
        "Bundles",
        "Items",
        "Dollars",
        "Percent",
      ],
      itemStatus: [
        "In Cart",
        "Removed",
        "Sold",
        "Returned",
        "Refunded",
        "Cancelled",
      ],
      offerStatus: [
        "Auto Accepted",
        "Auto Declined",
        "Pending Review",
        "Consumer Accepted",
        "Consumer Declined",
        "Reviewed Accepted",
        "Reviewed Countered",
        "Reviewed Declined",
        "Accepted Expired",
        "Counter Accepted Expired",
        "Countered Withdrawn",
        "Requires Approval",
        "Consumer Countered",
        "Declined Consumer Counter",
        "Accepted Consumer Counter",
      ],
      offerType: [
        "Customer Generated Offer",
        "Shop Private Offer",
        "Shop Counter Offer",
        "Consumer Counter Offer",
      ],
      portfolioName: [
        "New",
        "Reactivated",
        "Stable",
        "Growth",
        "Declining",
        "Defected",
      ],
      portfolioPeriod: ["12 Months", "6 Months", "3 Months"],
      programFocus: [
        "Acquisition",
        "Growth",
        "Reactivation",
        "Reverse Declining",
        "Inventory Clearance",
      ],
      programGoal: [
        "Gross Margin",
        "Maintained Markup",
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
      programStatus: [
        "Draft",
        "Pending",
        "Active",
        "Paused",
        "Complete",
        "Archived",
      ],
      sellerDeclineReasons: [
        "Offer Too Low",
        "Out of Stock",
        "Service Issue",
        "Fulfillment Issue",
        "Other",
      ],
      sellerUserRoles: [
        "Account Admin",
        "Campaign Admin",
        "Customer Service User",
        "Customer Service Admin",
      ],
      shopRoles: [
        "owner",
        "admin",
        "manager",
        "staff",
        "viewer",
        "Shop Associate",
      ],
      subscriptionStatus: [
        "Active",
        "Cancelled",
        "Ended",
        "Paused - Seller",
        "Paused - User",
        "Pending",
        "Refunded",
        "Trial Stage",
      ],
    },
  },
} as const
