// Remix / Node
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, TextField, Button, InlineStack, BlockStack, Text, Banner, Modal
} from "@shopify/polaris";
import type { Database } from "../../supabase/database.types";
import { useState, useMemo } from "react";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server"