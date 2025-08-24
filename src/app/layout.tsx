// src/app/layout.tsx
import './globals.css'; // not ../ or from a nested route

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}