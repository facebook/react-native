/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.model

import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ReactModuleInfoTest {

  @Test
  fun testCreateReactModuleInfo() {
    val reactModuleInfo =
        ReactModuleInfo(
            /* name = */ "name",
            /* className = */ "class",
            /* canOverrideExistingModule = */ false,
            /* needsEagerInit = */ false,
            /* isCxxModule = */ false,
            /* isTurboModule = */ false)
    assertEquals("name", reactModuleInfo.name())
    assertFalse(reactModuleInfo.canOverrideExistingModule())
    assertFalse(reactModuleInfo.needsEagerInit())
    assertFalse(reactModuleInfo.isCxxModule)
    assertFalse(reactModuleInfo.isTurboModule)
  }

  @Test
  fun classIsTurboModule_withRandomClass() {
    assertFalse(ReactModuleInfo.classIsTurboModule(String::class.java))
  }

  @Test
  fun classIsTurboModule_withTurboModule() {
    assertTrue(ReactModuleInfo.classIsTurboModule(TestTurboModule::class.java))
  }

  inner class TestTurboModule : TurboModule {
    override fun initialize() = Unit

    override fun invalidate() = Unit
  }
}
