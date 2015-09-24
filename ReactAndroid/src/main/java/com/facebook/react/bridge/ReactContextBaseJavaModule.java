/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Base class for Catalyst native modules that require access to the {@link ReactContext}
 * instance.
 */
public abstract class ReactContextBaseJavaModule extends BaseJavaModule {

  private final ReactApplicationContext mReactApplicationContext;

  public ReactContextBaseJavaModule(ReactApplicationContext reactContext) {
    mReactApplicationContext = reactContext;
  }

  /**
   * Subclasses can use this method to access catalyst context passed as a constructor
   */
  protected final ReactApplicationContext getReactApplicationContext() {
    return mReactApplicationContext;
  }
}
