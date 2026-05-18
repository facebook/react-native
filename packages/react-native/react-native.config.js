/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*::
import type {Command} from '@react-native-community/cli-types';
 */

// React Native shouldn't be exporting itself like this, the Community Template should be be directly
// depending on and injecting:
// - @react-native-community/cli-platform-android
// - @react-native-community/cli-platform-ios
// - @react-native/community-cli-plugin
// - codegen command should be inhoused into @react-native-community/cli
//
// This is a temporary workaround.

const verbose = Boolean(process.env.DEBUG?.includes('react-native'));

function findCommunityPlatformPackage(
  spec /*: string */,
  startDir /*: string */ = process.cwd(),
) {
  // In monorepos, we cannot make any assumptions on where
  // `@react-native-community/*` gets installed. The safest way to find it
  // (barring adding an optional peer dependency) is to start from the project
  // root.
  //
  // Note that we're assuming that the current working directory is the project
  // root. This is also what `@react-native-community/cli` assumes (see
  // https://github.com/react-native-community/cli/blob/14.x/packages/cli-tools/src/findProjectRoot.ts).
  const main = require.resolve(spec, {paths: [startDir]});
  // $FlowFixMe[unsupported-syntax]
  return require(main);
}

let android;
try {
  android = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-android',
  );
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-android not found, the react-native.config.js may be unusable.',
    );
  }
}

let ios;
try {
  ios = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-ios',
  );
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-ios not found, the react-native.config.js may be unusable.',
    );
  }
}

const commands /*: Array<Command> */ = [];

const {
  bundleCommand,
  startCommand,
} = require('@react-native/community-cli-plugin');

commands.push(bundleCommand, startCommand);

const codegenCommand /*: Command */ = {
  name: 'codegen',
  options: [
    {
      name: '--path <path>',
      description: 'Path to the React Native project root.',
      default: process.cwd(),
    },
    {
      name: '--platform <string>',
      description:
        'Target platform. Supported values: "android", "ios", "all".',
      default: 'all',
    },
    {
      name: '--outputPath <path>',
      description: 'Path where generated artifacts will be output to.',
    },
    {
      name: '--source <string>',
      description: 'Whether the script is invoked from an `app` or a `library`',
      default: 'app',
    },
  ],
  func: (argv, config, args) =>
    require('./scripts/codegen/generate-artifacts-executor').execute(
      args.path,
      args.platform,
      args.outputPath,
      args.source,
    ),
};

commands.push(codegenCommand);

const spmCommand /*: Command */ = {
  name: 'spm [action]',
  description:
    'Set up or maintain Swift Package Manager support for the iOS/macOS app. ' +
    'Actions: init, update, sync, clean, codegen, download, scaffold. ' +
    'With no action: defaults to update.',
  options: [
    {
      name: '--version <string>',
      description:
        'React Native version (e.g. 0.80.0). Defaults to the version in node_modules/react-native/package.json.',
    },
    {
      name: '--localXcframework <path>',
      description: 'Use a local React.xcframework instead of downloading.',
    },
    {
      name: '--artifactsDir <path>',
      description: 'Override the artifact cache directory.',
    },
    {
      name: '--flavor <string>',
      description: 'Artifact flavor: debug or release.',
    },
    {
      name: '--skipCodegen',
      description: 'Skip react-native codegen step.',
    },
    {
      name: '--skipDownload',
      description: 'Skip automatic artifact download.',
    },
    {
      name: '--forceDownload',
      description: 'Clear cached artifacts and re-download from Maven.',
    },
    {
      name: '--skipXcodeproj',
      description: 'Skip .xcodeproj generation.',
    },
    {
      name: '--bundleIdentifier <string>',
      description: 'Override CFBundleIdentifier in the generated Info.plist.',
    },
    {
      name: '--productName <string>',
      description: 'Override PRODUCT_NAME in the generated Info.plist.',
    },
    {
      name: '--entryFile <path>',
      description:
        'JS entry file relative to app root (default: package.json "main" or index.js).',
    },
    {
      name: '--project',
      description:
        '[clean] Also remove Package.swift and <App>-SPM.xcodeproj/.',
    },
    {
      name: '--derivedData',
      description:
        "[clean] Also remove this app's DerivedData (~/Library/Developer/Xcode/DerivedData/<App>-SPM-*).",
    },
    {
      name: '--cache',
      description:
        '[clean] Also remove the cached xcframework slot for the current resolved version.',
    },
    {
      name: '--all',
      description: '[clean] Shorthand for --project --derivedData --cache.',
    },
    {
      name: '--yes',
      description:
        '[clean] Skip the confirmation prompt for destructive scopes.',
    },
    // Workaround for @react-native-community/cli: when any positional equals
    // "init" (including our `spm init` action), the CLI naively appends
    // `--platform-name <platform>` to argv. Accept and ignore it so commander
    // does not reject the unknown option.
    {
      name: '--platform-name <string>',
      description: '(ignored — CLI compatibility shim for `spm init`)',
    },
  ],
  func: async (argv, _config, args) => {
    const passthrough /*: Array<string> */ = [];
    if (argv[0] != null) {
      passthrough.push(argv[0]);
    }
    const stringOpts /*: Array<[string, string]> */ = [
      ['version', '--version'],
      ['localXcframework', '--local-xcframework'],
      ['artifactsDir', '--artifacts-dir'],
      ['flavor', '--flavor'],
      ['bundleIdentifier', '--bundle-identifier'],
      ['productName', '--product-name'],
      ['entryFile', '--entry-file'],
    ];
    for (const [key, flag] of stringOpts) {
      if (args[key] != null) {
        passthrough.push(flag, String(args[key]));
      }
    }
    const boolOpts /*: Array<[string, string]> */ = [
      ['skipCodegen', '--skip-codegen'],
      ['skipDownload', '--skip-download'],
      ['forceDownload', '--force-download'],
      ['skipXcodeproj', '--skip-xcodeproj'],
      ['project', '--project'],
      ['derivedData', '--derived-data'],
      ['cache', '--cache'],
      ['all', '--all'],
      ['yes', '--yes'],
    ];
    for (const [key, flag] of boolOpts) {
      if (args[key]) {
        passthrough.push(flag);
      }
    }
    await require('./scripts/setup-apple-spm').main(passthrough);
  },
};

commands.push(spmCommand);

const config = {
  commands,
  platforms: {} /*:: as {[string]: Readonly<{
      projectConfig: unknown,
      dependencyConfig: unknown,
    }>} */,
};

if (ios != null) {
  config.commands.push(...ios.commands);
  config.platforms.ios = {
    projectConfig: ios.projectConfig,
    dependencyConfig: ios.dependencyConfig,
  };
}

if (android != null) {
  config.commands.push(...android.commands);
  config.platforms.android = {
    projectConfig: android.projectConfig,
    dependencyConfig: android.dependencyConfig,
  };
}

module.exports = config;
