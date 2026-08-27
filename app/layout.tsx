import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cockpit de Gestão de Marketing',
  description: 'Reunião de Marketing — Alavancas, Pautas, Estratégia, Indicadores e Encaminhamentos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
