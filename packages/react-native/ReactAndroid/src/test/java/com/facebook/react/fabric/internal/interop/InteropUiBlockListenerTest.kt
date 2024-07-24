/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.internal.interop

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.testutils.fakes.FakeUIManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class InteropUiBlockListenerTest {

  @Test
  fun prependUIBlock_addsBlockCorrectly() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}

    assertThat(underTest.beforeUIBlocks).hasSize(1)
    assertThat(underTest.afterUIBlocks).hasSize(0)
  }

  @Test
  fun addUIBlock_addsBlockCorrectly() {
    val underTest = InteropUIBlockListener()
    underTest.addUIBlock {}

    assertThat(underTest.beforeUIBlocks).hasSize(0)
    assertThat(underTest.afterUIBlocks).hasSize(1)
  }

  @Test
  fun willMountItems_emptiesBeforeUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.willMountItems(FakeUIManager())

    assertThat(underTest.beforeUIBlocks).hasSize(0)
    assertThat(underTest.afterUIBlocks).hasSize(1)
  }

  @Test
  fun willDispatchViewUpdates_emptiesBeforeUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.willDispatchViewUpdates(FakeUIManager())

    assertThat(underTest.beforeUIBlocks).hasSize(0)
    assertThat(underTest.afterUIBlocks).hasSize(1)
  }

  @Test
  fun didMountItems_emptiesAfterUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.didMountItems(FakeUIManager())

    assertThat(underTest.beforeUIBlocks).hasSize(1)
    assertThat(underTest.afterUIBlocks).hasSize(0)
  }

  @Test
  fun didDispatchMountItems_emptiesAfterUIBlocks() {
    val underTest = InteropUIBlockListener()
    underTest.prependUIBlock {}
    underTest.addUIBlock {}

    underTest.didDispatchMountItems(FakeUIManager())

    assertThat(underTest.beforeUIBlocks).hasSize(1)
    assertThat(underTest.afterUIBlocks).hasSize(0)
  }

  @Test
  fun willMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.prependUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.willMountItems(fakeUIManager)

    assertThat(fakeUIManager.resolvedViewCount).isEqualTo(1)
  }

  @Test
  fun willDispatchViewUpdates_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.prependUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.willDispatchViewUpdates(fakeUIManager)

    assertThat(fakeUIManager.resolvedViewCount).isEqualTo(1)
  }

  @Test
  fun didMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.addUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.didMountItems(fakeUIManager)

    assertThat(fakeUIManager.resolvedViewCount).isEqualTo(1)
  }

  @Test
  fun didDispatchMountItems_deliversUiManagerCorrectly() {
    val fakeUIManager = FakeUIManager()
    val underTest = InteropUIBlockListener()

    underTest.addUIBlock { uiManager -> uiManager.resolveView(0) }

    underTest.didDispatchMountItems(fakeUIManager)

    assertThat(fakeUIManager.resolvedViewCount).isEqualTo(1)
  }
}
