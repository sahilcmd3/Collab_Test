import { msalInstance } from "@/config/azure";
import { container } from "@/config/azure";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

// Function to log in with Email and Password using Azure AD B2C
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const loginRequest = {
      scopes: ["User.Read"],
      loginHint: email,
    };

    const response = await msalInstance.loginPopup(loginRequest);
    const user = await fetchUserProfile(response.accessToken);
    console.log("Logged in with email:", user.email);
    return user;
  } catch (error) {
    console.error("Error logging in with email:", error.message);
    throw new Error("Invalid credentials or user does not exist.");
  }
};

// Function to log in with Google using Azure AD B2C
export const loginWithGoogle = async () => {
  try {
    const loginRequest = {
      scopes: ["User.Read"],
      extraQueryParameters: { prompt: "select_account" },
    };

    const response = await msalInstance.loginPopup(loginRequest);
    const user = await fetchUserProfile(response.accessToken);

    console.log("Logged in with Google:", user.displayName);

    const userRef = container.item(user.id);
    const { resource: docSnap } = await userRef.read();

    if (!docSnap) {
      // Create a new user model in Cosmos DB
      const newUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "/robotic.png",
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
      };
      await container.items.create(newUser);
      console.log("New user created in Cosmos DB:", user.displayName);
    } else {
      console.log("User already exists, logging in:", user.displayName);
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error logging in with Google:", error.message);
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
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error("Error fetching user profile", error);
    throw new Error("Failed to fetch user profile");
  }
};