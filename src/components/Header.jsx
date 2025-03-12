"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import InviteNotification from "./InviteNotification";
import { msalInstance } from "@/config/azure";
import { container } from "@/config/azure"; // Cosmos DB instance
import { LayoutDashboard } from "lucide-react";

const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspaceDetails = async () => {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @workspaceId",
        parameters: [
          { name: "@workspaceId", value: workspaceId },
        ],
      };

      const { resources: workspaceData } = await container.items.query(querySpec).fetchAll();
      if (workspaceData.length > 0) {
        setIsPublic(workspaceData[0].isPublic ?? true); // Default to true if field is missing
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  // Fetch User Info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const user = accounts[0];
        const querySpec = {
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [
            { name: "@userId", value: user.homeAccountId },
          ],
        };

        const { resources: userData } = await container.items.query(querySpec).fetchAll();
        if (userData.length > 0) {
          setUserName(userData[0].displayName || user.username); // Use name if available, else email
        } else {
          setUserName(user.name);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-[#0a0f1e] bg-opacity-80 backdrop-blur-lg border-b border-gray-700 shadow-xl z-20">
      {/* Title with Neon Glow Effect */}
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-lg animate-pulse">
        ⚡ SynapseCode
      </h1>

      <InviteNotification />

      <div className="flex items-center gap-6">
        {pathname.startsWith("/workspace/") && (
          <Button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-blue-500/50"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
        )}

        {/* Welcome Message */}
        <p className="text-white text-sm font-medium opacity-90 animate-fadeIn">
          Welcome back, <span className="font-bold text-blue-400">{userName}</span> 👋
        </p>

        {/* Profile Avatar */}
        <Link href="/profile">
          <Avatar className="w-10 h-10 cursor-pointer border-2 border-gray-500 transition-all duration-300 hover:border-blue-400 hover:scale-105">
            <AvatarImage src={msalInstance.getAllAccounts()[0]?.idTokenClaims?.picture || "/robotic.png"} alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;