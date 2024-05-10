/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.model

import com.facebook.react.turbomodule.core.interfaces.TurboModule

/**
 * Data holder class holding native module specifications. [ReactModuleSpecProcessor] creates these
 * so Java modules don't have to be instantiated at React Native start up.
 */
public class ReactModuleInfo(
    private val _name: String,
    private val _className: String,
    private val _canOverrideExistingModule: Boolean,
    private val _needsEagerInit: Boolean,
    public val isCxxModule: Boolean,
    public val isTurboModule: Boolean
) {

  @Deprecated("use ReactModuleInfo(String, String, boolean, boolean, boolean, boolean)]")
  public constructor(
      name: String,
      className: String,
      canOverrideExistingModule: Boolean,
      needsEagerInit: Boolean,
      @Suppress("UNUSED_PARAMETER") hasConstants: Boolean,
      isCxxModule: Boolean,
      isTurboModule: Boolean
  ) : this(name, className, canOverrideExistingModule, needsEagerInit, isCxxModule, isTurboModule)

  public fun name(): String = _name

  public fun className(): String = _className

  public fun canOverrideExistingModule(): Boolean = _canOverrideExistingModule

  public fun needsEagerInit(): Boolean = _needsEagerInit

  @Deprecated("this is hardcoded to return true, regardless if the module has constants or not")
  public fun hasConstants(): Boolean = true

  public companion object {
    /**
     * Checks if the passed class is a TurboModule. Useful to populate the parameter [isTurboModule]
     * in the constructor of ReactModuleInfo.
     */
    @JvmStatic
    public fun classIsTurboModule(clazz: Class<*>): Boolean =
        TurboModule::class.java.isAssignableFrom(clazz)
  }
}
