import 'bulma/css/bulma.min.css';
import './globals.css';

export const metadata = {
  title: "LPSS | TOTP",
  description: "Learn how to use Authenticator Apps for 2FA Login",
  icons: {
    icon: `${process.env.BASE_PATH || ''}/favicon.png`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="" style={{ minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
