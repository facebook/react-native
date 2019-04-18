# Dockerfile Tests

This is a high-level overview of the test configuration using Docker. It explains how to run the tests locally.

## Docker Installation

It is required to have Docker running on your machine in order to build and run the tests in the Dockerfiles.
See <https://docs.docker.com/engine/installation/> for more information on how to install.

## Convenience Yarn Run Scripts

We have added a number of default run scripts to the `package.json` file to simplify building and running your tests.

`yarn run docker-setup-android` - Pulls down the base android docker image used for running the tests

`yarn run docker-build-android` - Builds the docker image used to run the tests

`yarn run test-android-run-unit` - Runs all the unit tests that have been built in the latest reactnativeci/android docker image (note: you need to run test-android-build before executing this if the image does not exist it will fail)

`yarn run test-android-run-instrumentation` - Runs all the instrumentation tests that have been built in the latest reactnativeci/android docker image. If the image does not exist, run `test-android-build` before. You can also pass additional flags to filter which tests instrumentation tests are run. Ex: `yarn run test-android-run-instrumentation -- --filter=TestIdTestCase` to only run the TestIdTestCase instrumentation test. See below for more information
on the instrumentation test flags.

`yarn run test-android-run-e2e` - Runs all the end to end tests that have been built in the latest reactnativeci/android docker image (note: you need to run test-android-build before executing this if the image does not exist it will fail)

`yarn run test-android-unit` - Builds and runs the Android unit tests.

`yarn run test-android-instrumentation` - Builds and runs the Android instrumentation tests.

`yarn run test-android-e2e` - Builds and runs the Android end to end tests.

## Detailed Android Setup

There are two Dockerfiles for use with the Android codebase.

The `Dockerfile.android-base` contains all the necessary prerequisites required to run the React Android tests. It is
separated out into a separate Dockerfile because these are dependencies that rarely change and also because it is quite
a beastly image since it contains all the Android dependencies for running Android and the emulators (~9GB).

The good news is you should rarely have to build or pull down the base image! All iterative code updates happen as
part of the `Dockerfile.android` image build.

So step one...

`docker pull reactnativecommunity/react-native-android:latest`

This will take quite some time depending on your connection and you need to ensure you have ~10GB of free disk space.

Once this is done, you can run tests locally by executing two simple commands:

1. `docker build -t reactnativeci/android -f ./.circleci/Dockerfiles/Dockerfile.android .`
2. `docker run --cap-add=SYS_ADMIN -it reactnativeci/android bash .circleci/Dockerfiles/scripts/run-android-docker-unit-tests.sh`

> Note: `--cap-add=SYS_ADMIN` flag is required for the `.circleci/Dockerfiles/scripts/run-android-docker-unit-tests.sh` and
`.circleci/Dockerfiles/scripts/run-android-docker-instrumentation-tests.sh` in order to allow the remounting of `/dev/shm` as writeable
so the `buck` build system may write temporary output to that location

Every time you make any modifications to the codebase, you should re-run the `docker build ...` command in order for your
updates to be included in your local docker image.

The following shell scripts have been provided for android testing:

`.circleci/Dockerfiles/scripts/run-android-docker-unit-tests.sh` - Runs the standard android unit tests

`.circleci/Dockerfiles/scripts/run-android-docker-instrumentation-tests.sh` - Runs the Android instrumentation tests on the emulator. *Note* that these
tests take quite some time to run so there are various flags you can pass in order to filter which tests are run (see below)

`.circleci/Dockerfiles/scripts/run-ci-e2e-tests.sh` - Runs the android end to end tests

#### .circleci/Dockerfiles/scripts/run-android-docker-instrumentation-tests.sh

The instrumentation test script accepts the following flags in order to customize the execution of the tests:

`--filter` - A regex that filters which instrumentation tests will be run. (Defaults to .*)

`--package` - Name of the java package containing the instrumentation tests (Defaults to com.facebook.react.tests)

`--path` - Path to the directory containing the instrumentation tests. (Defaults to ./ReactAndroid/src/androidTest/java/com/facebook/react/tests)

`--retries` - Number of times to retry a failed test before declaring a failure (Defaults to 2)

For example, if locally you only wanted to run the InitialPropsTestCase, you could do the following:

`docker run --cap-add=SYS_ADMIN -it reactnativeci/android bash .circleci/Dockerfiles/scripts/run-android-docker-instrumentation-tests.sh --filter="InitialPropsTestCase"`
