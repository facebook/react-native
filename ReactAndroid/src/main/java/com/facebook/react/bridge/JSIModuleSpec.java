/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Holder class used to register {@link JSIModule} into JSI Bridge.
 */
public interface JSIModuleSpec<T extends JSIModule> {

  Class<? extends JSIModule> getJSIModuleClass();

  JSIModuleProvider<T> getJSIModuleProvider();

}
