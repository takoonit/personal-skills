import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receipt } from '../src/receipt.js';
test('receipt', () => assert.equal(receipt(100), 'Total: 107'));
