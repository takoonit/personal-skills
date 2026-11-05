export const price = (base, taxRate) => Math.round(base * (1 + taxRate) * 100) / 100;
