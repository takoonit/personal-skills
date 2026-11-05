import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../src/domain/total.js';
test('totals', () => assert.equal(total([{ qty: 2, price: 5 }]), 10));
