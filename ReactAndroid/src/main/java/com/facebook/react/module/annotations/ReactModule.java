/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.module.annotations;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import com.facebook.react.bridge.BaseJavaModule;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation for use on {@link BaseJavaModule}s to describe properties for that module.
 */
@Retention(RUNTIME)
@Target(TYPE)
public @interface ReactModule {
  /**
   * Name used to {@code require()} this module from JavaScript.
   */
  String name();

  /**
   * True if you intend to override some other native module that was registered e.g. as part
   * of a different package (such as the core one). Trying to override without returning true from
   * this method is considered an error and will throw an exception during initialization. By
   * default all modules return false.
   */
  boolean canOverrideExistingModule() default false;

  /**
   * Whether this module needs to be loaded immediately.
   */
  boolean needsEagerInit() default false;

  /**
   *  Whether this module has constants to add, defaults to true as that is safer for when a
   *  correct annotation is not included
   */
  boolean hasConstants() default true;
}
