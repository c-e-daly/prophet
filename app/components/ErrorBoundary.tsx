// app/components/ErrorBoundary.tsx
import { useRouteError, isRouteErrorResponse, Link } from "@remix-run/react";
import { Page, EmptyState, Button } from "@shopify/polaris";

/**
 * Reusable error boundary for routes
 * Handles 404s, 403s, and unexpected errors with friendly messages
 */
export function ErrorBoundary() {
  const error = useRouteError();

  // Handle expected HTTP errors (404, 403, etc.)
  if (isRouteErrorResponse(error)) {
    return (
      <Page>
        <EmptyState
          heading={getErrorHeading(error.status)}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>{getErrorMessage(error.status, error.data)}</p>
          <div style={{ marginTop: "var(--p-space-400)" }}>
            <Link to="/app">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </EmptyState>
      </Page>
    );
  }

  // Handle unexpected errors
  console.error("Unexpected error:", error);

  return (
    <Page>
      <EmptyState
        heading="Something went wrong"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div style={{ marginTop: "var(--p-space-400)" }}>
          <Link to="/app">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </EmptyState>
    </Page>
  );
}

/**
 * Get friendly heading based on HTTP status
 */
function getErrorHeading(status: number): string {
  switch (status) {
    case 404:
      return "We can't find that page";
    case 403:
      return "You don't have permission";
    case 500:
      return "Something went wrong";
    default:
      return "Oops!";
  }
}

/**
 * Get friendly error message based on status and data
 */
function getErrorMessage(status: number, data?: any): string {
  // Check for custom error messages in data
  if (typeof data === "string") {
    if (data.includes("campaign_not_found") || data.includes("Campaign not found")) {
      return "We cannot seem to find that campaign. It may have been deleted or you may not have access.";
    }
    if (data.includes("program_not_found") || data.includes("Program not found")) {
      return "We cannot seem to find that program. It may have been deleted or you may not have access.";
    }
    if (data.includes("offer_not_found") || data.includes("Offer not found")) {
      return "We cannot seem to find that offer. It may have been deleted or you may not have access.";
    }
  }

  // Default messages by status
  switch (status) {
    case 404:
      return "The page you're looking for doesn't exist or may have been moved.";
    case 403:
      return "You don't have permission to access this resource.";
    case 500:
      return "We encountered a server error. Please try again in a few moments.";
    default:
      return "Something unexpected happened. Please try again.";
  }
}