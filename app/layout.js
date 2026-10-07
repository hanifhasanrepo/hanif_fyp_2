import "./globals.css";
import SessionProviderWrapper from "../components/SessionProviderWrapper";

export const metadata = {
  title: "Football Manager Dashboard",
  description: "Manage your squad, first eleven, and player list.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
