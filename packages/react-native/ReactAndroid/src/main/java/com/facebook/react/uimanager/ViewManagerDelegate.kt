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
   * We mark this method as synthetic / hide it from JVM so Java callers will call the deprecated
   * version and overrides work correctly.
   *
   * @param view the view to set the property on
   * @param propName the name of the property to set
   * @param value the value to set the property to
   */
  @Suppress("INAPPLICABLE_JVM_NAME")
  @JvmName("kotlinCompat\$setProperty")
  @JvmSynthetic
  public fun setProperty(view: T, propName: String, value: Any?)

  @Suppress("INAPPLICABLE_JVM_NAME")
  @Deprecated(
      message = "propName is not nullable, please update your method signature",
      replaceWith = ReplaceWith("setProperty(view, propName, value)"),
  )
  @JvmName("setProperty")
  public fun javaCompat_setProperty(view: T, propName: String?, value: Any?): Unit =
      setProperty(view, checkNotNull(propName), value)

  /**
   * Executes a command from JS to the view
   *
   * We mark this method as synthetic / hide it from JVM so Java callers will call the deprecated
   * version and overrides work correctly.
   *
   * @param view the view to execute the command on
   * @param commandName the name of the command to execute
   * @param args the arguments to pass to the command
   */
  @Suppress("INAPPLICABLE_JVM_NAME")
  @JvmName("kotlinCompat\$receiveCommand")
  @JvmSynthetic
  public fun receiveCommand(view: T, commandName: String, args: ReadableArray)

  @Suppress("INAPPLICABLE_JVM_NAME")
  @Deprecated(
      message = "args is not nullable, please update your method signature",
      replaceWith =
          ReplaceWith("receiveCommand(view: T, commandName: String, args: ReadableArray)"),
  )
  @JvmName("kotlinCompat\$receiveCommandNullableArgs")
  @JvmSynthetic
  public fun receiveCommand(view: T, commandName: String, args: ReadableArray?): Unit =
      receiveCommand(view, commandName, checkNotNull(args))

  @Suppress("INAPPLICABLE_JVM_NAME")
  @Deprecated(
      message = "commandName is not nullable, please update your method signature",
      replaceWith = ReplaceWith("receiveCommand(view, commandName, args)"),
  )
  @JvmName("receiveCommand")
  public fun javaCompat_receiveCommand(view: T, commandName: String?, args: ReadableArray?): Unit =
      receiveCommand(view, checkNotNull(commandName), checkNotNull(args))
}
