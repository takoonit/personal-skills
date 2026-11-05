import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscounts } from '../src/discount.js';

test('caps a big coupon at 50%', () => assert.equal(applyDiscounts(100, [{ rate: 0.8 }]), 50));
test('applies a small coupon', () => assert.equal(applyDiscounts(100, [{ rate: 0.1 }]), 90));
