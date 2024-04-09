import envinfo from 'envinfo';
import {platform} from 'os';
import {EnvironmentInfo} from './types';

/**
 * Returns information about the running system.
 * If `json === true`, or no options are passed,
 * the return type will be an `EnvironmentInfo`.
 * If set to `false`, it will be a `string`.
 */
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
