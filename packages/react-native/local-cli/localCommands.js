const {
  buildOptions,
  createBuild,
  createLog,
  createRun,
  logOptions,
  runOptions,
} = require('@react-native-community/cli-platform-apple');

const run = {
  name: 'run-visionos',
  description: 'builds your app and starts it on visionOS simulator',
  func: createRun({platformName: 'visionos'}),
  examples: [
    {
      desc: 'Run on a specific simulator',
      cmd: 'npx @callstack/react-native-visionos run-visionos --simulator "Apple Vision Pro"',
    },
  ],
  options: runOptions,
};

const log = {
  name: 'log-visionos',
  description: 'starts visionOS device syslog tail',
  func: createLog({platformName: 'visionos'}),
  options: logOptions,
};

const build = {
  name: 'build-visionos',
  description: 'builds your app for visionOS platform',
  func: createBuild({platformName: 'visionos'}),
  examples: [
      {
      desc: 'Build the app for all visionOS devices in Release mode',
      cmd: 'npx @callstack/react-native-visionos build-visionos --mode "Release"',
      },
  ],
  options: buildOptions,
};

module.exports = [run, log, build];
