/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * A list of support JSIModules. These are usually core infra pieces, so there should be an explicit
 * list.
 */
public enum JSIModuleType {
  TurboModuleManager,
  UIManager,
}
