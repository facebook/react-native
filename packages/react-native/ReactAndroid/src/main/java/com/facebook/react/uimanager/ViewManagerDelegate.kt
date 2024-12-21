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
public interface ViewManagerDelegate<T : View> {

  /**
   * Sets a property on a view managed by this view manager.
   *
   * @param view the view to set the property on
   * @param propName the name of the property to set (NOTE: should be `String` but is kept as
   *   `String?` to avoid breaking changes)
   * @param value the value to set the property to
   */
  public fun setProperty(view: T, propName: String?, value: Any?)

  /**
   * Executes a command from JS to the view
   *
   * @param view the view to execute the command on
   * @param commandName the name of the command to execute (NOTE: should be `String` but is kept as
   *   `String?` to avoid breaking changes)
   * @param args the arguments to pass to the command
   */
  public fun receiveCommand(view: T, commandName: String?, args: ReadableArray?)
}
