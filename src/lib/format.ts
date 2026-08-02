export const brl = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlExact = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const hoje = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const diasAte = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - hoje().getTime()) / 86_400_000);
};

export const isoOffset = (days: number): string => {
  const d = hoje();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const soDigitos = (v: string): string => v.replace(/\D/g, "");
