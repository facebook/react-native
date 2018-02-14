/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const findXcodeProject = require('./findXcodeProject');
const findReactNativeScripts = require('../util/findReactNativeScripts');
const parseIOSDevicesList = require('./parseIOSDevicesList');
const findMatchingSimulator = require('./findMatchingSimulator');
const getBuildPath = function(configuration = 'Debug', appName, isDevice) {
  return `build/Build/Products/${configuration}-${isDevice ? 'iphoneos' : 'iphonesimulator'}/${appName}.app`;
};
const xcprettyAvailable = function() {
  try {
    child_process.execSync('xcpretty --version', {
      stdio: [ 0, 'pipe', 'ignore', ]
    });
  } catch (error) {
    return false;
  }
  return true;
};

function runIOS(argv, config, args) {
  if (!fs.existsSync(args.projectPath)) {
    const reactNativeScriptsPath = findReactNativeScripts();
    if (reactNativeScriptsPath) {
      child_process.spawnSync(
        reactNativeScriptsPath,
        ['ios'].concat(process.argv.slice(1)),
        {stdio: 'inherit'}
      );
      return;
    } else {
      throw new Error('iOS project folder not found. Are you sure this is a React Native project?');
    }
  }
  process.chdir(args.projectPath);
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error('Could not find Xcode project files in ios folder');
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  const scheme = args.scheme || inferredSchemeName;
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);
  const devices = parseIOSDevicesList(
    child_process.execFileSync('xcrun', ['instruments', '-s'], {encoding: 'utf8'})
  );
  if (args.device) {
    const selectedDevice = matchingDevice(devices, args.device);
    if (selectedDevice) {
      return runOnDevice(selectedDevice, scheme, xcodeProject, args.configuration, args.packager, args.verbose, args.port);
    } else {
      if (devices && devices.length > 0) {
        console.log('Could not find device with the name: "' + args.device + '".');
        console.log('Choose one of the following:');
        printFoundDevices(devices);
      } else {
        console.log('No iOS devices connected.');
      }
    }
  } else if (args.udid) {
    return runOnDeviceByUdid(args, scheme, xcodeProject, devices);
  } else {
    return runOnSimulator(xcodeProject, args, scheme);
  }
}

function runOnDeviceByUdid(args, scheme, xcodeProject, devices) {
  const selectedDevice = matchingDeviceByUdid(devices, args.udid);
  if (selectedDevice) {
    return runOnDevice(selectedDevice, scheme, xcodeProject, args.configuration, args.packager, args.verbose, args.port);
  } else {
    if (devices && devices.length > 0) {
      console.log('Could not find device with the udid: "' + args.udid + '".');
      console.log('Choose one of the following:');
      printFoundDevices(devices);
    } else {
      console.log('No iOS devices connected.');
    }
  }
}

function runOnSimulator(xcodeProject, args, scheme) {
  return new Promise((resolve) => {
    try {
      var simulators = JSON.parse(
      child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {encoding: 'utf8'})
      );
    } catch (e) {
      throw new Error('Could not parse the simulator list output');
    }

    const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
    if (!selectedSimulator) {
      throw new Error(`Could not find ${args.simulator} simulator`);
    }

    const simulatorFullName = formattedDeviceName(selectedSimulator);
    console.log(`Launching ${simulatorFullName}...`);
    try {
      child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
    } catch (e) {
      // instruments always fail with 255 because it expects more arguments,
      // but we want it to only launch the simulator
    }
    resolve(selectedSimulator.udid);
  })
  .then((udid) => buildProject(xcodeProject, udid, scheme, args.configuration, args.packager, args.verbose, args.port))
  .then((appName) => {
    if (!appName) {
      appName = scheme;
    }
    let appPath = getBuildPath(args.configuration, appName);
    console.log(`Installing ${appPath}`);
    child_process.spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], {stdio: 'inherit'});

    const bundleID = child_process.execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'}
    ).trim();

    console.log(`Launching ${bundleID}`);
    child_process.spawnSync('xcrun', ['simctl', 'launch', 'booted', bundleID], {stdio: 'inherit'});
  });
}

function runOnDevice(selectedDevice, scheme, xcodeProject, configuration, launchPackager, verbose, port) {
  return buildProject(xcodeProject, selectedDevice.udid, scheme, configuration, launchPackager, verbose, port)
  .then((appName) => {
    if (!appName) {
      appName = scheme;
    }
    const iosDeployInstallArgs = [
      '--bundle', getBuildPath(configuration, appName, true),
      '--id' , selectedDevice.udid,
      '--justlaunch'
    ];
    console.log(`installing and launching your app on ${selectedDevice.name}...`);
    const iosDeployOutput = child_process.spawnSync('ios-deploy', iosDeployInstallArgs, {encoding: 'utf8'});
    if (iosDeployOutput.error) {
      console.log('');
      console.log('** INSTALLATION FAILED **');
      console.log('Make sure you have ios-deploy installed globally.');
      console.log('(e.g "npm install -g ios-deploy")');
    } else {
      console.log('** INSTALLATION SUCCEEDED **');
    }
  });
}

function buildProject(xcodeProject, udid, scheme, configuration = 'Debug', launchPackager = false, verbose, port) {
  return new Promise((resolve,reject) =>
  {
     var xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name,
      '-configuration', configuration,
      '-scheme', scheme,
      '-destination', `id=${udid}`,
      '-derivedDataPath', 'build',
    ];
    console.log(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
    let xcpretty;
    if (!verbose) {
      xcpretty = xcprettyAvailable() && child_process.spawn('xcpretty', [], { stdio: ['pipe', process.stdout, process.stderr] });
    }
    const buildProcess = child_process.spawn('xcodebuild', xcodebuildArgs, getProcessOptions(launchPackager, port));
    let buildOutput = '';
    buildProcess.stdout.on('data', function(data) {
      buildOutput += data.toString();
      if (xcpretty) {
        xcpretty.stdin.write(data);
      } else {
        console.log(data.toString());
      }
    });
    buildProcess.stderr.on('data', function(data) {
      console.error(data.toString());
    });
    buildProcess.on('close', function(code) {
      if (xcpretty) {
        xcpretty.stdin.end();
      }
      //FULL_PRODUCT_NAME is the actual file name of the app, which actually comes from the Product Name in the build config, which does not necessary match a scheme name,  example output line: export FULL_PRODUCT_NAME="Super App Dev.app"
      let productNameMatch = /export FULL_PRODUCT_NAME="?(.+).app"?$/m.exec(buildOutput);
      if (productNameMatch && productNameMatch.length && productNameMatch.length > 1) {
        return resolve(productNameMatch[1]);//0 is the full match, 1 is the app name
      }
      return buildProcess.error ? reject(buildProcess.error) : resolve();
    });
  });
}

function matchingDevice(devices, deviceName) {
  if (deviceName === true && devices.length === 1)
  {
    console.log(`Using first available device ${devices[0].name} due to lack of name supplied.`);
    return devices[0];
  }
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].name === deviceName || formattedDeviceName(devices[i]) === deviceName) {
      return devices[i];
    }
  }
}

function matchingDeviceByUdid(devices, udid) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].udid === udid) {
      return devices[i];
    }
  }
}

function formattedDeviceName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

function printFoundDevices(devices) {
  for (let i = devices.length - 1; i >= 0; i--) {
    console.log(devices[i].name + ' Udid: ' + devices[i].udid);
  }
}

function getProcessOptions(launchPackager, port) {
  if (launchPackager) {
    return {
      env: { ...process.env, RCT_METRO_PORT: port }
    };
  }

  return {
    env: { ...process.env, RCT_NO_LAUNCH_PACKAGER: true },
  };
}

module.exports = {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: runIOS,
  examples: [
  {
    desc: 'Run on a different simulator, e.g. iPhone 5',
    cmd: 'react-native run-ios --simulator "iPhone 5"',
  },
  {
    desc: 'Pass a non-standard location of iOS directory',
    cmd: 'react-native run-ios --project-path "./app/ios"',
  },
  {
    desc: "Run on a connected device, e.g. Max's iPhone",
    cmd: 'react-native run-ios --device "Max\'s iPhone"',
  },
  ],
  options: [{
    command: '--simulator [string]',
    description: 'Explicitly set simulator to use',
    default: 'iPhone 6',
  } , {
    command: '--configuration [string]',
    description: 'Explicitly set the scheme configuration to use',
  } , {
    command: '--scheme [string]',
    description: 'Explicitly set Xcode scheme to use',
  }, {
    command: '--project-path [string]',
    description: 'Path relative to project root where the Xcode project '
      + '(.xcodeproj) lives. The default is \'ios\'.',
    default: 'ios',
  }, {
    command: '--device [string]',
    description: 'Explicitly set device to use by name.  The value is not required if you have a single device connected.',
  }, {
    command: '--udid [string]',
    description: 'Explicitly set device to use by udid',
  }, {
    command: '--no-packager',
    description: 'Do not launch packager while building',
  }, {
    command: '--verbose',
    description: 'Do not use xcpretty even if installed',
  },{
    command: '--port [number]',
    default: process.env.RCT_METRO_PORT || 8081,
    parse: (val: string) => Number(val),
  }],
};
