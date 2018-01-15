// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.module.annotations;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import com.facebook.react.bridge.NativeModule;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.SOURCE;

/**
 * Annotates a function that returns a list of ModuleSpecs from which we get a list of NativeModules
 * to create ReactModuleInfos from.
 */
@Retention(SOURCE)
@Target(TYPE)
public @interface ReactModuleList {

  /**
   * The Native modules in this list should be annotated with {@link ReactModule}.
   * @return List of Native modules in the package.
   */
  Class<? extends NativeModule>[] nativeModules();

  /**
   * The View Managers in this list should be annotated with {@link ReactModule}.
   * @return List of view manager in the package.
   */
  Class<? extends NativeModule>[] viewManagers() default {};
}
