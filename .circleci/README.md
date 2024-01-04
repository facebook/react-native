# Circle CI

This directory is home to the Circle CI configuration files. Circle is our continuous integration service provider. You can see the overall status of React Native's builds at https://circleci.com/gh/facebook/react-native

You may also see an individual PR's build status by scrolling down to the Checks section in the PR.

## Purposes

We use CircleCI for mainly 3 purposes:

1. Testing changes
2. Release Nightlies
3. Release Stable Versions of React Native

When testing changes, we run all the tests on commits that lands on `main`. For commits in PR, we try to understand which kind of changes the PR is about and we try to selectively run only the relevant tests. so, for example, if a PR only touches iOS files, we are going to run only iOS tests.

A Nighly job runs every day at around 9:00 PM, GMT. They run from `main` and they publish a version of React Native using the current state of the codebase, creating a version number that follows the format: `0.<current-version+1>.0-nightly-<YYYYMMDD>-<short-commit-hash>`.
The nightly job also publish all the monorepo packages, taking care of updating the transitive dependencies of those packages.

Stable versions are released manually by the Release Crew and they run from a stable branch. Stable branches have the shape of `0.<version>-stable`.

## How It Works?

CircleCI execution is now split in two steps:
- Setup
- Testing

The setup step takes care of analyzing the changes in the PR and of deciding which jobs needs to run.

The testing flow is a set of workflows that executes the required tests.

### Setup

The code of the setup workflow lives in the root [`config.yml`](https://github.com/facebook/react-native/blob/main/.circleci/config.yml) file.
It uses the `Continuation orb` from CircleCI to start a CI flow that depends on the changes present in the PR.

If the changes are not coming from a PR (either a simple commit or if the CI is running on main) **we always run all the tests** as a cautionary measure.

The setup job has also to expose all the pipeline parameters that we would need to pass to the actual workflow. Those parameters are **automatically forwarded** to the workflows that are started as a result of the setup.

The setup job uses a JS script to carry on its logic. The [`pipeline_selection.js`](https://github.com/facebook/react-native/blob/main/scripts/circleci/pipeline_selection.js) script can be invoked with two commands:
- `filter-jobs`
- `create-configs`

The **`filter-jobs`** command takes care of creating a JSON representation of the tests we need to run based on the changes in the PR.

The **`create-configs`** command consumes the JSON representation to create a CircleCI configuration that can then executes all the required tests.

#### Creating a Configuration

To create a configuration, the `pipeline-selection` scripts collates together various pieces of `YML` files that lives in the [`Configurations` folder](https://github.com/facebook/react-native/tree/main/.circleci/configurations).

The order in which these files are appended is **important** and it always contains the following.:

1. `top_level.yml`: this file contains some high level directives for CircleCI, like the version, the list of orbs, the cache-keys, and the pipeline parameters that can be used by the workflows.
2. `executors.yml`: this file contains the list of the executors used in our jobs and their configurations.
3. `commands.yml`: this file contains all the commands that can be used by jobs to executes. Commands are reusable functions that are shared by multiple jobs.
4. `jobs.yml`: this file contains the jobs that are used by workflows to carry on some specific tasks. They are composed of sequential commands.
5. `workflows.yml`: this file contains the shared workflows that needs to (or can) be always executed, no matter which kind of changes are pushed to CI. An example of these workflows is `analysis` (which is always executed) or `nightly` (which can be executed if a specific pipeline parameter is passed to the CI).

Then, the `pipeline_selection create-configs` attach some specific test workflows, depending on the changes that are present in the PR. These change-dependent workflows live in the [`test_workflows`](https://github.com/facebook/react-native/tree/main/.circleci/configurations/test_workflows) folder.
These workflows are:
* `testAll.yml` => runs all the possible tests. This workflow is executed on main and on PRs which change set touches both iOS and Android
* `testAndroid.yml` => runs all the build steps and Android tests. This is used on changes that happens on the Android codebase and infra (`ReactAndroid` folder)
* `testIOS.yml` => runs all the build steps and iOS tests. This is used on changes that happens on the iOS codebase and infra (`React` folder)
* `testE2E.yml` => runs the E2E tests. As of today, E2E tests can be triggered if the commit message contains the `#run-e2e-tests` tag.
* `testJS.yml` => For all the changes that do not touch native/platform code, we only run JS tests.

Notice that if there are changes on files that do not represents code (for example `.md` files like this one or the `Changelog`) we don't run any CI.

## Test workflows

The test workflows for native code are composed of 2 parts:
- building React Native
- testing

Building React Native requires us to build several parts of it:
1. We need to build the Hermes JS engine
2. We need to build Android to create prebuilds
3. We need to package everything in an npm package that will mimic a React native release
4. We need to create a local maven repository

### Building Hermes Engine

#### Android
The `build_android` workflows takes care of building the Android version of Hermes and to put it properly in a local maven repository.
See the [Build Android](#build_android) section below.

#### iOS
Hermes is a very complicated item to build for iOS.
It is composed of the Hermes compiler (HermesC) and of the actual engine.

Hermes is shipped as a universal XCFramework. This means that we need to build all the architecture slices and then put them together in the XCFramework archive.
We also need to build 2 configurations: Debug and Release.

In order to be efficient and to save costs, we parallelize the process as much as possible:

1. We prepare the environment for building Hermes.
2. We build HermesC which is required by all the slices.
3. We start 8 jobs to build all the required slices in parallel:
    1. `iphone` slice, Debug mode
    1. `iphonesimulator` slice, Debug mode
    1. `macos` slice, Debug mode
    1. `catalyst` slice, Debug mode
    1. `iphone` slice, Release mode
    1. `iphonesimulator` slice, Release mode
    1. `macos` slice, Release mode
    1. `catalyst` slice, Release mode
4. We then have 2 jobs to create the Debug and Release tarballs in parallel.
    1. The Debug job receives the 4 Debug slices
    1. The Release job receives the 4 Release slices

The `Debug` and `Release` tarball are then uploaded as artifacts. Notice that these we use these artifacts to **test the release** of React Native.

While building Hermes, we take also care of building the dSYMs. A dSYM (Debug Symbols) is an archive that contains the Debug Symbols that users can load to de-symbolicate the Hermes Stack traces. These symbols are published when we create a React Native release.

A lot of these build steps are automated by some shell scripts that lives in the [`react-native/packages/react-native/sdks/hermes-engine/utils` folder](https://github.com/facebook/react-native/tree/main/packages/react-native/sdks/hermes-engine/utils).

### Build Android

The android build is all managed by Gradle, so building android should be as easy as calling a [`gradle` command](https://github.com/facebook/react-native/blob/main/.circleci/configurations/jobs.yml#L268-L274).

The relevant part here is that the build android generates a `maven-local` repository that is passed to the [`build_npm_package`](https://github.com/facebook/react-native/blob/main/.circleci/configurations/jobs.yml#L1182) and that we use to test the releases.

### Build NPM package

This job is the responsible to create an NPM package that is suitable to be released or tested in CI.
If we are in a release flow (for example the Nightly workflow), it also proceed with the publication.

The job can be invoked with different parameters:
- `dry-run` => it does not publish anything, but prepare the artifacts to be used for testing
- `nightly` => it creates the artifacts and publish a nightly version of React Native.
- `release` => it creates the artifacts and publish a stable version of React Native.

The build NPM package takes all the artifacts produced in the previous steps (iOS' Hermes, iOS' Hermes dSYMs, Android's `maven-local`) and creates an npm package packing all the code.

If in a release mode, it also proceed publishing the NPM package to NPM, and the artifacts to Maven central, which we use to distribute all the artifacts.

This job also uploads the `maven-local` repository and a zipped version of the npm package to CircleCI's artifacts. We use these artifacts to **test the release** of React Native.

## Testing React Native
React Native tests runs in two different scenarios:
- RNTester
- A New App

### RNTester
RNTester is our internal testing app. It is a fully working React Native app that lives in the [`react-native/packages/rn-tester` folder](https://github.com/facebook/react-native/tree/main/packages/rn-tester) of the repository.
RNTester is an app which contains code that exercise most part of the React Native frameworks.
It also has the feature of building React Native **from source**. For that reason, it does not have to wait for the NPM package to be ready, but RNTester's tests can start as soon as the `build_android` step and the step that builds Hermes for iOS are done.

Notice the Tests on RNTester for iOS consumes the Hermes engine that is built in the previous steps.

For Android, these tests creates an APK that is uploaded as an artifact in CircleCI. We use these artifacts to **test the releases** of React Native..

### A New App
The React Native repo contains a template app in the [`react-native/packages/react-native/template` folder]() that is used to spin up a new application that is preconfigured with React Native.

We have several tests that we run starting from the template, testing various configurations:
- Debug/Release
- JSC/Hermes (two different JS engine we support)
- New/Old Architecture (two different Architectures for React Native)

We want to test all the React Native changes against the template, but we can't publish a React native version on each change that is merged. Therefore, to run tests on the template we use a NPM registry proxy called [Verdaccio](https://verdaccio.org/).

When running a Template test our CI follows roughly these steps:
1. Prepare the executor
2. Start a Verdaccio server
3. Publish on Verdaccio all the monorepo [packages](https://github.com/facebook/react-native/tree/main/packages) on which React Native depends on.
4. Publish on Verdaccio the react-native NPM package that has been created in the NPM step
5. Spin up a new React native apps from the template, downloading react-native from Verdaccio.

In this way, we are sure that we can test all the changes that happen in React Native on a new React Native app.
