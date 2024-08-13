/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.ReadableArray

/**
 * This is an interface that must be implemented by classes that wish to take over the
 * responsibility of setting properties of all views managed by the view manager and executing view
 * commands.
 *
 * @param <T> the type of the view supported by this delegate </T>
 */
public interface ViewManagerDelegate<T : View?> {
  public fun setProperty(view: T, propName: String, value: Any?)

  public fun receiveCommand(view: T, commandName: String, args: ReadableArray?)
}
