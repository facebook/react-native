/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.annotations;

/**
 * Used to make sure classes passed to the ReactModule annotation are actually an instance of
 * NativeModule without needing a dependency on NativeModule that is in the ReactAndroid target.
 */
public interface BaseNativeModule {
}
