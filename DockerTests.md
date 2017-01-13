# Dockerfile Tests

This is a high level overview of the test configuration using docker. It explains how to run the tests locally
and how they integrate with the Jenkins Pipeline script to run the automated tests on ContainerShip <https://www.containership.io/>.

## Docker Installation

It is required to have Docker running on your machine in order to build and run the tests in the Dockerfiles.
See <https://docs.docker.com/engine/installation/> for more information on how to install.

## Android Setup

There are two Dockerfiles for use with the Android codebase.

The `Dockerfile.android-base` contains all the necessary prerequisites required to run the React Android tests. It is
separated out into a separate Dockerfile because these are dependencies that rarely change and also because it is quite
a beastly image since it contains all the Android depedencies for running android and the emulators (~9GB).

The good news is you should rarely have to build or pull down the base image! All iterative code updates happen as
part of the `Dockerfile.android` image build.

So step one...

`docker pull containership/android-base:latest`

This will take quite some time depending on your connection and you need to ensure you have ~10GB of free disk space.

Once this is done, you can run tests locally by executing two simple commands:

1. `docker build -t react/android -f ./Dockerfile.android .`
2. `docker run --cap-add=SYS_ADMIN -it react/android bash scripts/docker/run-android-docker-unit-tests.sh`

> Note: `--cap-add=SYS_ADMIN` flag is required for the `scripts/docker/run-android-docker-unit-tests.sh` and
`scripts/docker/run-android-docker-instrumentation-tests.sh` in order to allow the remounting of `/dev/shm` as writeable
so the `buck` build system may write temporary output to that location

Every time you make any modifications to the codebase, you should re-run the `docker build ...` command in order for your
updates to be included in your local docker image.

The following shell scripts have been provided for android testing:

`scripts/docker/run-android-docker-unit-tests.sh` - Runs the standard android unit tests

`scripts/docker/run-android-docker-instrumentation-tests.sh` - Runs the android instrumentation tests on the emulator. *Note* that these
tests take quite some time to run so there are various flags you can pass in order to filter which tests are run (see below)

`scripts/docker/run-ci-e2e-tests.sh` - Runs the android end to end tests

#### scripts/docker/run-android-docker-instrumentation-tests.sh

The instrumentation test script accepts the following flags in order to customize the execution of the tests:

`--filter` - A regex that filters which instrumentation tests will be run. (Defaults to .*)

`--package` - Name of the java package containing the instrumentation tests (Defaults to com.facebook.react.tests)

`--path` - Path to the directory containing the instrumentation tests. (Defaults to ./ReactAndroid/src/androidTest/java/com/facebook/react/tests)

`--retries` - Number of times to retry a failed test before declaring a failure (Defaults to 2)

For example, if locally you only wanted to run the InitialPropsTestCase, you could do the following:

`docker run --cap-add=SYS_ADMIN -it react/android bash scripts/docker/run-android-docker-instrumentation-tests.sh --filter="InitialPropsTestCase"`

# Javascript Setup

There is a single Dockerfile for use with the javascript codebase.

The `Dockerfile.javascript` base requires all the necessary dependencies for running Javascript tests.

Any time you make an update to the codebase, you can build and run the javascript tests with the following three commands:

1. `docker build -t react/js -f ./Dockerfile.javascript .`
2. `docker run -it react/js yarn test --maxWorkers=4`
3. `docker run -it react/js yarn run flow -- check`
