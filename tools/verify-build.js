/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const requiredBuildFiles = ['web.js', 'backup.js'];
const missing = requiredBuildFiles.filter((file) => (
  !fs.existsSync(path.resolve(__dirname, '..', 'build', file))
));

if (missing.length) {
  throw new Error(`Build verification failed; missing: ${missing.join(', ')}`);
}

const hash = bcrypt.hashSync('pixelplanet-ci-check', 8);
if (!bcrypt.compareSync('pixelplanet-ci-check', hash)) {
  throw new Error('bcryptjs verification failed');
}

console.log('Build verification passed');
