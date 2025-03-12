import { msalInstance } from "@/config/azure";
import { container } from "@/config/azure";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

// Azure Key Vault Configuration
const keyVaultName = process.env.NEXT_PUBLIC_AZURE_KEY_VAULT_NAME;
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

export const signUpUser = async (email) => {
  try {
    // Check if user document exists in Cosmos DB
    const userRef = container.item(email);
    const { resource: userSnap } = await userRef.read();

    if (userSnap) {
      return { success: false, message: "User already exists. Please log in." };
    }

    // Generate verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code in Cosmos DB (expires after 10 minutes)
    await container.items.create({
      id: email,
      type: "emailVerification",
      verifyCode,
      createdAt: new Date().toISOString(),
    });

    // Send verification email
    const emailResponse = await sendVerificationEmail(email, verifyCode);

    if (!emailResponse.success) {
      console.error('Error sending verification email:', emailResponse.message);
      return {
        success: false,
        message: emailResponse.message,
      };
    }

    return {
      success: true,
      message: "Verification email sent. Please check your inbox.",
    };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { success: false, message: error.message };
  }
};

export const verifyEmailCode = async (email, code, password, displayName) => {
  try {
    // Get verification document
    const verificationRef = container.item(email);
    const { resource: verificationSnap } = await verificationRef.read();

    if (!verificationSnap) {
      return { success: false, message: "No verification code found." };
    }

    const { verifyCode, createdAt } = verificationSnap;

    // Check code expiration (10 minutes)
    const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    const now = new Date();
    const codeAge = now - new Date(createdAt);

    if (code !== verifyCode) {
      return { success: false, message: "Incorrect verification code." };
    }

    if (codeAge > expirationTime) {
      await verificationRef.delete();
      return { success: false, message: "Code has expired. Please request a new one." };
    }

    // Create user document in Cosmos DB
    await container.items.create({
      id: email,
      type: "user",
      email,
      displayName,
      photoURL: "/robotic.png",
      authProvider: "email",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      twoFactorEnabled: false,
      workspaces: {},
      settings: {
        theme: "dark",
        fontSize: 14,
        showLineNumbers: true,
        aiSuggestions: true,
      },
      snippets: [],
    });

    // Clean up verification code
    await verificationRef.delete();

    return { success: true, user: { email, displayName } };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const loginRequest = {
      scopes: ["User.Read"],
      extraQueryParameters: { prompt: "select_account" },
    };

    const response = await msalInstance.loginPopup(loginRequest);
    const user = await fetchUserProfile(response.accessToken);

    const userRef = container.item(user.id);
    const { resource: docSnap } = await userRef.read();

    if (!docSnap) {
      await container.items.create({
        id: user.id,
        type: "user",
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "robotic.png",
        authProvider: "google",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        twoFactorEnabled: false,
        workspaces: {},
        settings: {
          theme: "dark",
          fontSize: 14,
          showLineNumbers: true,
          aiSuggestions: true,
        },
        snippets: [],
      });
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to fetch user profile from Microsoft Graph API
const fetchUserProfile = async (token) => {
  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    let profile;
    profile = await response.json();
    return profile;
  } catch (error) {
    console.error("Error fetching user profile", error);
    throw new Error("Failed to fetch user profile");
  }
};