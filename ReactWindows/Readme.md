# React Native for the Universal Windows Platform (UWP)

This is the repository for React Native for UWP.  This directory contains the following:

- `ReactNative` - The implementation of React Native for UWP
- `ReactNative.Tests` - The unit tests for React Native, currently using MSTest
- `Playground` - A playground for testing React Native features

## Requirements

- [Visual Studio 2015](https://msdn.microsoft.com/en-us/library/dd831853.aspx): Community and all other editions supported
- [Windows 10 SDK](https://developer.microsoft.com/en-US/windows/downloads/windows-10-sdk): Download the latests
- [Node.js v5.10.1+](https://nodejs.org/)
- [NPM v3+](https://www.npmjs.com/)
- [Python 2.7](https://www.python.org/): Download the latest edition
- Git Client - For example:
    - [GitHub Desktop for Windows](https://desktop.github.com/)
    - [Git for Windows](https://git-for-windows.github.io/)

## Supported Operating Systems

This setup has only been tested on the following:
- Windows 10 November update
- Windows 10 Mobile November update
- Xbox One

## Installation

First, clone the repository to your local machine:
```bash
git clone https://github.com/ReactWindows/react-native.git
cd react-native
git checkout WindowsStore
```

Next, install the NPM dependencies.  Note that this will not work using MSYS such as the Git Bash, so launch a regular command prompt if you do not have Git in your `PATH` environment variable.  This will cause a failure for installing `fsevents` which is not supported on Windows.  If you have Git installed in your `PATH` environment variable and use the command prompt, then it will work properly.  If you are using the Git Bash, it may error on installing `fsevents`, so use the regular command prompt instead.

```bash
npm install
```

Note that `fsevents` will not install as it is not compatible with Windows.

## Setting Up the Build Environment

- Open up `ReactNative.sln` in Visual Studio 2015.
- If this is your first time using UWP, you will have to install the SDK. Right click on the solution file in the solution explorer and select the option labeled "Install Missing Components". You may have to shutdown Visual Studio to continue the installation.
- Build the solution once all the packages are installed Build => Rebuild Solution. 

## Running the Unit Tests

Currently, the unit tests are written using MSTest, but the intention is to move to [xUnit.net](http://xunit.github.io/) shortly.  If you have MSTest, you can run the unit tests by doing the following:

- Open up the Test Explorer Tests->Windows->Test Explorer, then select Run All. 

## Contributing

For more information about contributing PRs and issues, see our [Contribution Guidelines](https://github.com/facebook/react-native/blob/master/CONTRIBUTING.md).
