// scripts/generateWrapper.ts
import * as fs from 'fs';
import * as path from 'path';

interface WrapperOptions {
  rpcName: string;      // e.g., "get_shop_carts"
  resource: string;     // e.g., "Cart"
  hasEnum?: boolean;    // Does it filter by status enum?
  enumName?: string;    // e.g., "CartStatus"
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function generateWrapper(options: WrapperOptions): string {
  const { rpcName, resource, hasEnum = false, enumName } = options;
  const pascalResource = toPascalCase(resource);
  const camelResource = toCamelCase(resource);
  
  const enumImport = hasEnum && enumName ? `, ${enumName}` : '';
  const enumParamType = hasEnum && enumName ? `  statuses?: ${enumName}[];\n` : '';
  const enumDefault = hasEnum && enumName ? `    statuses,\n` : '';
  const enumRpcParam = hasEnum ? `    p_statuses: statuses,\n` : '';

  return `// app/lib/queries/supabase/${rpcName.replace('get_shop_', 'get')}.ts
// Generated: ${new Date().toISOString()}
import createClient from '../../../../supabase/server';
import type { ${pascalResource}Row${enumImport} } from '../../types/dbTables';

export type Get${pascalResource}Params = {
  monthsBack?: number;
  limit?: number;
  page?: number;
${enumParamType}  beforeId?: number;
};

export type Get${pascalResource}Result = {
  ${camelResource}: ${pascalResource}Row[];
  count: number;
};

export async function ${toCamelCase(rpcName.replace('get_shop_', 'getShop'))}(
  shopId: number,
  params: Get${pascalResource}Params = {}
): Promise<Get${pascalResource}Result> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
${enumDefault}    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('${rpcName}', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
${enumRpcParam}    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching ${camelResource}:', error);
    throw new Error(\`Failed to fetch ${camelResource}: \${error.message}\`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const ${camelResource} = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    ${camelResource},
    count: result.total_count || 0,
  };
}
`;
}

function generateRouteInstructions(options: WrapperOptions): string {
  const { rpcName, resource } = options;
  const pascalResource = toPascalCase(resource);
  const camelResource = toCamelCase(resource);
  const functionName = toCamelCase(rpcName.replace('get_shop_', 'getShop'));

  return `
════════════════════════════════════════════════════════════════════
  ROUTE UPDATE INSTRUCTIONS
════════════════════════════════════════════════════════════════════

✅ FILE GENERATED:
   ./generated/${rpcName.replace('get_shop_', 'get')}.ts

📋 COPY TO:
   cp generated/${rpcName.replace('get_shop_', 'get')}.ts app/lib/queries/supabase/

📝 UPDATE YOUR ROUTE:

REPLACE THIS:
────────────────────────────────────────────────────────────────
import { getEnumsServer } from "../lib/queries/supabase/getEnums.server";

const [data, enums] = await Promise.all([
  // ... your existing query
  getEnumsServer(),
]);

REPLACE WITH:
────────────────────────────────────────────────────────────────
import { ${functionName} } from "../lib/queries/supabase/${rpcName.replace('get_shop_', 'get')}";
import type { ${pascalResource}Row } from "~/lib/types/dbTables";
${options.hasEnum ? `import { ${options.enumName} } from "~/lib/types/dbTables";\n` : ''}
const { ${camelResource}, count } = await ${functionName}(shopsID, {
  monthsBack,
  limit,
  page,
${options.hasEnum ? '  statuses,\n' : ''}});

════════════════════════════════════════════════════════════════════
`;
}

function main() {
  const args = process.argv.slice(2);
  const options: Partial<WrapperOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'hasEnum') {
      options[key] = value === 'true';
    } else {
      options[key as keyof WrapperOptions] = value as any;
    }
  }

  if (!options.rpcName || !options.resource) {
    console.error(`
Usage: npm run generate-wrapper -- --rpcName=<rpc_function_name> --resource=<ResourceName> [options]

Required:
  --rpcName      Existing RPC function name (e.g., "get_shop_carts")
  --resource     Resource name in PascalCase (e.g., "Cart")

Optional:
  --hasEnum      Whether it has status filtering (default: false)
  --enumName     Enum type name (e.g., "CartStatus")

Examples:
  npm run generate-wrapper -- --rpcName=get_shop_carts --resource=Cart
  npm run generate-wrapper -- --rpcName=get_shop_campaigns --resource=Campaign --hasEnum=true --enumName=CampaignStatus
    `);
    process.exit(1);
  }

  const fullOptions: WrapperOptions = {
    rpcName: options.rpcName!,
    resource: options.resource!,
    hasEnum: options.hasEnum || false,
    enumName: options.enumName,
  };

  const outputDir = path.join(process.cwd(), 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const wrapper = generateWrapper(fullOptions);
  const wrapperPath = path.join(outputDir, `${fullOptions.rpcName.replace('get_shop_', 'get')}.ts`);
  fs.writeFileSync(wrapperPath, wrapper);

  console.log(generateRouteInstructions(fullOptions));
  console.log(`✨ Generated wrapper in: ${outputDir}\n`);
}

main();