/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

/**
 * An enum that specifies the JS Engine to be used in the app Old Logic uses the legacy code
 * JSC/HERMES loads the respective engine using the revamped logic
 */
public enum JSInterpreter {
  OLD_LOGIC,
  JSC,
  HERMES
}
