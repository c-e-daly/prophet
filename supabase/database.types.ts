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
          bbl_campaigns: string | null
          bbl_merchants: string | null
          bbl_programs: string | null
          budget: number | null
          campaignDates: Json | null
          campaignGoals: Json | null
          campaignName: string | null
          codePrefix: string | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          description: string | null
          endDate: string | null
          id: number
          isDefault: boolean
          modifiedDate: string | null
          shopDomain: string | null
          shops: number
          startDate: string | null
          status: Database["public"]["Enums"]["campaignStatus"]
        }
        Insert: {
          bbl_campaigns?: string | null
          bbl_merchants?: string | null
          bbl_programs?: string | null
          budget?: number | null
          campaignDates?: Json | null
          campaignGoals?: Json | null
          campaignName?: string | null
          codePrefix?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          endDate?: string | null
          id?: number
          isDefault: boolean
          modifiedDate?: string | null
          shopDomain?: string | null
          shops: number
          startDate?: string | null
          status?: Database["public"]["Enums"]["campaignStatus"]
        }
        Update: {
          bbl_campaigns?: string | null
          bbl_merchants?: string | null
          bbl_programs?: string | null
          budget?: number | null
          campaignDates?: Json | null
          campaignGoals?: Json | null
          campaignName?: string | null
          codePrefix?: string | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          endDate?: string | null
          id?: number
          isDefault?: boolean
          modifiedDate?: string | null
          shopDomain?: string | null
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
          allowanceMarkup: number | null
          bbl_cartitems: string | null
          bbl_carts: string | null
          bbl_merchants: string | null
          bbl_offers: string | null
          cartItemsSampleID: number | null
          cartItemStatus: string | null
          carts: number | null
          cartSampleID: number | null
          cartToken: string
          consumers: number | null
          consumerSampleID: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          discountAllocation: number | null
          id: number
          itemStatus: string | null
          itemTotalPrice: number | null
          lineTotal: number | null
          markupRetained: number | null
          modifiedDate: string | null
          offerPrice: number | null
          offers: number | null
          offerToken: string | null
          productCartKey: string | null
          productGID: string | null
          productHTML: string | null
          productID: string | null
          productImageURL: string | null
          productName: string | null
          products: number | null
          productURL: string | null
          profitMarkup: number | null
          profitRetained: number | null
          sellingPrice: number | null
          settlementPrice: number | null
          shops: number | null
          storeUrl: string | null
          template: string | null
          totalMarkup: number | null
          variantGID: string | null
          variantID: string
          variantImageURL: string | null
          variantName: string | null
          variantQuantity: number | null
          variants: number | null
          variantSampleID: number | null
          variantSKU: string | null
        }
        Insert: {
          allowanceMarkup?: number | null
          bbl_cartitems?: string | null
          bbl_carts?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          cartItemsSampleID?: number | null
          cartItemStatus?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken: string
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountAllocation?: number | null
          id?: number
          itemStatus?: string | null
          itemTotalPrice?: number | null
          lineTotal?: number | null
          markupRetained?: number | null
          modifiedDate?: string | null
          offerPrice?: number | null
          offers?: number | null
          offerToken?: string | null
          productCartKey?: string | null
          productGID?: string | null
          productHTML?: string | null
          productID?: string | null
          productImageURL?: string | null
          productName?: string | null
          products?: number | null
          productURL?: string | null
          profitMarkup?: number | null
          profitRetained?: number | null
          sellingPrice?: number | null
          settlementPrice?: number | null
          shops?: number | null
          storeUrl?: string | null
          template?: string | null
          totalMarkup?: number | null
          variantGID?: string | null
          variantID: string
          variantImageURL?: string | null
          variantName?: string | null
          variantQuantity?: number | null
          variants?: number | null
          variantSampleID?: number | null
          variantSKU?: string | null
        }
        Update: {
          allowanceMarkup?: number | null
          bbl_cartitems?: string | null
          bbl_carts?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          cartItemsSampleID?: number | null
          cartItemStatus?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountAllocation?: number | null
          id?: number
          itemStatus?: string | null
          itemTotalPrice?: number | null
          lineTotal?: number | null
          markupRetained?: number | null
          modifiedDate?: string | null
          offerPrice?: number | null
          offers?: number | null
          offerToken?: string | null
          productCartKey?: string | null
          productGID?: string | null
          productHTML?: string | null
          productID?: string | null
          productImageURL?: string | null
          productName?: string | null
          products?: number | null
          productURL?: string | null
          profitMarkup?: number | null
          profitRetained?: number | null
          sellingPrice?: number | null
          settlementPrice?: number | null
          shops?: number | null
          storeUrl?: string | null
          template?: string | null
          totalMarkup?: number | null
          variantGID?: string | null
          variantID?: string
          variantImageURL?: string | null
          variantName?: string | null
          variantQuantity?: number | null
          variants?: number | null
          variantSampleID?: number | null
          variantSKU?: string | null
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
          bbl_cartitems: string[] | null
          bbl_carts: string | null
          bbl_consumers: string | null
          bbl_merchants: string | null
          bbl_offers: string | null
          bbl_shopid: string | null
          cartComposition: string | null
          cartCreateDate: string | null
          cartDiscountMarkup: number | null
          cartFinanceMarkup: number | null
          cartItemCount: number | null
          cartItemsSubtotal: number | null
          cartMarketMarkup: number | null
          cartOtherMarkup: number | null
          cartProfitMarkup: number | null
          cartSampleID: number | null
          cartShrinkMarkup: number | null
          cartStatus: string | null
          cartToken: string | null
          cartTotalPrice: number | null
          cartUnitCount: number | null
          cartUpdateDate: string | null
          cartUrl: string | null
          consumers: number | null
          consumerSampleID: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          currency: string | null
          id: number
          modifiedDate: string | null
          offer: number[] | null
          offers: number | null
          shops: number | null
        }
        Insert: {
          bbl_cartitems?: string[] | null
          bbl_carts?: string | null
          bbl_consumers?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_shopid?: string | null
          cartComposition?: string | null
          cartCreateDate?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartSampleID?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: string | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUpdateDate?: string | null
          cartUrl?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currency?: string | null
          id?: number
          modifiedDate?: string | null
          offer?: number[] | null
          offers?: number | null
          shops?: number | null
        }
        Update: {
          bbl_cartitems?: string[] | null
          bbl_carts?: string | null
          bbl_consumers?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_shopid?: string | null
          cartComposition?: string | null
          cartCreateDate?: string | null
          cartDiscountMarkup?: number | null
          cartFinanceMarkup?: number | null
          cartItemCount?: number | null
          cartItemsSubtotal?: number | null
          cartMarketMarkup?: number | null
          cartOtherMarkup?: number | null
          cartProfitMarkup?: number | null
          cartSampleID?: number | null
          cartShrinkMarkup?: number | null
          cartStatus?: string | null
          cartToken?: string | null
          cartTotalPrice?: number | null
          cartUnitCount?: number | null
          cartUpdateDate?: string | null
          cartUrl?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          currency?: string | null
          id?: number
          modifiedDate?: string | null
          offer?: number[] | null
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
        ]
      }
      consumers: {
        Row: {
          address: string | null
          bbl_carts: string | null
          bbl_merchants: string | null
          bbl_offers: string | null
          bbl_orders: string | null
          bbl_uuid: string | null
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
          bbl_carts?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_orders?: string | null
          bbl_uuid?: string | null
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
          bbl_carts?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_orders?: string | null
          bbl_uuid?: string | null
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
            foreignKeyName: "consumerShop_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShop12m: {
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
          netItems: number | null
          netSales: number | null
          netShippingSales: number | null
          netUnits: number | null
          norSales: number | null
          offersMade: number | null
          orders: number | null
          recency: number | null
          returnCOGS: number | null
          returnDiscounts: number | null
          returnItems: number | null
          returnShippingCost: number | null
          returnShippingSales: number | null
          returnUnits: number | null
          shops: number | null
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
          netItems?: number | null
          netSales?: number | null
          netShippingSales?: number | null
          netUnits?: number | null
          norSales?: number | null
          offersMade?: number | null
          orders?: number | null
          recency?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          shops?: number | null
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
          netItems?: number | null
          netSales?: number | null
          netShippingSales?: number | null
          netUnits?: number | null
          norSales?: number | null
          offersMade?: number | null
          orders?: number | null
          recency?: number | null
          returnCOGS?: number | null
          returnDiscounts?: number | null
          returnItems?: number | null
          returnShippingCost?: number | null
          returnShippingSales?: number | null
          returnUnits?: number | null
          shops?: number | null
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
            foreignKeyName: "consumer12m_shops_fkey"
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
            foreignKeyName: "consumerShopCategoryIndex_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopLTV: {
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
            foreignKeyName: "consumerShopLTV_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
        ]
      }
      consumerShopPortfolioMeasures: {
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
          shops: number | null
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
          shops?: number | null
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
          shops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consumerMetrics_consumer_fkey"
            columns: ["consumer"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
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
      consumerShopPortfolioScores: {
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
          shops: number | null
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
          shops?: number | null
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
          shops?: number | null
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
            foreignKeyName: "consumerShopPortfolioScores_shops_fkey"
            columns: ["shops"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          bbl_merchant: string | null
          carts: number | null
          cartToken: string | null
          code: string | null
          combineOrders: boolean | null
          combineProduct: boolean | null
          combineShipping: boolean | null
          consumers: number | null
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
          minimumSubtotal: number | null
          modifiedDate: string | null
          offers: number | null
          order: number | null
          programs: number | null
          shopifyCustomerGID: string | null
          shopifyDiscountGID: string | null
          shops: number | null
          usageCount: number | null
        }
        Insert: {
          bbl_merchant?: string | null
          carts?: number | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumers?: number | null
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
          minimumSubtotal?: number | null
          modifiedDate?: string | null
          offers?: number | null
          order?: number | null
          programs?: number | null
          shopifyCustomerGID?: string | null
          shopifyDiscountGID?: string | null
          shops?: number | null
          usageCount?: number | null
        }
        Update: {
          bbl_merchant?: string | null
          carts?: number | null
          cartToken?: string | null
          code?: string | null
          combineOrders?: boolean | null
          combineProduct?: boolean | null
          combineShipping?: boolean | null
          consumers?: number | null
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
          minimumSubtotal?: number | null
          modifiedDate?: string | null
          offers?: number | null
          order?: number | null
          programs?: number | null
          shopifyCustomerGID?: string | null
          shopifyDiscountGID?: string | null
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
            foreignKeyName: "discounts_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "offers"
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
          consumerGID: number | null
          consumers: number | null
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
          shop_domain: string | null
          shop_id: number | null
          shops: number | null
          topic: string | null
        }
        Insert: {
          consumerGID?: number | null
          consumers?: number | null
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
          shop_domain?: string | null
          shop_id?: number | null
          shops?: number | null
        }
        Update: {
          consumerGID?: number | null
          consumers?: number | null
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
          shop_domain?: string | null
          shop_id?: number | null
          shops?: number | null
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
          approvedDiscountPrice: number | null
          approvedItems: number | null
          approvedPrice: number | null
          approvedUnits: number | null
          bbl_campaigns: string | null
          bbl_cartitems: string | null
          bbl_carts: string | null
          bbl_consumers: string | null
          bbl_merchants: string | null
          bbl_offers: string | null
          bbl_periods: string | null
          bbl_programs: string | null
          bbl_shop: string | null
          calendarWeek: number | null
          campaignCode: string | null
          campaignName: string | null
          campaigns: number | null
          cartProfitMarkup: number | null
          carts: number | null
          cartSampleID: number | null
          cartToken: string | null
          cartTotalMarkup: number | null
          cartTotalPrice: number | null
          checkoutUrl: string | null
          consumerEmail: string | null
          consumerName: string | null
          consumers: number | null
          consumerSampleID: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          discountCode: string | null
          discounts: number | null
          id: number
          modifiedDate: string | null
          offerApprovedDate: string | null
          offerCreateDate: string | null
          offerDeclineDate: string | null
          offerDiscountPercent: number | null
          offerDiscountPrice: number | null
          offerExpiryEnd: string | null
          offerExpiryMinutes: number | null
          offerExpiryStart: string | null
          offerItems: number | null
          offerPrice: number | null
          offerSampleID: number | null
          offerStatus: Database["public"]["Enums"]["offerStatus"] | null
          offerToken: string | null
          offerTOSCheckedDate: string | null
          offerUnits: number | null
          periods: number | null
          programAcceptRate: number | null
          programCode: string | null
          programDeclineRate: number | null
          programName: string | null
          programs: number | null
          shops: number | null
          storeBrand: string | null
          storeUrl: string | null
        }
        Insert: {
          approvedDiscountPrice?: number | null
          approvedItems?: number | null
          approvedPrice?: number | null
          approvedUnits?: number | null
          bbl_campaigns?: string | null
          bbl_cartitems?: string | null
          bbl_carts?: string | null
          bbl_consumers?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_periods?: string | null
          bbl_programs?: string | null
          bbl_shop?: string | null
          calendarWeek?: number | null
          campaignCode?: string | null
          campaignName?: string | null
          campaigns?: number | null
          cartProfitMarkup?: number | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          cartTotalMarkup?: number | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumerEmail?: string | null
          consumerName?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountCode?: string | null
          discounts?: number | null
          id?: number
          modifiedDate?: string | null
          offerApprovedDate?: string | null
          offerCreateDate?: string | null
          offerDeclineDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerExpiryEnd?: string | null
          offerExpiryMinutes?: number | null
          offerExpiryStart?: string | null
          offerItems?: number | null
          offerPrice?: number | null
          offerSampleID?: number | null
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          offerToken?: string | null
          offerTOSCheckedDate?: string | null
          offerUnits?: number | null
          periods?: number | null
          programAcceptRate?: number | null
          programCode?: string | null
          programDeclineRate?: number | null
          programName?: string | null
          programs?: number | null
          shops?: number | null
          storeBrand?: string | null
          storeUrl?: string | null
        }
        Update: {
          approvedDiscountPrice?: number | null
          approvedItems?: number | null
          approvedPrice?: number | null
          approvedUnits?: number | null
          bbl_campaigns?: string | null
          bbl_cartitems?: string | null
          bbl_carts?: string | null
          bbl_consumers?: string | null
          bbl_merchants?: string | null
          bbl_offers?: string | null
          bbl_periods?: string | null
          bbl_programs?: string | null
          bbl_shop?: string | null
          calendarWeek?: number | null
          campaignCode?: string | null
          campaignName?: string | null
          campaigns?: number | null
          cartProfitMarkup?: number | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          cartTotalMarkup?: number | null
          cartTotalPrice?: number | null
          checkoutUrl?: string | null
          consumerEmail?: string | null
          consumerName?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          discountCode?: string | null
          discounts?: number | null
          id?: number
          modifiedDate?: string | null
          offerApprovedDate?: string | null
          offerCreateDate?: string | null
          offerDeclineDate?: string | null
          offerDiscountPercent?: number | null
          offerDiscountPrice?: number | null
          offerExpiryEnd?: string | null
          offerExpiryMinutes?: number | null
          offerExpiryStart?: string | null
          offerItems?: number | null
          offerPrice?: number | null
          offerSampleID?: number | null
          offerStatus?: Database["public"]["Enums"]["offerStatus"] | null
          offerToken?: string | null
          offerTOSCheckedDate?: string | null
          offerUnits?: number | null
          periods?: number | null
          programAcceptRate?: number | null
          programCode?: string | null
          programDeclineRate?: number | null
          programName?: string | null
          programs?: number | null
          shops?: number | null
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
            foreignKeyName: "offers_discounts_fkey"
            columns: ["discounts"]
            isOneToOne: false
            referencedRelation: "discounts"
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
        ]
      }
      orders: {
        Row: {
          cancelledAt: string | null
          cancelledReason: string | null
          carts: number | null
          cartSampleID: number | null
          cartToken: string | null
          categoriesShopped: number | null
          checkoutToken: string | null
          consumers: number | null
          consumerSampleID: number | null
          created_at: string
          discountCodes: Json | null
          discounts: number | null
          financialStatus: string | null
          fulfillmentStatus: string | null
          grossCOGS: number | null
          grossDiscounts: number | null
          grossItems: number | null
          grossSales: number | null
          grossShippingCost: number | null
          grossShippingSales: number | null
          grossUnits: number | null
          id: number
          lineItems: Json | null
          modifedDate: string | null
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
          orderDateTime: string | null
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
          shopifyOrderGID: string | null
          shopifyOrderId: string | null
          shops: number | null
          totalPrice: number | null
          totalTax: number | null
        }
        Insert: {
          cancelledAt?: string | null
          cancelledReason?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          categoriesShopped?: number | null
          checkoutToken?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          discountCodes?: Json | null
          discounts?: number | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lineItems?: Json | null
          modifedDate?: string | null
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
          orderDateTime?: string | null
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
          shopifyOrderGID?: string | null
          shopifyOrderId?: string | null
          shops?: number | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Update: {
          cancelledAt?: string | null
          cancelledReason?: string | null
          carts?: number | null
          cartSampleID?: number | null
          cartToken?: string | null
          categoriesShopped?: number | null
          checkoutToken?: string | null
          consumers?: number | null
          consumerSampleID?: number | null
          created_at?: string
          discountCodes?: Json | null
          discounts?: number | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          grossCOGS?: number | null
          grossDiscounts?: number | null
          grossItems?: number | null
          grossSales?: number | null
          grossShippingCost?: number | null
          grossShippingSales?: number | null
          grossUnits?: number | null
          id?: number
          lineItems?: Json | null
          modifedDate?: string | null
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
          orderDateTime?: string | null
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
          shopifyOrderGID?: string | null
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
          bbl_category: string | null
          bbl_merchants: string | null
          bbl_products: string | null
          bbl_variants: string | null
          category: number | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          description: string | null
          id: number
          modifiedDate: string | null
          productComparePrice: number | null
          productGID: string | null
          productID: string | null
          productImageURL: string | null
          productIMUPrice: number | null
          productName: string | null
          productRegularPrice: number | null
          productSampleID: number | null
          productType: string | null
          shops: number | null
          shortDescription: string | null
          variants: number[] | null
        }
        Insert: {
          bbl_category?: string | null
          bbl_merchants?: string | null
          bbl_products?: string | null
          bbl_variants?: string | null
          category?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          id?: number
          modifiedDate?: string | null
          productComparePrice?: number | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          productIMUPrice?: number | null
          productName?: string | null
          productRegularPrice?: number | null
          productSampleID?: number | null
          productType?: string | null
          shops?: number | null
          shortDescription?: string | null
          variants?: number[] | null
        }
        Update: {
          bbl_category?: string | null
          bbl_merchants?: string | null
          bbl_products?: string | null
          bbl_variants?: string | null
          category?: number | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          description?: string | null
          id?: number
          modifiedDate?: string | null
          productComparePrice?: number | null
          productGID?: string | null
          productID?: string | null
          productImageURL?: string | null
          productIMUPrice?: number | null
          productName?: string | null
          productRegularPrice?: number | null
          productSampleID?: number | null
          productType?: string | null
          shops?: number | null
          shortDescription?: string | null
          variants?: number[] | null
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
      programgoals: {
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
          bbl_campaigns: string | null
          bbl_merchants: string | null
          bbl_periods: string | null
          bbl_programs: string | null
          campaigns: number | null
          codePrefix: string | null
          combineOrderDiscounts: boolean | null
          combineProductDiscounts: boolean | null
          combineShippingDiscounts: boolean | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          declineRate: number | null
          description: string | null
          discountPrefix: string | null
          endDate: string | null
          expiryTimeMinutes: number | null
          id: number
          isDefault: boolean | null
          modifiedDate: string | null
          programFocus: Database["public"]["Enums"]["programFocus"] | null
          programGoal: Database["public"]["Enums"]["programGoal"] | null
          programName: string | null
          shops: number | null
          startDate: string | null
          status: Database["public"]["Enums"]["programStatus"]
          usageCount: number | null
        }
        Insert: {
          acceptRate?: number | null
          bbl_campaigns?: string | null
          bbl_merchants?: string | null
          bbl_periods?: string | null
          bbl_programs?: string | null
          campaigns?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          declineRate?: number | null
          description?: string | null
          discountPrefix?: string | null
          endDate?: string | null
          expiryTimeMinutes?: number | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          programFocus?: Database["public"]["Enums"]["programFocus"] | null
          programGoal?: Database["public"]["Enums"]["programGoal"] | null
          programName?: string | null
          shops?: number | null
          startDate?: string | null
          status?: Database["public"]["Enums"]["programStatus"]
          usageCount?: number | null
        }
        Update: {
          acceptRate?: number | null
          bbl_campaigns?: string | null
          bbl_merchants?: string | null
          bbl_periods?: string | null
          bbl_programs?: string | null
          campaigns?: number | null
          codePrefix?: string | null
          combineOrderDiscounts?: boolean | null
          combineProductDiscounts?: boolean | null
          combineShippingDiscounts?: boolean | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          declineRate?: number | null
          description?: string | null
          discountPrefix?: string | null
          endDate?: string | null
          expiryTimeMinutes?: number | null
          id?: number
          isDefault?: boolean | null
          modifiedDate?: string | null
          programFocus?: Database["public"]["Enums"]["programFocus"] | null
          programGoal?: Database["public"]["Enums"]["programGoal"] | null
          programName?: string | null
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
      shopifyOrders: {
        Row: {
          cancelledAt: string | null
          cancelReason: string | null
          cartToken: string | null
          checkoutToken: string | null
          created_at: string
          createDate: string | null
          currency: string | null
          customerGID: string | null
          discountCodes: Json | null
          email: string | null
          financialStatus: string | null
          fulfillmentStatus: string | null
          id: number
          lineItems: Json | null
          modifiedDate: string | null
          name: string | null
          orderGID: string | null
          payload: Json | null
          shopDomain: string | null
          totalPrice: number | null
          totalTax: number | null
        }
        Insert: {
          cancelledAt?: string | null
          cancelReason?: string | null
          cartToken?: string | null
          checkoutToken?: string | null
          created_at?: string
          createDate?: string | null
          currency?: string | null
          customerGID?: string | null
          discountCodes?: Json | null
          email?: string | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          id?: number
          lineItems?: Json | null
          modifiedDate?: string | null
          name?: string | null
          orderGID?: string | null
          payload?: Json | null
          shopDomain?: string | null
          totalPrice?: number | null
          totalTax?: number | null
        }
        Update: {
          cancelledAt?: string | null
          cancelReason?: string | null
          cartToken?: string | null
          checkoutToken?: string | null
          created_at?: string
          createDate?: string | null
          currency?: string | null
          customerGID?: string | null
          discountCodes?: Json | null
          email?: string | null
          financialStatus?: string | null
          fulfillmentStatus?: string | null
          id?: number
          lineItems?: Json | null
          modifiedDate?: string | null
          name?: string | null
          orderGID?: string | null
          payload?: Json | null
          shopDomain?: string | null
          totalPrice?: number | null
          totalTax?: number | null
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
      variantPricing: {
        Row: {
          allowanceDiscounts: number | null
          allowanceFinance: number | null
          allowanceShipping: number | null
          allowanceShrink: number | null
          cogs: number | null
          createDate: string | null
          currency: string | null
          effectivePrice: number | null
          id: number
          marketAdjustment: number | null
          modifiedDate: string
          notes: string | null
          productGID: string
          profitMarkup: number | null
          published: boolean | null
          publishedDate: string | null
          publishedPrice: number | null
          shops: number
          source: string | null
          updatedBy: string | null
          variantGID: string
          variants: number
          version: number | null
        }
        Insert: {
          allowanceDiscounts?: number | null
          allowanceFinance?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          cogs?: number | null
          createDate?: string | null
          currency?: string | null
          effectivePrice?: number | null
          id?: number
          marketAdjustment?: number | null
          modifiedDate?: string
          notes?: string | null
          productGID: string
          profitMarkup?: number | null
          published?: boolean | null
          publishedDate?: string | null
          publishedPrice?: number | null
          shops: number
          source?: string | null
          updatedBy?: string | null
          variantGID: string
          variants: number
          version?: number | null
        }
        Update: {
          allowanceDiscounts?: number | null
          allowanceFinance?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          cogs?: number | null
          createDate?: string | null
          currency?: string | null
          effectivePrice?: number | null
          id?: number
          marketAdjustment?: number | null
          modifiedDate?: string
          notes?: string | null
          productGID?: string
          profitMarkup?: number | null
          published?: boolean | null
          publishedDate?: string | null
          publishedPrice?: number | null
          shops?: number
          source?: string | null
          updatedBy?: string | null
          variantGID?: string
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
      variantPricingAudit: {
        Row: {
          afterRow: Json | null
          beforeRow: Json | null
          changedAt: string
          changedBy: string | null
          id: number
          shops: number
          variantPricing: number
          variantsGID: string
        }
        Insert: {
          afterRow?: Json | null
          beforeRow?: Json | null
          changedAt?: string
          changedBy?: string | null
          id?: number
          shops: number
          variantPricing: number
          variantsGID: string
        }
        Update: {
          afterRow?: Json | null
          beforeRow?: Json | null
          changedAt?: string
          changedBy?: string | null
          id?: number
          shops?: number
          variantPricing?: number
          variantsGID?: string
        }
        Relationships: [
          {
            foreignKeyName: "variantPricingAudit_variantPricing_fkey"
            columns: ["variantPricing"]
            isOneToOne: false
            referencedRelation: "variantPricing"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          allowanceDiscounts: number | null
          allowanceFinancing: number | null
          allowanceOther: number | null
          allowanceShipping: number | null
          allowanceShrink: number | null
          bbl_merchants: string | null
          bbl_products: string | null
          bbl_variants: string | null
          categories: Json | null
          created_at: string
          createDate: string | null
          createdBy: string | null
          id: number
          IMUPrice: number | null
          inventoryQuantity: number | null
          isDefault: boolean | null
          marketMarkup: number | null
          modifiedDate: string | null
          priceBuilderJSON: Json | null
          pricePublishDate: string | null
          pricePublished: boolean | null
          products: number | null
          productSampleID: number | null
          productVariantGID: string | null
          productVariantID: string | null
          profitMarkup: number | null
          sellingPrice: number | null
          shopifyPrice: number | null
          shops: number | null
          variantCOGS: number | null
          variantImageURL: string | null
          variantName: string | null
          variantSKU: string | null
          variantsSampleID: number | null
        }
        Insert: {
          allowanceDiscounts?: number | null
          allowanceFinancing?: number | null
          allowanceOther?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          bbl_merchants?: string | null
          bbl_products?: string | null
          bbl_variants?: string | null
          categories?: Json | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          IMUPrice?: number | null
          inventoryQuantity?: number | null
          isDefault?: boolean | null
          marketMarkup?: number | null
          modifiedDate?: string | null
          priceBuilderJSON?: Json | null
          pricePublishDate?: string | null
          pricePublished?: boolean | null
          products?: number | null
          productSampleID?: number | null
          productVariantGID?: string | null
          productVariantID?: string | null
          profitMarkup?: number | null
          sellingPrice?: number | null
          shopifyPrice?: number | null
          shops?: number | null
          variantCOGS?: number | null
          variantImageURL?: string | null
          variantName?: string | null
          variantSKU?: string | null
          variantsSampleID?: number | null
        }
        Update: {
          allowanceDiscounts?: number | null
          allowanceFinancing?: number | null
          allowanceOther?: number | null
          allowanceShipping?: number | null
          allowanceShrink?: number | null
          bbl_merchants?: string | null
          bbl_products?: string | null
          bbl_variants?: string | null
          categories?: Json | null
          created_at?: string
          createDate?: string | null
          createdBy?: string | null
          id?: number
          IMUPrice?: number | null
          inventoryQuantity?: number | null
          isDefault?: boolean | null
          marketMarkup?: number | null
          modifiedDate?: string | null
          priceBuilderJSON?: Json | null
          pricePublishDate?: string | null
          pricePublished?: boolean | null
          products?: number | null
          productSampleID?: number | null
          productVariantGID?: string | null
          productVariantID?: string | null
          profitMarkup?: number | null
          sellingPrice?: number | null
          shopifyPrice?: number | null
          shops?: number | null
          variantCOGS?: number | null
          variantImageURL?: string | null
          variantName?: string | null
          variantSKU?: string | null
          variantsSampleID?: number | null
        }
        Relationships: [
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
        Args: { discountsID: number } | { discountsId: number }
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
      save_variant_pricing_versions: {
        Args: { p_rows: Json; p_shops_id: number }
        Returns: {
          affected: number
        }[]
      }
      upsert_variant_pricing: {
        Args: { p_rows: Json; p_shops_id: number }
        Returns: {
          affected: number
        }[]
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
      consumerDeclineReasons:
        | "Price Too High"
        | "Options Not Available"
        | "Just Browsing"
        | "Not Ready To Buy"
        | "Does Not Meet My Needs"
        | "Other"
      discountStatus: "Active" | "Claimed" | "Cancelled" | "Expired - Not Used"
      goalMetric:
        | "Consumers"
        | "Orders"
        | "Units"
        | "Bundles"
        | "Items"
        | "Dollars"
        | "Percent"
      itemStatus: "Sold" | "Returned" | "Refunded" | "Cancelled"
      offerStatus:
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
      offerType:
        | "Customer Generated Offer"
        | "Shop Private Offer"
        | "Shop Counter Offer"
        | "Consumer Counter Offer"
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
      promotionTypes:
        | "Percent off Item"
        | "Percent off Order"
        | "Percent off Next Order"
        | "Price Markdown"
        | "Price Markdown Order"
        | "Bounceback Current"
        | "Bounceback Future"
        | "Threshold One"
        | "Threshold Two"
        | "Purchase With Purchase"
        | "Gift With Purchase"
        | "Flat Shipping"
        | "Free Shipping"
        | "Flat Shipping Upgrade"
        | "Price Markdown Multi-Units"
        | "Price Markdown Bundle"
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
      subscriptionStatus:
        | "Active"
        | "Cancelled"
        | "Ended"
        | "Paused - Seller"
        | "Paused - User"
        | "Pending"
        | "Refunded"
        | "Trial Stage"
      userType:
        | "IWT Admin"
        | "IWT Service"
        | "Consumer"
        | "Consumer App"
        | "Shop Owner"
        | "Shop Associate"
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
      ],
      consumerDeclineReasons: [
        "Price Too High",
        "Options Not Available",
        "Just Browsing",
        "Not Ready To Buy",
        "Does Not Meet My Needs",
        "Other",
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
      itemStatus: ["Sold", "Returned", "Refunded", "Cancelled"],
      offerStatus: [
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
      offerType: [
        "Customer Generated Offer",
        "Shop Private Offer",
        "Shop Counter Offer",
        "Consumer Counter Offer",
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
      promotionTypes: [
        "Percent off Item",
        "Percent off Order",
        "Percent off Next Order",
        "Price Markdown",
        "Price Markdown Order",
        "Bounceback Current",
        "Bounceback Future",
        "Threshold One",
        "Threshold Two",
        "Purchase With Purchase",
        "Gift With Purchase",
        "Flat Shipping",
        "Free Shipping",
        "Flat Shipping Upgrade",
        "Price Markdown Multi-Units",
        "Price Markdown Bundle",
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
      userType: [
        "IWT Admin",
        "IWT Service",
        "Consumer",
        "Consumer App",
        "Shop Owner",
        "Shop Associate",
      ],
    },
  },
} as const
