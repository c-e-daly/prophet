export const params = {
  templateName: { 
    type: "string", 
    required: true,
    validation: {
      in: ["iwtstandard", "iwtclearance"]
    }
  }
};

export const run = async ({ params, connections, logger }) => {
  const { templateName } = params;
  
  // Validate template name
  const validSuffixes = ["iwtstandard", "iwtclearance"];
  if (!validSuffixes.includes(templateName)) {
    throw new Error(`Invalid template name. Must be one of: ${validSuffixes.join(", ")}`);
  }

  const shopify = connections.shopify.current;
  if (!shopify?.rest) {
    throw new Error("Shopify REST client not available");
  }

  try {
    const { themes } = await shopify.rest.get("/admin/api/2023-04/themes.json");
    const mainTheme = themes.find((theme) => theme.role === "main");

    if (!mainTheme) {
      throw new Error("No published theme found");
    }

    const themeId = mainTheme.id;
    const baseKey = "templates/product.json";
    const newKey = `templates/product.${templateName}.json`;

    // Check if template already exists
    try {
      await shopify.rest.get(
        `/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=${newKey}`
      );
      logger.warn(`Template ${newKey} already exists - will be overwritten`);
    } catch (error) {
      // Template doesn't exist, which is what we want
    }

    // Get base template
    const { asset } = await shopify.rest.get(
      `/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=${baseKey}`
    );

    if (!asset?.value) {
      throw new Error("Base product.json template not found or empty");
    }

    // Create new template
    await shopify.rest.put(`/admin/api/2023-04/themes/${themeId}/assets.json`, {
      asset: {
        key: newKey,
        value: asset.value,
      },
    });

    logger.info(`Successfully created template: ${newKey}`);

    return {
      success: true,
      message: `Template ${newKey} created successfully`,
      templateName,
      templateKey: newKey,
      themeId
    };
  } catch (error) {
    logger.error(`Failed to create product template: ${error.message}`);
    throw error;
  }
};