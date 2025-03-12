"use client";
import { useState, useEffect, useRef } from "react";
import { container } from "@/config/azure";
import { UserPlus, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthProvider";

export default function SearchBar({ workspaceId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState(new Set()); // Store members as a Set
  const { user } = useAuth();
  const currentUserEmail = user?.email;
  const searchRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      fetchUsers(searchTerm.toLowerCase());
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchWorkspaceMembers = async () => {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.workspaceId = @workspaceId AND c.type = 'member'",
        parameters: [{ name: "@workspaceId", value: workspaceId }],
      };
      const { resources: membersData } = await container.items.query(querySpec).fetchAll();
      const membersSet = new Set(membersData.map(member => member.userId)); // Store member userIds
      setWorkspaceMembers(membersSet);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      toast.error("Failed to fetch workspace members");
    }
  };

  const fetchUsers = async (term) => {
    setLoading(true);
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.type = 'user' AND CONTAINS(LOWER(c.email), @term)",
        parameters: [{ name: "@term", value: term }],
      };
      const { resources: usersData } = await container.items.query(querySpec).fetchAll();

      // Filter out current user and existing workspace members
      const matchedUsers = usersData.filter(user => user.email !== currentUserEmail && !workspaceMembers.has(user.id));
      setUsers(matchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, userEmail) => {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: userId }],
      };
      const { resources: userData } = await container.items.query(querySpec).fetchAll();
      if (userData.length > 0) {
        const userItem = userData[0];
        if (!userItem.invites) {
          userItem.invites = [];
        }
        userItem.invites.push(workspaceId);
        await container.item(userItem.id).replace(userItem);

        toast.success(`${userEmail} has been invited.`);
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    }
  };

  return (
    <div className="relative flex items-center">
      <button ref={searchRef} className="rounded-full transition flex items-start gap-2" onClick={() => setIsOpen(!isOpen)}>
        <UserPlus className="w-5 h-5 text-white" />Invite
      </button>

      {isOpen && (
        <div ref={searchRef} className="absolute top-10 right-0 bg-slate-800 p-4 rounded-lg shadow-lg w-96 z-50">
          <div className="flex items-center border-b border-gray-600 pb-2">
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white p-2 text-sm outline-none"
            />
            <button className="ml-2 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && <div className="text-gray-400 text-center mt-2">Loading...</div>}

          <div className="mt-2 max-h-60 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-800 rounded-md">
                <span className="text-white text-sm">{user.email}</span>
                <button
                  className="p-1 bg-blue-500 text-white rounded-md px-4 text-sm hover:bg-blue-600"
                  onClick={() => inviteUser(user.id, user.email)}
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toaster position="right-center" />
    </div>
  );
}