/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import javax.annotation.concurrent.NotThreadSafe

/**
 * Class responsible for animation layout changes, if a valid layout animation config has been
 * supplied. If not animation is available, layout change is applied immediately instead of
 * performing an animation.
 */
@NotThreadSafe
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
public open class LayoutAnimationController {

  public fun initializeFromConfig(config: ReadableMap?, completionCallback: Callback?) {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "LayoutAnimationController",
        LegacyArchitectureLogLevel.ERROR,
    )
  }

  public open fun reset() {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "LayoutAnimationController",
        LegacyArchitectureLogLevel.ERROR,
    )
  }

  public open fun shouldAnimateLayout(viewToAnimate: View?): Boolean {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "LayoutAnimationController",
        LegacyArchitectureLogLevel.ERROR,
    )
    return false
  }

  /**
   * Update layout of given view, via immediate update or animation depending on the current batch
   * layout animation configuration supplied during initialization. Handles create and update
   * animations.
   *
   * @param view the view to update layout of
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  public open fun applyLayoutUpdate(view: View, x: Int, y: Int, width: Int, height: Int) {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "LayoutAnimationController",
        LegacyArchitectureLogLevel.ERROR,
    )
  }

  /**
   * Animate a view deletion using the layout animation configuration supplied during
   * initialization.
   *
   * @param view The view to animate.
   * @param listener Called once the animation is finished, should be used to completely remove the
   *   view.
   */
  public open fun deleteView(view: View, listener: LayoutAnimationListener) {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "LayoutAnimationController",
        LegacyArchitectureLogLevel.ERROR,
    )
  }
}
