/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces.fabric

import android.content.Context
import android.view.ViewGroup
import com.facebook.react.interfaces.TaskInterface

/** Represents a Surface in React Native. */
public interface ReactSurface {

  // the API of this interface will be completed as we analyze and refactor API of ReactSurface,
  // ReactRootView, etc.

  // Returns surface ID of this surface
  public val surfaceID: Int

  // Returns module name of this surface
  public val moduleName: String

  // Returns whether the surface is running or not
  public val isRunning: Boolean

  // Returns React root view of this surface
  public val view: ViewGroup?

  // Returns context associated with the surface
  public val context: Context

  // Prerender this surface
  public fun prerender(): TaskInterface<Void>

  // Start running this surface
  public fun start(): TaskInterface<Void>

  // Stop running this surface
  public fun stop(): TaskInterface<Void>

  // Clear surface
  public fun clear()

  // Detach surface from Host
  public fun detach()
}
