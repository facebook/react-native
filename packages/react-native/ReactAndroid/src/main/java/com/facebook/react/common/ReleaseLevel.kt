/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

/**
 * This enum is used to determine the release level of a React Native application, which is then
 * used to determine what React Native Features will be enabled in the application.
 */
public enum class ReleaseLevel {
  EXPERIMENTAL,
  CANARY,
  STABLE,
}
