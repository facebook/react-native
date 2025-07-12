# scripts/cxx-api

[Experimental] Build scripts for React Native's C++ / Objective-C / Objective-C++ API.

## Usage

#### Build API snapshot

Builds a `ReactNativeCPP.api` file to the `output` location configured in `public-api.conf`.

```sh
yarn cxx-api-build
```

#### Check API snapshot

Prints a warning message with the API snapshot diff since the previous commit.

```sh
./scripts/cxx-api/check-api.sh
```
