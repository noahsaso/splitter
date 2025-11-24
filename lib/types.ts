export type Receipt = {
  restaurant: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  items: { id: number; name: string; price: number }[];
};

export type PersonTotal = {
  items: Array<{ id: number; name: string; price: number; splitPrice: number }>;
  subtotal: number;
  total: number;
};

export type Theme = {
  bg: string;
  text: string;
  card: string;
  cardGlass: string;
  border: string;
  divide: string;
  muted: string;
  faint: string;
  veryFaint: string;
  iconBg: string;
  activeRow: string;
  toggleBtn: string;
  spinner: string;
  pillSelected: string;
  pillUnselected: string;
  rowBg: string;
  errorBg: string;
  errorText: string;
  warningBg: string;
  warningText: string;
};
