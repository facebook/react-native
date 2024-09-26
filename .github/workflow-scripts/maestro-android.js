/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const childProcess = require('child_process');

const usage = `
=== Usage ===
node maestro-android.js <path to app> <app_id> <maestro_flow> <flavor> <working_directory>

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the maestro flow to be executed
@param {string} flavor - Flavor of the app to be launched. Can be 'release' or 'debug'
@param {string} workingDirectory - Working directory from where to run Metro
==============
`;

const args = process.argv.slice(2);

if (args.length !== 5) {
  throw new Error(`Invalid number of arguments.\n${usage}`);
}

const APP_PATH = args[0];
const APP_ID = args[1];
const MAESTRO_FLOW = args[2];
const IS_DEBUG = args[3] === 'debug';
const WORKING_DIRECTORY = args[4];

async function main() {
  console.info('\n==============================');
  console.info('Running tests for Android with the following parameters:');
  console.info(`APP_PATH: ${APP_PATH}`);
  console.info(`APP_ID: ${APP_ID}`);
  console.info(`MAESTRO_FLOW: ${MAESTRO_FLOW}`);
  console.info(`IS_DEBUG: ${IS_DEBUG}`);
  console.info(`WORKING_DIRECTORY: ${WORKING_DIRECTORY}`);
  console.info('==============================\n');

  console.info('Install app');
  childProcess.execSync(`adb install ${APP_PATH}`, {stdio: 'ignore'});

  let metroProcess = null;
  if (IS_DEBUG) {
    console.info('Start Metro');
    childProcess.execSync(`cd ${WORKING_DIRECTORY}`, {stdio: 'ignore'});
    metroProcess = childProcess.spawn('yarn', ['start', '&'], {
      cwd: WORKING_DIRECTORY,
      stdio: 'ignore',
      detached: true,
    });
    console.info(`- Metro PID: ${metroProcess.pid}`);
  }

  console.info('Wait For Metro to Start');
  await sleep(5000);

  console.info('Start the app');
  childProcess.execSync(`adb shell monkey -p ${APP_ID} 1`, {stdio: 'ignore'});

  console.info('Start recording to /sdcard/screen.mp4');
  childProcess
    .exec('adb shell screenrecord /sdcard/screen.mp4', {
      stdio: 'ignore',
      detached: true,
    })
    .unref();

  console.info(`Start testing ${MAESTRO_FLOW}`);
  let error = null;
  try {
    childProcess.execSync(
      `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 $HOME/.maestro/bin/maestro test ${MAESTRO_FLOW} --format junit -e APP_ID=${APP_ID} --debug-output /tmp/MaestroLogs`,
      {stdio: 'inherit'},
    );
  } catch (err) {
    error = err;
  } finally {
    console.info('Stop recording');
    childProcess.execSync('adb pull /sdcard/screen.mp4', {stdio: 'ignore'});

    if (IS_DEBUG && metroProcess != null) {
      const pid = metroProcess.pid;
      console.info(`Kill Metro. PID: ${pid}`);
      process.kill(-pid);
      console.info(`Metro Killed`);
      process.exit();
    }
  }

  if (error) {
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

main();
