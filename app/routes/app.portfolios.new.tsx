import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Divider, Badge, Box} from '@shopify/polaris';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Pie, Cell} from 'recharts';
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

export default function NewPortfolio() {

  return (
    <Page>
        <Layout>
            <Text as="h1">New Portfolio</Text>
            <Card></Card>
        </Layout>
    </Page>

  );
}