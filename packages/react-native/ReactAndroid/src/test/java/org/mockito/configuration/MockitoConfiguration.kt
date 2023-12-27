/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package org.mockito.configuration

/**
 * Disables the Mockito cache to prevent Mockito & Robolectric bugs. Mockito loads this with
 * reflection, so this class might appear unused.
 */
@Suppress("unused")
class MockitoConfiguration : DefaultMockitoConfiguration() {
  override fun enableClassCache(): Boolean = false
}
