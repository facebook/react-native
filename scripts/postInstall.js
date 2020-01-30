const child_process = require('child_process');

const isMacOS = process.platform === 'darwin';
if (isMacOS) {
  child_process.execSync('source scripts/fixmacscripts.sh', {stdio: 'inherit'});
}
