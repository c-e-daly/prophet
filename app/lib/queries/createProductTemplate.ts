
export const params = {
  templateName: { type: "string", required: true }
};

export const run = async ({ params, connections, logger }) => {
  const templateName = params.templateName;

  console.log(templateName);
 
  if (!templateName) {
    throw new Error("Template name is required");
  }

const shopify = connections.shopify.current;
  if (!connections?.shopify?.current) {
    throw new Error("No Shopify shop context available");
  }  
  if (!shopify?.rest) {
    throw new Error("Shopify REST client not available");
  }

  try {
    const { themes } = await shopify.rest.get("/admin/api/2023-04/themes.json");
    const mainTheme = themes.find((theme) => theme.role === "main");

    if (!mainTheme) {
      throw new Error("No published theme found.");
    }
    const themeId = mainTheme.id;

    const baseKey = "templates/product.json";
    const { asset } = await shopify.rest.get(
      `/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=${baseKey}`
    );

    if (!asset?.value) {
      throw new Error("Base product.json template not found or empty.");
    }

    const newKey = `templates/product.${templateName}.json`;
    await shopify.rest.put(`/admin/api/2023-04/themes/${themeId}/assets.json`, {
      asset: {
        key: newKey,
        value: asset.value,
      },
    });

    logger.info(`Created product template: ${newKey}`);

    return {
      message: `Template ${newKey} created successfully`,
      templateName,
      templateKey: newKey,
    };
  } catch (error) {
    logger.error(`Failed to create product template: ${error.message}`);
    throw error;
  }
};
