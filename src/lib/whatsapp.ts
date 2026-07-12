import { SITE } from '@/lib/site';
import type { CartSnapshot } from '@/types/cart';

function fmtPrice(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: SITE.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function unitWord(unit: string): string {
  if (unit === 'kg') return 'kg';
  if (unit === 'lb') return 'lb';
  return 'und';
}

export function buildWhatsAppCartMessage(items: CartSnapshot): string {
  if (items.length === 0) {
    return 'Hola La Colina, me interesa conocer sus productos.';
  }

  const lines = items.map((item) => {
    const qty = `${item.quantity} ${unitWord(item.unit_label)}`;
    if (item.price != null) {
      return `\u2022 ${item.name} \u2014 ${fmtPrice(item.price)} / ${unitWord(item.unit_label)} (${qty})`;
    }
    return `\u2022 ${item.name} (${qty})`;
  });

  const total = items.reduce((acc, i) => acc + (i.price ?? 0) * i.quantity, 0);
  const totalLine =
    total > 0
      ? `\nTotal estimado: ${fmtPrice(total)} COP`
      : '\n(Quedamos a la espera de cotizaci\u00f3n del yogurt seg\u00fan presentaci\u00f3n)';

  return [
    'Hola *Quesos La Colina*, me interesa hacer un pedido:',
    '',
    ...lines,
    totalLine,
    '',
    'Quedo atento(a) a la confirmaci\u00f3n y los datos de pago/entrega. \ud83e\uddc0',
  ].join('\n');
}

export function buildWhatsAppCartUrl(items: CartSnapshot): string {
  const phone = SITE.phoneRaw.replace(/\D/g, '');
  const text = encodeURIComponent(buildWhatsAppCartMessage(items));
  return `https://wa.me/${phone}?text=${text}`;
}
