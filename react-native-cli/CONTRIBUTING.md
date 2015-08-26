## Running CLI with local modifications

React Native is distributed as two npm packages, `react-native-cli` and `react-native`. The first one is a lightweight package that should be installed globally (`npm install -g react-native-cli`), while the second one contains the actual React Native framework code and is installed locally into your project when you run `react-native init`.

Because `react-native init` calls `npm install react-native`, simply linking your local github clone into npm is not enough to test local changes.

### Introducing Sinopia

[Sinopia] is an npm registry that runs on your local machine and allows you to publish packages to it. Everything else is proxied from `npmjs.com`. We'll set up sinopia for React Native CLI development. First, install it with:

    $ npm install -g sinopia

Then, open `~/.config/sinopia/config.yaml` and configure it like this (note the `max_body_size`):

    storage: ./storage
    
    uplinks:
      npmjs:
        url: https://registry.npmjs.org/

    packages:
      'react-native':
        allow_access: $all
        allow_publish: $all
    
      'react-native-cli':
        allow_access: $all
        allow_publish: $all
    
      '*':
        allow_access: $all
        proxy: npmjs

    logs:
      - {type: stdout, format: pretty, level: http}
    
    max_body_size: '50mb'

Now you can run sinopia by simply doing:

    $ sinopia

### Publishing to sinopia

Now we need to publish the two React Native packages to our local registry. To do this, we configure npm to use the new registry, unpublish any existing packages and then publish the new ones:

    react-native$ npm set registry http://localhost:4873/
    # Check that it worked:
    react-native$ npm config list
    react-native$ npm unpublish --force
    react-native$ npm publish
    react-native$ cd react-native-cli/
    react-native-cli$ npm unpublish --force
    react-native-cli$ npm publish

### Running the local CLI

Now that the packages are installed in sinopia, you can install the new `react-native-cli` package globally and when you use `react-native init`, it will install the new `react-native` package as well:

    $ npm uninstall -g react-native-cli
    $ npm install -g react-native-cli
    $ react-native init AwesomeApp

## Testing changes

Most of the CLI code is covered by jest tests, which you can run with:

    $ npm test

Project generation is also covered by e2e tests, which you can run with:

    $ ./scripts/e2e-test.sh

These tests actually create a very similar setup to what is described above (using sinopia) and they also run iOS-specific tests, so you will need to run this on OSX and have [xctool] installed.

Both of these types of tests also run on Travis both continuously and on pull requests.

[sinopia]: https://www.npmjs.com/package/sinopia
[xctool]: https://github.com/facebook/xctool

## Clean up

To unset the npm registry, do:

    $ npm set registry https://registry.npmjs.org/
    # Check that it worked:
    $ npm config list

## Troubleshooting

##### Sinopia crashes with "Module version mismatch"

This usually happens when you install a package using one version of Node and then change to a different version. This can happen when you update Node, or switch to a different version with nvm. Do:

    $ npm uninstall -g sinopia
    $ npm install -g sinopia
