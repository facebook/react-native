/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const PUBLISH_PACKAGES_TAG = '#publish-packages-to-npm';
const GENERIC_COMMIT_MESSAGE = `bumped packages versions\n\n${PUBLISH_PACKAGES_TAG}`;

const NO_COMMIT_CHOICE = 'NO_COMMIT';
const COMMIT_WITH_GENERIC_MESSAGE_CHOICE = 'COMMIT_WITH_GENERIC_MESSAGE';
const COMMIT_WITH_CUSTOM_MESSAGE_CHOICE = 'COMMIT_WITH_CUSTOM_MESSAGE';

module.exports = {
  PUBLISH_PACKAGES_TAG,
  GENERIC_COMMIT_MESSAGE,
  NO_COMMIT_CHOICE,
  COMMIT_WITH_GENERIC_MESSAGE_CHOICE,
  COMMIT_WITH_CUSTOM_MESSAGE_CHOICE,
};
