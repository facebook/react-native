/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual.viewexperimental

import android.graphics.Rect
import androidx.annotation.VisibleForTesting
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.viewmanagers.VirtualViewExperimentalManagerDelegate
import com.facebook.react.viewmanagers.VirtualViewExperimentalManagerInterface
import com.facebook.react.views.virtual.VirtualViewMode
import com.facebook.react.views.virtual.VirtualViewModeChangeEmitter
import com.facebook.react.views.virtual.VirtualViewModeChangeEvent
import com.facebook.react.views.virtual.VirtualViewRenderState

@ReactModule(name = ReactVirtualViewExperimentalManager.REACT_CLASS)
public class ReactVirtualViewExperimentalManager :
    ViewGroupManager<ReactVirtualViewExperimental>(),
    VirtualViewExperimentalManagerInterface<ReactVirtualViewExperimental> {

  private val _delegate = VirtualViewExperimentalManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReactVirtualViewExperimental> = _delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ReactVirtualViewExperimental =
      ReactVirtualViewExperimental(reactContext)

  @ReactProp(name = "initialHidden")
  override fun setInitialHidden(view: ReactVirtualViewExperimental, value: Boolean) {
    if (view.mode == null) {
      view.mode = if (value) VirtualViewMode.Hidden else VirtualViewMode.Visible
    }
  }

  @ReactProp(name = "renderState")
  override fun setRenderState(view: ReactVirtualViewExperimental, value: Int) {
    // If disabled, `renderState` will always be `VirtualViewRenderState.Unknown`.
    if (ReactNativeFeatureFlags.enableVirtualViewRenderState()) {
      view.renderState =
          when (value) {
            1 -> VirtualViewRenderState.Rendered
            2 -> VirtualViewRenderState.None
            else -> VirtualViewRenderState.Unknown
          }
    }
  }

  override fun setNativeId(view: ReactVirtualViewExperimental, nativeId: String?) {
    super.setNativeId(view, nativeId)
  }

  override fun addEventEmitters(
      reactContext: ThemedReactContext,
      view: ReactVirtualViewExperimental,
  ) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id) ?: return
    view.modeChangeEmitter =
        VirtualViewEventEmitter(view.id, UIManagerHelper.getSurfaceId(reactContext), dispatcher)
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactVirtualViewExperimental,
  ): ReactVirtualViewExperimental? {
    view.recycleView()
    return super.prepareToRecycleView(reactContext, view)
  }

  public companion object {
    public const val REACT_CLASS: String = "VirtualViewExperimental"
  }
}

@VisibleForTesting
public class VirtualViewEventEmitter(
    private val viewId: Int,
    private val surfaceId: Int,
    private val dispatcher: EventDispatcher,
) : VirtualViewModeChangeEmitter {
  override fun emitModeChange(
      mode: VirtualViewMode,
      targetRect: Rect,
      thresholdRect: Rect,
      synchronous: Boolean,
  ) {
    dispatcher.dispatchEvent(
        VirtualViewModeChangeEvent(
            surfaceId,
            viewId,
            mode,
            targetRect,
            thresholdRect,
            synchronous,
        )
    )
  }
}
