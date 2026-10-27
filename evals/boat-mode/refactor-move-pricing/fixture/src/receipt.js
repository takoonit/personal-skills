import { price } from './calc.js';
export const receipt = (base) => `Total: ${price(base, 0.07)}`;
