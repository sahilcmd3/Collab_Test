import { msalInstance } from "@/config/azure";

const logout = async () => {
  try {
    await msalInstance.logoutRedirect();
    console.log("User logged out");
    // Redirect to login page after logout
    window.location.href = "/login";
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
};

export default logout;