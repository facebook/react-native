# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bats is a testing framework for Bash.
# https://github.com/bats-core/bats-core
#
# https://bats-core.readthedocs.io/en/stable/writing-tests.html
#
# How to run all *.bats tests for React Native:
# yarn test-scripts

bats_require_minimum_version 1.5.0
load ../../node_modules/bats-mock/stub

_ARTIFACTS=("$BATS_SUITE_TMPDIR/example.tar.gz")

_setup_stubs() {
  # Set up stubs using bats-mock.

  # Here we are mocking the GitHub API curl requests.
  # In create_github_release, we use `-w "%{http_code}` so that curl redirects
  # the http code to stdout, and we use `-o <file>` to store the http
  # response body in a temporary file. Therefore, each curl stub should have a
  # corresponding cat stub.
  #
  # To keep these stubs manageable, follow this convention:
  #
  # my_stubs=(
  #   "[curl args pattern] : [command]"
  #   "[cat args pattern] : [command]"
  # )
  #
  # stub curl $my_stubs[0]
  # stub cat $my_stubs[1]
  #
  # The stubs are global, and when unstub is called in _teardown_stubs(),
  # bats-mock will assert that each stub was called. You need to take care
  # to ensure that the number of curl/cat stubs matches the number of times
  # they are invoked in the tests.

  local curl_stub_index cat_stub_index
  local create_release_stubs upload_artifact_stubs

  curl_stub_index=0
  cat_stub_index=1

  create_release_stubs=(
    "* * */create_github_release_response.json * : echo 200"
    "*/github_api_create_release_response.json : echo { \"id\": 1 }"
  )

  upload_artifact_stubs=(
    "* * */upload_artifact_for_github_release_response.json * : echo 200"
    "*/upload_artifact_for_github_release_response.json : echo {}"
  )

  # "succeed if release type is release and all arguments are provided, without release artifacts" -> one create_release_stubs
  # "succeed if release type is release and all arguments are provided, with release artifacts" -> one create_release_stubs and one upload_artifact_stubs
  stub curl \
    "${create_release_stubs[$curl_stub_index]}" \
    "${create_release_stubs[$curl_stub_index]}" \
    "${upload_artifact_stubs[$curl_stub_index]}"

  stub cat \
    "${create_release_stubs[cat_stub_index]}" \
    "${create_release_stubs[cat_stub_index]}" \
    "${upload_artifact_stubs[cat_stub_index]}"
  # TODO: migrate this to per-test stubs, so that we don't need to maintain these in sync
}

_teardown_stubs() {
  unstub curl
  unstub cat
}

# Runs once, before all tests in this file
setup_file() {
  DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"

  # make executables in ../circleci visible to PATH
  PATH="$DIR/../circleci:$PATH"

  _setup_stubs

  for _ARTIFACT_PATH in "${_ARTIFACTS[@]}"
  do
    touch $_ARTIFACT_PATH
  done
}

# Runs before each test case
setup() {
  _GIT_TAG=v1000.0.0
  _RELEASE_VERSION=1000.0.0
  _GITHUB_TOKEN=abcdef

  export _GIT_TAG
  export _RELEASE_VERSION
  export _GITHUB_TOKEN
}

# Runs after each test case
teardown() {
  : # Empty function intentional for demonstration purposes.
}

# Runs once, after all tests in this file
teardown_file() {
  _teardown_stubs

  for _ARTIFACT_PATH in "${_ARTIFACTS[@]}"
  do
    rm $_ARTIFACT_PATH
  done
}

@test "invoking create_github_release without arguments prints usage" {
  # Act
  run -1 create_github_release.sh

  # Assert
  [ "${lines[0]}" = "Usage: create_github_release.sh <release_type> <git_tag> <release_version> <github_token> [artifact ...]" ]
}

@test "fail if release type is not recognized" {
  # Act
  run -1 --separate-stderr create_github_release.sh foo $_GIT_TAG $_RELEASE_VERSION $_GITHUB_TOKEN

  # Assert
  [ "$stderr" = "Unrecognized release type: foo" ]
}

@test "early exit if release type is nightly" {
  # Act
  run -0 create_github_release.sh nightly $_GIT_TAG $_RELEASE_VERSION $_GITHUB_TOKEN

  # Assert
  [ "$output" = "GitHub Releases are not used with nightlies. Skipping." ]
}

@test "fails if release type is release and GITHUB_TOKEN is not provided" {
  # Act
  run -1 create_github_release.sh release $_GIT_TAG $_RELEASE_VERSION ""

  # Assert
  [ "${lines[-1]}" = "GITHUB_TOKEN is required." ]
}

@test "fails if release type is release and RELEASE_VERSION is not provided" {
  # Act
  run -1 create_github_release.sh release $_GIT_TAG "" $_GITHUB_TOKEN

  # Assert
  [ "${lines[-1]}" = "RELEASE_VERSION is required." ]
}

@test "succeed if release type is release and all arguments are provided, without release artifacts" {
  # Act
  run -0 create_github_release.sh release $_GIT_TAG $_RELEASE_VERSION $_GITHUB_TOKEN

  # Assert
  [ "${lines[-2]}" = "Created GitHub Release successfully." ]
  [ "${lines[-1]}" = "Done." ]
}

@test "succeed if release type is release and all arguments are provided, with release artifacts" {
  # Act
  run -0 create_github_release.sh release $_GIT_TAG $_RELEASE_VERSION $_GITHUB_TOKEN ${_ARTIFACTS[0]}

  # Assert
  [ "${lines[-2]}" = "Uploaded example.tar.gz." ]
  [ "${lines[-1]}" = "Done." ]
}

@test "fail if release artifact does not exist" {
  # Act
  run -1 --separate-stderr create_github_release.sh release $_GIT_TAG $_RELEASE_VERSION $_GITHUB_TOKEN some-file.tar.gz

  # Assert
  [ "${stderr_lines[-1]}" = "Could not locate artifact: some-file.tar.gz" ]
}
