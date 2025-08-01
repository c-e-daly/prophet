import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Divider, Badge, Box} from '@shopify/polaris';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Pie, Cell} from 'recharts';

const dashboardMetrics = {
  customers: 60000,
  annualSales: 2500000,
  aov: 189,
  avgVisits: 2.89,
  avgItems: 4.8,
  nrr: 46.2,
  paybackDays: 132
};

const revenueByMonth = [ 
  { month: 'Jan', revenue: 210000 },
  { month: 'Feb', revenue: 180000 },
  { month: 'Mar', revenue: 235000 },
  { month: 'Apr', revenue: 190000 },
  { month: 'May', revenue: 200000 },
  { month: 'Jun', revenue: 240000 }
];

const visitFrequencies = [
  { type: '1 Visit', value: 18000 },
  { type: '2 Visits', value: 22000 },
  { type: '3+ Visits', value: 20000 }
];

const COLORS = ['#0442bf', '#80bf9b', '#d6e5f0'];

export default function Dashboard() {
  return (
    <Page title="Performance Dashboard">
      <Layout>
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Total Customers</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">{dashboardMetrics.customers.toLocaleString()}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Annual Sales</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">${dashboardMetrics.annualSales.toLocaleString()}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Net Revenue Retention</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">{dashboardMetrics.nrr}%</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            <Card >
                <Text as="h3" variant="headingMd">Revenue by Month</Text>
              <Box >
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0442bf" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card >
                <Text as="h3" variant="headingMd">Repeat Purchase Rate</Text>
              <Box>
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={visitFrequencies}
                      dataKey="value"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {visitFrequencies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text as="h3" variant="headingMd">Efficiency Metrics</Text>
            <BlockStack gap="200">
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Order Value:</Text>
                <Text as="h3" fontWeight="semibold">${dashboardMetrics.aov}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Customer Visits per Year:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.avgVisits}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Items per Order:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.avgItems}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Payback Period:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.paybackDays} days</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
