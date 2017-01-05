/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

/**
 * Callback class for custom options that may appear in {@link DevSupportManager} developer
 * options menu. In case when option registered for this handler is selected from the menu, the
 * instance method {@link #onOptionSelected} will be triggered.
 */
public interface DevOptionHandler {

  /**
   * Triggered in case when user select custom developer option from the developers options menu
   * displayed with {@link DevSupportManager}.
   */
  public void onOptionSelected();

}
