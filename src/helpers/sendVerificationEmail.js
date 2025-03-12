import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const keyVaultName = process.env.NEXT_PUBLIC_AZURE_KEY_VAULT_NAME;
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

export const sendVerificationEmail = async (email, code) => {
  try {
    const sendGridApiKey = await secretClient.getSecret("SendGridApiKey");
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sendGridApiKey.value}`
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};