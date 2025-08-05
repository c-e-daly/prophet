import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Divider, Badge, Box} from '@shopify/polaris';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Pie, Cell} from 'recharts';


export default function GeoLocation() {

  return (
    <Page>
        <Layout>
            <Text as="h1">Geo Location</Text>
            <Card></Card>
        </Layout>
    </Page>

  );
}