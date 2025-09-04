
export const metadata = {
  title: "MCP CV Playground",
  description: "Minimal UI to talk to MCP CV server via HTTP proxy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
