import { PublicClientApplication } from "@azure/msal-browser";
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

// Azure AD B2C Configuration
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID,
    authority: process.env.NEXT_PUBLIC_AZURE_AD_B2C_AUTHORITY,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_AD_B2C_REDIRECT_URI,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Azure Cosmos DB Configuration
const cosmosClient = new CosmosClient({
  endpoint: process.env.NEXT_PUBLIC_AZURE_COSMOS_DB_ENDPOINT,
  key: process.env.NEXT_PUBLIC_AZURE_COSMOS_DB_KEY,
});

const database = cosmosClient.database("your-database-name");
const container = database.container("your-container-name");

// Azure Storage Configuration
const blobServiceClient = new BlobServiceClient(
  `https://${process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_KEY
);

// Azure OpenAI Configuration
const openaiClient = new OpenAIClient(
  process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY)
);

export { msalInstance, cosmosClient, blobServiceClient, container, openaiClient };
export default msalInstance;