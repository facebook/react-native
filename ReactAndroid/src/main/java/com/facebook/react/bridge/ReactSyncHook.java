/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.lang.annotation.Retention;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation for a method in a {@link NativeModule} that can be called from JS synchronously **on
 * the JS thread**, possibly returning a result.
 *
 * In order to support remote debugging, both the method args and return type must be serializable
 * to JSON: this means that we only support the same args as {@link ReactMethod}, and the hook can
 * only be void or return JSON values (e.g. bool, number, String, {@link WritableMap}, or
 * {@link WritableArray}).
 *
 * In the vast majority of cases, you should use {@link ReactMethod} which allows your native module
 * methods to be called asynchronously: calling methods synchronously can have strong performance
 * penalties and introduce threading-related bugs to your native modules.
 */
@Retention(RUNTIME)
public @interface ReactSyncHook {
}
