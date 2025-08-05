import React, { useEffect, useRef } from 'react';
import { Page, Card, Layout } from '@shopify/polaris';
import Highcharts from 'highcharts';
import HighchartsMap from 'highcharts/modules/map';

// Initialize Highcharts Maps
HighchartsMap(Highcharts);

// Sample customer data - replace with your actual data
const customerData = [
  { name: 'Acme Corp', lat: 40.7128, lon: -74.0060, revenue: 750, city: 'New York' },
  { name: 'Tech Solutions', lat: 34.0522, lon: -118.2437, revenue: 325, city: 'Los Angeles' },
  { name: 'Global Industries', lat: 41.8781, lon: -87.6298, revenue: 180, city: 'Chicago' },
  { name: 'Startup Inc', lat: 37.7749, lon: -122.4194, revenue: 45, city: 'San Francisco' },
  { name: 'Local Business', lat: 25.7617, lon: -80.1918, revenue: 15, city: 'Miami' },
  { name: 'Enterprise LLC', lat: 39.9526, lon: -75.1652, revenue: 890, city: 'Philadelphia' },
  { name: 'Mid Corp', lat: 32.7767, lon: -96.7970, revenue: 275, city: 'Dallas' },
  { name: 'Small Co', lat: 47.6062, lon: -122.3321, revenue: 85, city: 'Seattle' },
  { name: 'Big Client', lat: 33.4484, lon: -112.0740, revenue: 620, city: 'Phoenix' },
  { name: 'New Customer', lat: 39.7392, lon: -104.9903, revenue: 35, city: 'Denver' }
];

// Revenue color mapping function
const getRevenueColor = (revenue) => {
  if (customerData.revenue >= 500) return '#22c55e'; // Green
  if (customerData.revenue >= 250) return '#8b5cf6'; // Purple
  if (customerData.revenue >= 50) return '#f97316';  // Orange
  return '#eab308'; // Yellow
};

// Revenue category function
const getRevenueCategory = (revenue) => {
  if (revenue >= 500) return 'High Value ($500+)';
  if (revenue >= 250) return 'Medium-High ($250-$500)';
  if (revenue >= 50) return 'Medium ($50-$250)';
  return 'Low ($1-$50)';
};

export default function Dashboard() {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Prepare data for Highcharts
      const mapData = customerData.map(customer => ({
        name: customer.name,
        lat: customer.lat,
        lon: customer.lon,
        z: customer.revenue,
        color: getRevenueColor(customer.revenue),
        custom: {
          revenue: customer.revenue,
          city: customer.city,
          category: getRevenueCategory(customer.revenue)
        }
      }));

      // Create the map chart
      Highcharts.mapChart(chartRef.current, {
        chart: {
          map: 'countries/us/us-all',
          height: 600,
          backgroundColor: '#f8fafc'
        },
        
        title: {
          text: 'Customer Revenue Geolocation Map',
          style: {
            fontSize: '20px',
            fontWeight: 'bold'
          }
        },
        
        subtitle: {
          text: 'Customer locations color-coded by annual revenue'
        },
        
        legend: {
          enabled: false
        },
        
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
        
        series: [{
          name: 'US States',
          mapData: Highcharts.maps['countries/us/us-all'],
          color: '#e5e7eb',
          borderColor: '#9ca3af',
          borderWidth: 1,
          states: {
            hover: {
              color: '#d1d5db'
            }
          }
        }, {
          type: 'mappoint',
          name: 'Customers',
          data: mapData,
          marker: {
            radius: 8,
            fillOpacity: 0.8,
            lineWidth: 2,
            lineColor: '#ffffff'
          },
          states: {
            hover: {
              marker: {
                radius: 12,
                fillOpacity: 1
              }
            }
          },
          tooltip: {
            pointFormat: `
              <b>{point.name}</b><br/>
              Location: {point.custom.city}<br/>
              Revenue: <b>$\\${point.z}k</b><br/>
              Category: <b>{point.custom.category}</b>
            `
          }
        }],
        
        credits: {
          enabled: false
        }
      });
    }
    
    // Load US map data
    const script = document.createElement('script');
    script.src = 'https://code.highcharts.com/mapdata/countries/us/us-all.js';
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Calculate summary stats
  const totalCustomers = customerData.length;
  const totalRevenue = customerData.reduce((sum, customer) => sum + customer.revenue, 0);
  const avgRevenue = totalRevenue / totalCustomers;
  
  const highValue = customerData.filter(c => c.revenue >= 500).length;
  const mediumHigh = customerData.filter(c => c.revenue >= 250 && c.revenue < 500).length;
  const medium = customerData.filter(c => c.revenue >= 50 && c.revenue < 250).length;
  const low = customerData.filter(c => c.revenue < 50).length;

  return (
    <Page title="Customer Intelligence Dashboard">
      <Layout>
        <Layout.Section>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Card sectioned>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '2rem', color: '#22c55e' }}>{highValue}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>High Value ($500+)</p>
              </div>
            </Card>
            <Card sectioned>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '2rem', color: '#8b5cf6' }}>{mediumHigh}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Medium-High ($250-$500)</p>
              </div>
            </Card>
            <Card sectioned>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '2rem', color: '#f97316' }}>{medium}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Medium ($50-$250)</p>
              </div>
            </Card>
            <Card sectioned>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '2rem', color: '#eab308' }}>{low}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Low ($1-$50)</p>
              </div>
            </Card>
          </div>
          
          {/* Revenue Legend */}
          <Card sectioned>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Revenue Categories</h3>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                  <span>High Value ($500+)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
                  <span>Medium-High ($250-$500)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
                  <span>Medium ($50-$250)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                  <span>Low ($1-$50)</span>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          {/* Map Container */}
          <Card sectioned>
            <div ref={chartRef} style={{ width: '100%', height: '600px' }}></div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}