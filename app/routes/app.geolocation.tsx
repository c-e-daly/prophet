import React, { useEffect, useRef } from 'react';
import { Card, Layout, Spinner, Page } from '@shopify/polaris';
import Highcharts from 'highcharts/highmaps';
import mapDataUS from '@highcharts/map-collection/countries/us/us-all.geo.json';
import { getConsumerGeolocation } from "../lib/queries/supabase/getShopConsumerGeoData";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useShopifyNavigation } from "../lib/hooks/useShopifyNavigation";


interface SCFData {
  scf: string;
  current_12m: {
    consumers: number;
    spend: number;
    orders: number;
    units: number;
  };
  prior_12m: {
    consumers: number;
    spend: number;
    orders: number;
    units: number;
  };
  delta: {
    consumers: number;
    spend: number;
    orders: number;
    units: number;
  };
  percent_change: {
    consumers: number | null;
    spend: number | null;
    orders: number | null;
    units: number | null;
  };
}

interface LoaderData {
  summary: {
    summary: {
      total_scfs: number;
      current_12m_totals: {
        consumers: number;
        spend: number;
        orders: number;
        units: number;
      };
      prior_12m_totals: {
        consumers: number;
        spend: number;
        orders: number;
        units: number;
      };
    };
    scf_data: SCFData[];
  };
  shop: string;
}

export async function loader({ request }: LoaderFunctionArgs) {

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) throw new Error("Missing shop");

  const summary = await getConsumerGeolocation(shop);
  console.log('Geolocation loader called with URL:', request.url);
  console.log('Shop parameter:', shop);
  console.log('Geolocation data fetched:', summary ? 'success' : 'no data');
  return { summary, shop };
}

// Helper function to get approximate coordinates for SCF (you'd want a proper SCF->coordinates lookup)
const getSCFCoordinates = (scf: string): { lat: number; lon: number } => {
  // This is a simplified mapping - you'd want a proper SCF coordinates file
  // For now, using some approximate values based on common SCF patterns
  const scfMap: Record<string, { lat: number; lon: number }> = {
    '100': { lat: 40.7128, lon: -74.0060 }, // NYC area
    '200': { lat: 38.9072, lon: -77.0369 }, // DC area  
    '300': { lat: 33.7490, lon: -84.3880 }, // Atlanta area
    '400': { lat: 36.1627, lon: -86.7816 }, // Nashville area
    '600': { lat: 41.8781, lon: -87.6298 }, // Chicago area
    '700': { lat: 32.7767, lon: -96.7970 }, // Dallas area
    '800': { lat: 39.7392, lon: -104.9903 }, // Denver area
    '900': { lat: 34.0522, lon: -118.2437 }, // LA area
    // Add more mappings as needed
  };

  return scfMap[scf] || { lat: 39.8283, lon: -98.5795 }; // Default to US center
};

const getSpendColor = (spend: number): string => {
  if (spend >= 100000) return '#22c55e'; // Green for high spend
  if (spend >= 50000) return '#3b82f6';  // Blue for medium-high
  if (spend >= 25000) return '#f59e0b';  // Amber for medium
  if (spend >= 10000) return '#ef4444';  // Red for low-medium
  return '#6b7280'; // Gray for very low
};

const getSpendCategory = (spend: number): string => {
  if (spend >= 100000) return 'Very High ($100K+)';
  if (spend >= 50000) return 'High ($50K-$100K)';
  if (spend >= 25000) return 'Medium ($25K-$50K)';
  if (spend >= 10000) return 'Low ($10K-$25K)';
  return 'Very Low (<$10K)';
};

const getMarkerRadius = (spend: number): number => {
  if (spend >= 100000) return 15;
  if (spend >= 50000) return 12;
  if (spend >= 25000) return 9;
  if (spend >= 10000) return 6;
  return 4;
};

export default function Geolocation() {

  const { isLoading } = useShopifyNavigation();

  if (isLoading) {
    return (
      <Page>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  const { summary } = useLoaderData<LoaderData>();
  const chartRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    if (!chartRef.current || !summary?.scf_data) return;

    const mapData = summary.scf_data.map(scfData => {
      const coords = getSCFCoordinates(scfData.scf);
      return {
        name: `SCF ${scfData.scf}`,
        lat: coords.lat,
        lon: coords.lon,
        z: scfData.current_12m.spend,
        color: getSpendColor(scfData.current_12m.spend),
        custom: {
          scf: scfData.scf,
          category: getSpendCategory(scfData.current_12m.spend),
          consumers: scfData.current_12m.consumers,
          orders: scfData.current_12m.orders,
          units: scfData.current_12m.units,
          spendChange: scfData.percent_change.spend,
          consumerChange: scfData.percent_change.consumers
        }
      };
    });

    Highcharts.mapChart({
      chart: {
        renderTo: chartRef.current,
        map: mapDataUS as any,
        backgroundColor: '#f8fafc',
        height: 600
      },
      title: {
        text: 'Revenue by SCF (Service Classification Facility)'
      },
      subtitle: {
        text: 'Customer spending by 3-digit ZIP code areas - Last 12 months'
      },
      legend: { enabled: false },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 0,
        stops: [
          [0, '#6b7280'],    // Gray
          [0.2, '#ef4444'],  // Red  
          [0.4, '#f59e0b'],  // Amber
          [0.7, '#3b82f6'],  // Blue
          [1, '#22c55e']     // Green
        ]
      },
      series: [
        {
          type: 'map',
          name: 'US States',
          mapData: mapDataUS,
          borderColor: '#9ca3af',
          borderWidth: 1,
          nullColor: '#e5e7eb'
        },
        {
          type: 'mappoint',
          name: 'SCF Areas',
          data: mapData,
          marker: {
            fillOpacity: 0.8,
            lineWidth: 2,
            lineColor: '#ffffff'
          },
          tooltip: {
            pointFormat: '<b>SCF {point.custom.scf}</b><br/>' +
              'Total Spend: <b>${point.z:,.0f}</b><br/>' +
              'Customers: <b>{point.custom.consumers}</b><br/>' +
              'Orders: <b>{point.custom.orders}</b><br/>' +
              'Units: <b>{point.custom.units}</b><br/>' +
              'Category: <b>{point.custom.category}</b><br/>' +
              '{#if point.custom.spendChange}Spend Change: <b>{#if (gt point.custom.spendChange 0)}+{/if}{point.custom.spendChange}%</b><br/>{/if}' +
              '{#if point.custom.consumerChange}Customer Change: <b>{#if (gt point.custom.consumerChange 0)}+{/if}{point.custom.consumerChange}%</b>{/if}'
          }
        }
      ],
      credits: { enabled: false }
    });
  }, [summary]);

  // Calculate category counts
  const scfData = summary?.scf_data || [];
  const veryHigh = scfData.filter(d => d.current_12m.spend >= 100000).length;
  const high = scfData.filter(d => d.current_12m.spend >= 50000 && d.current_12m.spend < 100000).length;
  const medium = scfData.filter(d => d.current_12m.spend >= 25000 && d.current_12m.spend < 50000).length;
  const low = scfData.filter(d => d.current_12m.spend >= 10000 && d.current_12m.spend < 25000).length;
  const veryLow = scfData.filter(d => d.current_12m.spend < 10000).length;

  const totals = summary?.summary?.current_12m_totals;

  return (
    <Page title="Customer Geolocation by SCF">
      <Layout>
        <Layout.Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#22c55e' }}>{veryHigh}</h3>
                <p style={{ color: '#6b7280' }}>Very High ($100K+)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#3b82f6' }}>{high}</h3>
                <p style={{ color: '#6b7280' }}>High ($50K-$100K)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#f59e0b' }}>{medium}</h3>
                <p style={{ color: '#6b7280' }}>Medium ($25K-$50K)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#ef4444' }}>{low}</h3>
                <p style={{ color: '#6b7280' }}>Low ($10K-$25K)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#6b7280' }}>{veryLow}</h3>
                <p style={{ color: '#6b7280' }}>Very Low (&lt;$10K)</p>
              </div>
            </Card>
          </div>
        </Layout.Section>

        {totals && (
          <Layout.Section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#1f2937' }}>${Math.round(totals.spend).toLocaleString()}</h3>
                  <p style={{ color: '#6b7280' }}>Total Revenue</p>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#1f2937' }}>{totals.consumers.toLocaleString()}</h3>
                  <p style={{ color: '#6b7280' }}>Total Customers</p>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#1f2937' }}>{totals.orders.toLocaleString()}</h3>
                  <p style={{ color: '#6b7280' }}>Total Orders</p>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#1f2937' }}>{summary.summary.total_scfs}</h3>
                  <p style={{ color: '#6b7280' }}>Active SCFs</p>
                </div>
              </Card>
            </div>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}