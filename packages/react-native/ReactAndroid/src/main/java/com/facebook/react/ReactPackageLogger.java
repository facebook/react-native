/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

/** Interface for the bridge to call for TTI start and end markers. */
public interface ReactPackageLogger {

  void startProcessPackage();

  void endProcessPackage();
}
