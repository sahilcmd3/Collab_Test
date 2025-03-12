"use client";

import { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useAuth } from "@/context/AuthProvider";

const LiveCursor = ({ workspaceId }) => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    if (!user || !workspaceId) return;

    // Initialize SignalR connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_AZURE_SIGNALR_ENDPOINT}/cursorHub`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [user, workspaceId]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR");

          // Send cursor position to the server
          const handleMouseMove = (event) => {
            const { clientX, clientY } = event;

            connection.invoke("SendCursorPosition", {
              workspaceId,
              userId: user.uid,
              x: clientX,
              y: clientY,
              displayName: user.displayName || "Anonymous",
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
              timestamp: Date.now(),
            });
          };

          document.addEventListener("mousemove", handleMouseMove);

          // Cleanup
          return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            connection.stop();
          };
        })
        .catch((error) => console.error("Error connecting to SignalR: ", error));

      connection.on("ReceiveCursorPosition", (cursorData) => {
        setCursors((prevCursors) => ({
          ...prevCursors,
          [cursorData.userId]: cursorData,
        }));
      });

      connection.on("RemoveCursor", (userId) => {
        setCursors((prevCursors) => {
          const newCursors = { ...prevCursors };
          delete newCursors[userId];
          return newCursors;
        });
      });
    }
  }, [connection]);

  return (
    <div>
      {Object.entries(cursors).map(([userId, cursor]) =>
        userId !== user?.uid && cursor ? (
          <div
            key={userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: cursor?.x || 0, // Fallback to 0 if undefined
              top: cursor?.y || 0, // Fallback to 0 if undefined
            }}
          >
            {/* User Display Name */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded shadow-md">
              <svg
                className="absolute w-8 h-8 -top-6 left-1/2 -translate-x-1/2"
                viewBox="0 0 24 24"
                fill={cursor?.color || "#ffffff"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 4L20 12L12 20L4 4Z" />
              </svg>
              {cursor?.displayName || "Anonymous"}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
};

export default LiveCursor;