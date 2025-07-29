import { LoginErrorType } from "@shopify/shopify-app-remix/server";

type LoginErrors = {
  shop?: LoginErrorType;
};

export function loginErrorMessage(loginErrors?: LoginErrors): { shop?: string } {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }

  return {};
}
