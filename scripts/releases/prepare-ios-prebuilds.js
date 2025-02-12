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

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/*::
type Dependency = $ReadOnly<{
  name: string,
  version: string,
  url: URL,
}>;
*/

async function downloadDependency(
  dependency /*: Dependency*/,
) /*: Promise<void> */ {
  const {name, version, url} = dependency;
  const filename = `${name}-${version}.tgz`;
  const archiveDestination = `/tmp/${filename}`;
  const command = `curl -L ${url.toString()} --output ${archiveDestination}`;

  console.log(`Downloading ${filename}...`);
  await exec(command);

  const destination = `packages/react-native/third-party/${name}`;
  fs.mkdirSync(destination, {recursive: true});

  console.log(`Extracting ${filename} to ${destination}...`);
  await exec(`tar -xzf ${archiveDestination} -C ${destination}`);

  console.log(`Cleaning up ${filename}...`);
  await exec(`rm ${archiveDestination}`);
}

async function main() {
  console.log('Starting iOS prebuilds preparation...');

  console.log('Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
