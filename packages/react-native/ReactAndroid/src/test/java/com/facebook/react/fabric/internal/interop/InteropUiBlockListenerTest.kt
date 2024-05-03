/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.internal.interop

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.testutils.fakes.FakeUIManager
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class InteropUiBlockListenerTest {

  @Test
  fun prependUIBlock_addsBlockCorrectly() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}

    assertEquals(1, underTest.beforeUIBlocks.size)
    assertEquals(0, underTest.afterUIBlocks.size)
  }

  @Test
  fun addUIBlock_addsBlockCorrectly() {
    val underTest = InteropUIBlockListener()
    underTest.addUIBlock {}

    assertEquals(0, underTest.beforeUIBlocks.size)
    assertEquals(1, underTest.afterUIBlocks.size)
  }

  @Test
  fun willMountItems_emptiesBeforeUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.willMountItems(FakeUIManager())

    assertEquals(0, underTest.beforeUIBlocks.size)
    assertEquals(1, underTest.afterUIBlocks.size)
  }

  @Test
  fun willDispatchViewUpdates_emptiesBeforeUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.willDispatchViewUpdates(FakeUIManager())

    assertEquals(0, underTest.beforeUIBlocks.size)
    assertEquals(1, underTest.afterUIBlocks.size)
  }

  @Test
  fun didMountItems_emptiesAfterUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.didMountItems(FakeUIManager())

    assertEquals(1, underTest.beforeUIBlocks.size)
    assertEquals(0, underTest.afterUIBlocks.size)
  }

  @Test
  fun didDispatchMountItems_emptiesAfterUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.didDispatchMountItems(FakeUIManager())

    assertEquals(1, underTest.beforeUIBlocks.size)
    assertEquals(0, underTest.afterUIBlocks.size)
  }

  @Test
  fun willMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.prependUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.willMountItems(fakeUIManager)

    assertEquals(1, fakeUIManager.resolvedViewCount)
  }

  @Test
  fun willDispatchViewUpdates_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.prependUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.willDispatchViewUpdates(fakeUIManager)

    assertEquals(1, fakeUIManager.resolvedViewCount)
  }

  @Test
  fun didMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.addUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.didMountItems(fakeUIManager)

    assertEquals(1, fakeUIManager.resolvedViewCount)
  }

  @Test
  fun didDispatchMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.addUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.didDispatchMountItems(fakeUIManager)

    assertEquals(1, fakeUIManager.resolvedViewCount)
  }
}
