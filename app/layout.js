import './globals.css';

export const metadata = {
  title: 'Тест по Python: строки, списки, множества',
  description: 'Тест с автоматической проверкой кода',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
