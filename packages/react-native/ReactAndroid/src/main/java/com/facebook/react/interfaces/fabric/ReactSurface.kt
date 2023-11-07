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
interface ReactSurface {

  // the API of this interface will be completed as we analyze and refactor API of ReactSurface,
  // ReactRootView, etc.

  // Returns surface ID of this surface
  val surfaceID: Int

  // Returns module name of this surface
  val moduleName: String

  // Returns whether the surface is running or not
  val isRunning: Boolean

  // Returns React root view of this surface
  val view: ViewGroup?

  // Returns context associated with the surface
  val context: Context

  // Prerender this surface
  fun prerender(): TaskInterface<Void>

  // Start running this surface
  fun start(): TaskInterface<Void>

  // Stop running this surface
  fun stop(): TaskInterface<Void>

  // Clear surface
  fun clear()

  // Detach surface from Host
  fun detach()
}
