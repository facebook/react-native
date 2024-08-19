/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import envinfo from 'envinfo';
import {platform} from 'os';
import {EnvironmentInfo} from './types';

export async function getEnvironmentInfoAsString(): Promise<string> {
  return getEnvironmentInfo(false);
}

export async function getEnvironmentInfoAsJson(): Promise<EnvironmentInfo> {
  return JSON.parse(await getEnvironmentInfo(true));
}

async function getEnvironmentInfo(json: boolean): Promise<string> {
  const options = {json, showNotFound: true};

  const packages = ['react', 'react-native', '@react-native-community/cli'];

  const outOfTreePlatforms: {[key: string]: string} = {
    darwin: 'react-native-macos',
    win32: 'react-native-windows',
  };

  const outOfTreePlatformPackage = outOfTreePlatforms[platform()];
  if (outOfTreePlatformPackage) {
    packages.push(outOfTreePlatformPackage);
  }

  const info = await envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio', 'Visual Studio'],
      Managers: ['CocoaPods'],
      Languages: ['Java', 'Ruby'],
      SDKs: ['iOS SDK', 'Android SDK', 'Windows SDK'],
      npmPackages: packages,
      npmGlobalPackages: ['*react-native*'],
    },
    options,
  );

  return info.trim();
}
