export const total = (lines) => lines.reduce((s, l) => s + l.qty * l.price, 0);
