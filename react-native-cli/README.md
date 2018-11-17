## Running CLI with local modifications

React Native is distributed as two npm packages, `react-native-cli` and `react-native`. The first one is a lightweight package that should be installed globally (`npm install -g react-native-cli`), while the second one contains the actual React Native framework code and is installed locally into your project when you run `react-native init`.

Because `react-native init` calls `npm install react-native`, simply linking your local Github clone into npm is not enough to test local changes.

### Introducing Verdaccio

[Verdaccio](https://github.com/verdaccio/verdaccio) is an npm registry that runs on your local machine and allows you to publish packages to it. Everything else is proxied from `npmjs.com`. We'll set up Verdaccio for React Native CLI development. 

Install with npm: `$ npm install -g verdaccio` or install with Yarn: `$ yarn global add verdaccio`

Run the following command to start Verdaccio to confirm that it was properly installed:

    $ verdaccio


### (Optional) Enable web interface to browse Verdaccio packages
Within a terminal window:
```
$ npm set registry http://localhost:4873/
if you use HTTPS, add an appropriate CA information
("null" means get CA list from OS)
$ npm set ca null
```
Now you can navigate to http://localhost:4873/ where your local packages will be listed and can be searched.


### Create new user
Run the following command: `npm adduser --registry http://localhost:4873`
This will prompt your for a username, password and email, which you'll need whenever you publish onto the Verdaccio server


### Publishing to Verdaccio
`cd` into your local fork of `react-native` 
Run `npm publish --registry http://localhost:4873` to publish your local version of React Native to Verdaccio

Now, all new projects initialzed with `react-native init ...` will use the local fork of React Native instead of the version you have installed on your machine. All projects created using the local fork of React Native will have version number 1000.0.0. Check the version of a React Native project by running `react-native -v` in the React Native project.

If you ever want to revert back to the non-development version of React Native (i.e. the version you're not hosting on Verdaccio), run `npm unpublish --force react-native` to remove React Native from Verdaccio. All React Native projects created now will be using the regular version.


## Testing changes

Most of the CLI code is covered by jest tests, which you can run with:

    $ npm test

Project generation is also covered by e2e tests, which you can run with:

    $ ./scripts/e2e-test.sh

These tests actually create a very similar setup to what is described above (using Verdaccio) and they also run iOS-specific tests, so you will need to run this on OSX and have [xctool] installed.

Both of these types of tests also run on Travis both continuously and on pull requests.

[verdaccio]: https://www.npmjs.com/package/verdaccio
[xctool]: https://github.com/facebook/xctool

## Clean up

To unset the npm registry, do:

    $ npm set registry https://registry.npmjs.org/
    # Check that it worked:
    $ npm config list

## Alternative workflow

If you don't want to install Sinopia you could still test changes done on the cli by creating a sample project and installing your checkout of `react-native` on that project instead of downloading it from npm. The simplest way to do this is by:

    $ npm init AwesomeProject
    $ cd AwesomeProject
    $ npm install $REACT_NATIVE_GITHUB

Note that `REACT_NATIVE_GITHUB` should point to the directory where you have a checkout.

Also, if the changes you're making get triggered when running `react-native init AwesomeProject` you will want to tweak the global installed `react-native-cli` library to install the local checkout instead of downloading the module from npm. To do so just change this [line](https://github.com/facebook/react-native/blob/master/react-native-cli/index.js#L191) and refer the local checkout instead.
