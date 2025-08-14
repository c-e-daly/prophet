import React, { useEffect, useRef } from 'react';
import { Page, Card, Layout } from '@shopify/polaris';
import Highcharts from 'highcharts/highmaps';
import mapDataUS from '@highcharts/map-collection/countries/us/us-all.geo.json';
import { getConsumerGeolocation } from "../lib/queries/consumer_geolocation";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) throw new Error("Missing shop");

  const summary = await getConsumerGeolocation(shop);
  return ({ summary, shop });
}


const getRevenueColor = (revenue: number) => {
  if (revenue >= 500) return '#22c55e';
  if (revenue >= 250) return '#8b5cf6';
  if (revenue >= 50) return '#f97316';
  return '#eab308';
};

const getRevenueCategory = (revenue: number) => {
  if (revenue >= 500) return 'High Value ($500+)';
  if (revenue >= 250) return 'Medium-High ($250-$500)';
  if (revenue >= 50) return 'Medium ($50-$250)';
  return 'Low ($1-$50)';
};

export default function Geolocation() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const mapData = customerData.map(customer => ({
      name: customer.name,
      lat: customer.lat,
      lon: customer.lon,
      z: customer.revenue,
      color: getRevenueColor(customer.revenue),
      custom: {
        city: customer.city,
        category: getRevenueCategory(customer.revenue)
      }
    }));

    Highcharts.mapChart(chartRef.current, {
      chart: {
        map: mapDataUS as any,
        backgroundColor: '#f8fafc',
        height: 600
      },
      title: {
        text: 'Customer Revenue Geolocation Map'
      },
      subtitle: {
        text: 'Customer locations color-coded by annual revenue'
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
          [0, '#eab308'],    // Yellow
          [0.2, '#f97316'],  // Orange  
          [0.5, '#8b5cf6'],  // Purple
          [1, '#22c55e']     // Green
        ]
      },
      series: [
        {
          name: 'US States',
          mapData: mapDataUS,
          borderColor: '#9ca3af',
          borderWidth: 1,
          nullColor: '#e5e7eb'
        },
        {
          type: 'mappoint',
          name: 'Customers',
          data: mapData,
          marker: {
            radius: 8,
            fillOpacity: 0.8,
            lineWidth: 2,
            lineColor: '#ffffff'
          },
          tooltip: {
            pointFormat: `
              <b>{point.name}</b><br/>
              Location: {point.custom.city}<br/>
              Revenue: <b>{point.z}k</b><br/>
              Category: <b>{point.custom.category}</b>
            `
          }
        }
      ],
      credits: { enabled: false }
    });
  }, []);

  // Revenue category counts
  const highValue = customerData.filter(c => c.revenue >= 500).length;
  const mediumHigh = customerData.filter(c => c.revenue >= 250 && c.revenue < 500).length;
  const medium = customerData.filter(c => c.revenue >= 50 && c.revenue < 250).length;
  const low = customerData.filter(c => c.revenue < 50).length;

  return (
    <Page title="Customer Intelligence Dashboard">
      <Layout>
        <Layout.Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#22c55e' }}>{highValue}</h3>
                <p style={{ color: '#6b7280' }}>High Value ($500+)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#8b5cf6' }}>{mediumHigh}</h3>
                <p style={{ color: '#6b7280' }}>Medium-High ($250-$500)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#f97316' }}>{medium}</h3>
                <p style={{ color: '#6b7280' }}>Medium ($50-$250)</p>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#eab308' }}>{low}</h3>
                <p style={{ color: '#6b7280' }}>Low ($1-$50)</p>
              </div>
            </Card>
          </div>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
