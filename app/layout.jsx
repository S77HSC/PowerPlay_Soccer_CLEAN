// app/layout.jsx

import "./globals.css"; // Make sure this path is correct relative to this file
import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "PowerPlay Soccer",
  description: "Where players lead the game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#050A1F] text-white min-h-screen font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
