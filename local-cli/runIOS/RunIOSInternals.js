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
const parseIOSDevicesList = require('./parseIOSDevicesList');
const findMatchingSimulator = require('./findMatchingSimulator');

function RunIOSInternals(os_device,
                         os_simulator,
                         os_scheme_suffix,
                         os_type,
                         os_run_name,
                         os_default_simulator) {
  this.os_device = os_device;
  this.os_simulator = os_simulator;
  this.os_scheme_suffix = os_scheme_suffix;
  this.os_type = os_type;
  this.os_run_name = os_run_name;
  this.os_default_simulator = os_default_simulator;
}

RunIOSInternals.prototype.getBuildPath = function(configuration = 'Debug', appName, isDevice) {
  return `build/Build/Products/${configuration}-${isDevice ? this.os_device : this.os_simulator}/${appName}.app`;
};

RunIOSInternals.prototype.runIOS = function(argv, config, args) {
  process.chdir(args.projectPath);
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error('Could not find Xcode project files in ios folder');
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name)) + this.os_scheme_suffix;
  const scheme = args.scheme || inferredSchemeName;
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);
  const devices = parseIOSDevicesList(
    child_process.execFileSync('xcrun', ['instruments', '-s'], {encoding: 'utf8'})
  );
  if (args.device) {
    const selectedDevice = this.matchingDevice(devices, args.device);
    if (selectedDevice){
      return this.runOnDevice(selectedDevice, scheme, xcodeProject, args.configuration, args.packager);
    } else {
      if (devices){
        console.log('Could not find device with the name: "' + args.device + '".');
        console.log('Choose one of the following:');
        this.printFoundDevices(devices);
      } else {
        console.log('No ' + this.os_type + ' devices connected.');
      }
    }
  } else if (args.udid) {
    return this.runOnDeviceByUdid(args, scheme, xcodeProject, devices);
  } else {
    return this.runOnSimulator(xcodeProject, args, inferredSchemeName, scheme);
  }
};

RunIOSInternals.prototype.runOnDeviceByUdid = function(args, scheme, xcodeProject, devices) {
  const selectedDevice = this.matchingDeviceByUdid(devices, args.udid);
  if (selectedDevice){
    return this.runOnDevice(selectedDevice, scheme, xcodeProject, args.configuration, args.packager);
  } else {
    if (devices){
      console.log('Could not find device with the udid: "' + args.udid + '".');
      console.log('Choose one of the following:');
      this.printFoundDevices(devices);
    } else {
      console.log('No ' + this.os_type + ' devices connected.');
    }
  }
};

RunIOSInternals.prototype.runOnSimulator = function(xcodeProject, args, inferredSchemeName, scheme){
  return new Promise((resolve) => {
    try {
      var simulators = JSON.parse(
      child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {encoding: 'utf8'})
      );
    } catch (e) {
      throw new Error('Could not parse the simulator list output');
    }

    const selectedSimulator = findMatchingSimulator(simulators, args.simulator, this.os_type);
    if (!selectedSimulator) {
      throw new Error(`Could not find ${args.simulator} simulator`);
    }

    const simulatorFullName = this.formattedDeviceName(selectedSimulator);
    console.log(`Launching ${simulatorFullName}...`);
    try {
      child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
    } catch (e) {
      // instruments always fail with 255 because it expects more arguments,
      // but we want it to only launch the simulator
    }
    resolve(selectedSimulator.udid)
  })
  .then((udid) => this.buildProject(xcodeProject, udid, scheme, args.configuration, args.packager))
  .then((appName) => {
    if (!appName) {
      appName = inferredSchemeName;
    }
    let appPath = this.getBuildPath(args.configuration, appName);
    console.log(`Installing ${appPath}`);
    child_process.spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], {stdio: 'inherit'});

    const bundleID = child_process.execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'}
    ).trim();

    console.log(`Launching ${bundleID}`);
    child_process.spawnSync('xcrun', ['simctl', 'launch', 'booted', bundleID], {stdio: 'inherit'});
  })
};

RunIOSInternals.prototype.runOnDevice = function(selectedDevice, scheme, xcodeProject, configuration, launchPackager) {
  return this.buildProject(xcodeProject, selectedDevice.udid, scheme, configuration, launchPackager)
  .then((appName) => {
    if (!appName) {
      appName = scheme;
    }
    const iosDeployInstallArgs = [
      '--bundle', this.getBuildPath(configuration, appName, true),
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
};

RunIOSInternals.prototype.buildProject = function(xcodeProject, udid, scheme, configuration = 'Debug', launchPackager = false) {
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
    const buildProcess = child_process.spawn('xcodebuild', xcodebuildArgs, this.getProcessOptions(launchPackager));
    let buildOutput = "";
    buildProcess.stdout.on('data', function(data) {
      console.log(data.toString());
      buildOutput += data.toString();
    });
    buildProcess.stderr.on('data', function(data) {
      console.error(data.toString());
    });
    buildProcess.on('close', function(code) {
      //FULL_PRODUCT_NAME is the actual file name of the app, which actually comes from the Product Name in the build config, which does not necessary match a scheme name,  example output line: export FULL_PRODUCT_NAME="Super App Dev.app"
      let productNameMatch = /export FULL_PRODUCT_NAME="?(.+).app"?$/.exec(buildOutput);
      if (productNameMatch && productNameMatch.length && productNameMatch.length > 1) {
        return resolve(productNameMatch[1]);//0 is the full match, 1 is the app name
      }
      return buildProcess.error? reject(error) : resolve();
    });
  });
};

RunIOSInternals.prototype.matchingDevice = function(devices, deviceName) {
  if (deviceName === true && devices.length === 1)
  {
    console.log(`Using first available device ${devices[0].name} due to lack of name supplied.`)
    return devices[0];
  }
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].name === deviceName || this.formattedDeviceName(devices[i]) === deviceName) {
      return devices[i];
    }
  }
};

RunIOSInternals.prototype.matchingDeviceByUdid = function(devices, udid) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].udid === udid) {
      return devices[i];
    }
  }
};

RunIOSInternals.prototype.formattedDeviceName = function(simulator) {
  return `${simulator.name} (${simulator.version})`;
};

RunIOSInternals.prototype.printFoundDevices = function(devices){
  for (let i = devices.length - 1; i >= 0; i--) {
    console.log(devices[i].name + ' Udid: ' + devices[i].udid);
  }
};

RunIOSInternals.prototype.getProcessOptions = function(launchPackager) {
  if (launchPackager) {
    return {};
  }

  return {
    env: Object.assign({}, process.env, { RCT_NO_LAUNCH_PACKAGER: true }),
  };
};

RunIOSInternals.prototype.makeExports = function() {
  return {
    name: this.os_run_name,
    description: 'builds your app and starts it on ' + this.os_type + ' simulator',
    func: this.runIOS.bind(this),
    examples: [
    {
      desc: 'Run on a different simulator, e.g. iPhone 5',
      cmd: 'react-native ' + this.os_run_name + ' --simulator "iPhone 5"',
    },
    {
      desc: 'Pass a non-standard location of ' + this.os_type + ' directory',
      cmd: 'react-native ' + this.os_run_name + ' --project-path "./app/ios"',
    },
    {
      desc: "Run on a connected device, e.g. Max's iPhone",
      cmd: 'react-native ' + this.os_run_name + ' --device "Max\'s iPhone"',
    },
    ],
    options: [{
      command: '--simulator [string]',
      description: 'Explicitly set simulator to use',
      default: this.os_default_simulator,
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
    }],
  };
};

module.exports = RunIOSInternals;
