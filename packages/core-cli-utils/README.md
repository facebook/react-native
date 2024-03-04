# @react-native/core-cli-utils

![npm package](https://img.shields.io/npm/v/@react-native/core-cli-utils?color=brightgreen&label=npm%20package)

A collection of utilites to help Frameworks build their React Native CLI tooling. This is not intended to be used directly use users of React Native.

## Usage

```js
import { Command } from 'commander';
import cli from '@react-native/core-cli-utils';
import debug from 'debug';

const android = new Command('android');

const frameworkFindsAndroidSrcDir = "...";
const tasks = cli.clean.android(frameworkFindsAndroidSrcDir);
const log = debug('fancy-framework:android');

android
    .command('clean')
    .description(cli.clean.android)
    .action(async () => {
        const log = debug('fancy-framework:android:clean');
        log(`🧹 let me clean your Android caches`);
        // Add other caches your framework needs besides the normal React Native caches
        // here.
        for (const task of tasks) {
            try {
                log(`\t ${task.label}`);
                // See: https://github.com/sindresorhus/execa#lines
                const {stdout} = await task.action({ lines: true })
                log(stdout.join('\n\tGradle: '));
            } catch (e) {
                log(`\t ⚠️ whoops: ${e.message}`);
            }
        }
    });
```

And you'd be using it like this:

```bash
$ ./fancy-framework android clean
🧹 let me clean your Android caches
    Gradle: // a bunch of gradle output
    Gradle: ....
```

## Contributing

Changes to this package can be made locally and linked against your app. Please see the [Contributing guide](https://reactnative.dev/contributing/overview#contributing-code).
