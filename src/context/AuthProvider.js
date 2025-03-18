"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance } from "@/config/azure";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccount = async () => {
      const accounts = msalInstance.getAllAccounts();
      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        msalInstance.setActiveAccount(account);
        try {
          const response = await msalInstance.acquireTokenSilent({
            account,
            scopes: ["User.Read"],
          });
          const userProfile = await fetchUserProfile(response.accessToken);
          setUser(userProfile);
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            await msalInstance.acquireTokenRedirect({
              scopes: ["User.Read"],
            });
          } else {
            console.error("Error acquiring token silently", error);
          }
        }
      }
      setLoading(false);
    };

    checkAccount();
  }, []);

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
      return null;
    }
  };

  const login = async () => {
    try {
      await msalInstance.loginRedirect({
        scopes: ["User.Read"],
      });
    } catch (error) {
      console.error("Error during login", error);
    }
  };

  const logout = () => {
    msalInstance.logoutRedirect();
  };

  const fetchUserInvites = async () => {
    if (!user) return [];
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @userId",
        parameters: [{ name: "@userId", value: user.id }],
      };
      const { resources: userData } = await container.items.query(querySpec).fetchAll();
      if (userData.length > 0 && userData[0].invites) {
        return userData[0].invites;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user invites", error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fetchUserInvites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};