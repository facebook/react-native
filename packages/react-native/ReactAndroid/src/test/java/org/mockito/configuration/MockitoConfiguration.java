/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package org.mockito.configuration;

/**
 * Disables the Mockito cache to prevent Mockito & Robolectric bugs.
 *
 * <p>Mockito loads this with reflection, so this class might appear unused.
 */
@SuppressWarnings("unused")
public class MockitoConfiguration extends DefaultMockitoConfiguration {

  /* (non-Javadoc)
   * @see org.mockito.configuration.IMockitoConfiguration#enableClassCache()
   */
  public boolean enableClassCache() {
    return false;
  }
}
