/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.os.Bundle
import android.view.ViewGroup
import com.facebook.react.uimanager.common.UIManagerType
import java.util.concurrent.atomic.AtomicInteger

/** Interface for the root native view of a React native application */
public interface ReactRoot {

  public companion object {
    /** This constant represents that ReactRoot hasn't started yet or it has been destroyed. */
    public const val STATE_STOPPED: Int = 0

    /** This constant represents that ReactRoot has started. */
    public const val STATE_STARTED: Int = 1
  }

  /** Return cached launch properties for app */
  public fun getAppProperties(): Bundle?

  public fun getJSModuleName(): String

  /** Fabric or Default UI Manager, see [UIManagerType] */
  @UIManagerType public fun getUIManagerType(): Int

  public fun getRootViewTag(): Int

  public fun setRootViewTag(rootViewTag: Int)

  /** Calls into JS to start the React application. */
  public fun runApplication()

  /** Handler for stages [com.facebook.react.surface.ReactStage] */
  public fun onStage(@ReactStage stage: Int)

  /** Return native view for root */
  public fun getRootViewGroup(): ViewGroup

  /** @return Cached values for widthMeasureSpec. */
  public fun getWidthMeasureSpec(): Int

  /** @return Cached values for and heightMeasureSpec. */
  public fun getHeightMeasureSpec(): Int

  /** Sets a flag that determines whether to log that content appeared on next view added. */
  public fun setShouldLogContentAppeared(shouldLogContentAppeared: Boolean)

  /**
   * @return a [String] that represents the root js application that is being rendered with this
   *   [ReactRoot]
   * @deprecated We recommend to not use this method as it is will be replaced in the near future.
   */
  @Deprecated("We recommend to not use this method as it is will be replaced in the near future.")
  public fun getSurfaceID(): String?

  /** @return an [AtomicInteger] that represents the state of the ReactRoot object. */
  public fun getState(): AtomicInteger
}
