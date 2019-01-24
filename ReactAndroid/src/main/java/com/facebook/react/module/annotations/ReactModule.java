/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.annotations;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/**
 * Annotation for use on {@link com.facebook.react.bridge.BaseJavaModule}s to describe properties for that module.
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

  /**
   * Indicates if a module is a C++ module or a Java Module
   * @return
   */
  boolean isCxxModule() default false;
}
