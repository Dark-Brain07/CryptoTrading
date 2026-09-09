import type { Metadata } from 'next';
import ClientHome from './ClientHome';

export const metadata: Metadata = {
  other: {
    'base:app_id': '6aa13b703ebd729e7bff107b',
  },
};

export default function Home() {
  return <ClientHome />;
}
