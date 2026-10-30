import { createServer } from 'node:http';
import { total } from '../domain/total.js';
createServer((req, res) => res.end(String(total([])))).listen(3000);
