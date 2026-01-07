import fs from 'fs';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const functions = config.functions || {};

for (const rule of Object.values(functions)) {
  if (rule.runtime !== 'nodejs20.x') {
    throw new Error(
      `Invalid Vercel runtime detected: ${rule.runtime}. Only nodejs20.x is allowed.`
    );
  }
}
