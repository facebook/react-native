/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

/** A task to execute on the UI View for third party libraries. */
public interface UIBlock {
  public void execute(NativeViewHierarchyManager nativeViewHierarchyManager);
}
