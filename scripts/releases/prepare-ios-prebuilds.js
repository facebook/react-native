/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

require('../babel-register').registerForScript();

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const exec = util.promisify(require('child_process').exec);

/*::
type Dependency = $ReadOnly<{
  name: string,
  version: string,
  url: URL,
  prepareScript?: string,
}>;
*/

const dependencies /*: $ReadOnlyArray<Dependency> */ = [
  {
    name: 'glog',
    version: '0.3.5',
    url: new URL(
      'https://github.com/google/glog/archive/refs/tags/v0.3.5.tar.gz',
    ),
    prepareScript: './packages/react-native/scripts/ios-configure-glog.sh',
  },
];

async function downloadDependency(
  dependency /*: Dependency*/,
) /*: Promise<void> */ {
  const {name, url} = dependency;
  const filename = `${name}.tgz`;
  const archiveDestination = `/tmp/${filename}`;
  const command = `curl -L ${url.toString()} --output ${archiveDestination}`;

  console.log(`Downloading ${filename}...`);
  await exec(command);

  const destination = `packages/react-native/third-party/${name}`;
  fs.mkdirSync(destination, {recursive: true});

  console.log(`Extracting ${filename} to ${destination}...`);
  await exec(
    `tar -xzf ${archiveDestination} -C ${destination} --strip-components 1`,
  );

  console.log(`Cleaning up ${filename}...`);
  await exec(`rm ${archiveDestination}`);

  if (dependency.prepareScript) {
    const scriptPath = dependency.prepareScript;
    console.log(`Running ${scriptPath}...`);
    const finalPath = path.join(destination, 'prepare.sh');
    fs.copyFileSync(scriptPath, finalPath);
    execSync('./prepare.sh', {cwd: destination, stdio: 'inherit'});
  }
}

async function main() {
  console.log('Starting iOS prebuilds preparation...');

  await Promise.all(dependencies.map(downloadDependency));

  console.log('Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
