import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cockpit Grupo Ordos',
  description: 'Reunião de Marketing — Grupo Ordos. Alavancas, Pautas, Estratégia, Indicadores e Encaminhamentos.',
};

export default function GrupoOrdosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
