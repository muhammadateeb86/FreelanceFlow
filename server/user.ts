import { storage } from "./storage";
import { User } from "@shared/schema";

/**
 * Helper function to get or create a default user for the system.
 * This is needed for PDF generation and email sending.
 */
export async function getOrCreateDefaultUser(): Promise<User> {
  // Try to get existing user with ID 1
  let user = await storage.getUser(1);
  
  if (!user) {
    try {
      // Create a default user for invoice generation
      user = await storage.createUser({
        username: "default",
        password: "", // Not used for authentication in this app
        name: "Your Business Name",
        email: "your.email@example.com",
        company: "Your Company",
        address: "Your Address",
        phone: "Your Phone Number"
      });
      console.log("Created default user with ID:", user.id);
    } catch (error) {
      console.error("Error creating default user:", error);
      // Even if user creation fails, use fallback values
      user = {
        id: 1,
        username: "default",
        password: "",
        name: "Your Business Name",
        email: "your.email@example.com",
        company: "Your Company",
        address: "Your Business Address",
        phone: "Your Phone Number",
        createdAt: new Date().toISOString()
      };
    }
  }
  
  return user;
}