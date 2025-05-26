/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.util.SparseArray
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.Animation.AnimationListener
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil.assertOnUiThread
import com.facebook.react.bridge.UiThreadUtil.getUiThreadHandler
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger.assertLegacyArchitecture
import com.facebook.react.uimanager.layoutanimation.LayoutAnimationType.Companion.toString
import javax.annotation.concurrent.NotThreadSafe

/**
 * Class responsible for animation layout changes, if a valid layout animation config has been
 * supplied. If not animation is available, layout change is applied immediately instead of
 * performing an animation.
 */
@NotThreadSafe
@LegacyArchitecture
public open class LayoutAnimationController {
  private val layoutCreateAnimation: AbstractLayoutAnimation = LayoutCreateAnimation()
  private val layoutUpdateAnimation: AbstractLayoutAnimation = LayoutUpdateAnimation()
  private val layoutDeleteAnimation: AbstractLayoutAnimation = LayoutDeleteAnimation()
  private val layoutHandlers = SparseArray<LayoutHandlingAnimation?>(0)

  private var shouldAnimateLayout = false
  private var maxAnimationDuration: Long = -1
  private var completionRunnable: Runnable? = null

  public fun initializeFromConfig(config: ReadableMap?, completionCallback: Callback?) {
    if (config == null) {
      reset()
      return
    }

    shouldAnimateLayout = false
    val globalDuration = if (config.hasKey("duration")) config.getInt("duration") else 0
    if (config.hasKey(toString(LayoutAnimationType.CREATE))) {
      layoutCreateAnimation.initializeFromConfig(
          config.getMap(toString(LayoutAnimationType.CREATE))!!, globalDuration)
      shouldAnimateLayout = true
    }
    if (config.hasKey(toString(LayoutAnimationType.UPDATE))) {
      layoutUpdateAnimation.initializeFromConfig(
          config.getMap(toString(LayoutAnimationType.UPDATE))!!, globalDuration)
      shouldAnimateLayout = true
    }
    if (config.hasKey(toString(LayoutAnimationType.DELETE))) {
      layoutDeleteAnimation.initializeFromConfig(
          config.getMap(toString(LayoutAnimationType.DELETE))!!, globalDuration)
      shouldAnimateLayout = true
    }

    if (shouldAnimateLayout && completionCallback != null) {
      completionRunnable = Runnable { completionCallback.invoke(java.lang.Boolean.TRUE) }
    }
  }

  public open fun reset() {
    layoutCreateAnimation.reset()
    layoutUpdateAnimation.reset()
    layoutDeleteAnimation.reset()
    completionRunnable = null
    shouldAnimateLayout = false
    maxAnimationDuration = -1
    for (i in layoutHandlers.size() - 1 downTo 0) {
      val animation = layoutHandlers.valueAt(i)
      if (!animation!!.isValid()) {
        layoutHandlers.removeAt(i)
      }
    }
  }

  public open fun shouldAnimateLayout(viewToAnimate: View?): Boolean {
    // if view parent is null, skip animation: view have been clipped, we don't want animation to
    // resume when view is re-attached to parent, which is the standard android animation behavior.
    // If there's a layout handling animation going on, it should be animated nonetheless since the
    // ongoing animation needs to be updated.
    if (viewToAnimate == null) {
      return false
    }
    return ((shouldAnimateLayout && viewToAnimate.parent != null) ||
        layoutHandlers[viewToAnimate.id] != null)
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
    assertOnUiThread()

    val reactTag = view.id

    // Update an ongoing animation if possible, otherwise the layout update would be ignored as
    // the existing animation would still animate to the old layout.
    val existingAnimation = layoutHandlers[reactTag]
    if (existingAnimation != null) {
      if (!existingAnimation.isValid()) {
        layoutHandlers.remove(reactTag)
      } else {
        existingAnimation.onLayoutUpdate(x, y, width, height)
        return
      }
    }

    // Determine which animation to use : if view is initially invisible, use create animation,
    // otherwise use update animation. This approach is easier than maintaining a list of tags
    // for recently created views.
    val layoutAnimation =
        if ((view.width == 0 || view.height == 0)) layoutCreateAnimation else layoutUpdateAnimation

    val animation = layoutAnimation.createAnimation(view, x, y, width, height)

    if (animation is LayoutHandlingAnimation) {
      animation.setAnimationListener(
          object : AnimationListener {
            override fun onAnimationStart(animation: Animation) {
              layoutHandlers.put(reactTag, animation as LayoutHandlingAnimation)
            }

            override fun onAnimationEnd(animation: Animation) {
              layoutHandlers.remove(reactTag)
            }

            override fun onAnimationRepeat(animation: Animation) = Unit
          })
    } else {
      view.layout(x, y, x + width, y + height)
    }

    if (animation != null) {
      val animationDuration = animation.duration
      if (animationDuration > maxAnimationDuration) {
        maxAnimationDuration = animationDuration
        scheduleCompletionCallback(animationDuration)
      }

      view.startAnimation(animation)
    }
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
    assertOnUiThread()

    val animation =
        layoutDeleteAnimation.createAnimation(view, view.left, view.top, view.width, view.height)

    if (animation != null) {
      disableUserInteractions(view)

      animation.setAnimationListener(
          object : AnimationListener {
            override fun onAnimationStart(anim: Animation) = Unit

            override fun onAnimationRepeat(anim: Animation) = Unit

            override fun onAnimationEnd(anim: Animation) {
              listener.onAnimationEnd()
            }
          })

      val animationDuration = animation.duration
      if (animationDuration > maxAnimationDuration) {
        scheduleCompletionCallback(animationDuration)
        maxAnimationDuration = animationDuration
      }

      view.startAnimation(animation)
    } else {
      listener.onAnimationEnd()
    }
  }

  /** Disables user interactions for a view and all it's subviews. */
  private fun disableUserInteractions(view: View) {
    view.isClickable = false
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        disableUserInteractions(view.getChildAt(i))
      }
    }
  }

  private fun scheduleCompletionCallback(delayMillis: Long) {
    if (completionRunnable != null) {
      val completionHandler = getUiThreadHandler()
      completionHandler.removeCallbacks(completionRunnable!!)
      completionHandler.postDelayed(completionRunnable!!, delayMillis)
    }
  }

  private companion object {
    init {
      assertLegacyArchitecture("LayoutAnimationController", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
