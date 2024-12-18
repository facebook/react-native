/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh

import android.graphics.Color
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidSwipeRefreshLayoutManagerDelegate
import com.facebook.react.viewmanagers.AndroidSwipeRefreshLayoutManagerInterface
import java.util.HashMap

/**
 * ViewManager for [ReactSwipeRefreshLayout] which allows the user to "pull to refresh" a child
 * view. Emits an `onRefresh` event when this happens.
 */
@ReactModule(name = SwipeRefreshLayoutManager.REACT_CLASS)
internal open class SwipeRefreshLayoutManager :
    ViewGroupManager<ReactSwipeRefreshLayout>(),
    AndroidSwipeRefreshLayoutManagerInterface<ReactSwipeRefreshLayout> {

  private val delegate: ViewManagerDelegate<ReactSwipeRefreshLayout> =
      AndroidSwipeRefreshLayoutManagerDelegate(this)

  override fun createViewInstance(reactContext: ThemedReactContext): ReactSwipeRefreshLayout =
      ReactSwipeRefreshLayout(reactContext)

  override fun getName(): String = REACT_CLASS

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  override fun setEnabled(view: ReactSwipeRefreshLayout, enabled: Boolean) {
    view.isEnabled = enabled
  }

  @ReactProp(name = "colors", customType = "ColorArray")
  override fun setColors(view: ReactSwipeRefreshLayout, colors: ReadableArray?) {
    if (colors != null) {
      val colorValues = IntArray(colors.size())
      for (i in 0..<colors.size()) {
        if (colors.getType(i) == ReadableType.Map) {
          colorValues[i] = ColorPropConverter.getColor(colors.getMap(i), view.context)
        } else {
          colorValues[i] = colors.getInt(i)
        }
      }
      view.setColorSchemeColors(*colorValues)
    } else {
      view.setColorSchemeColors()
    }
  }

  @ReactProp(name = "progressBackgroundColor", customType = "Color")
  override fun setProgressBackgroundColor(view: ReactSwipeRefreshLayout, color: Int?) {
    view.setProgressBackgroundColorSchemeColor(color ?: Color.TRANSPARENT)
  }

  // TODO(T46143833): Remove this method once the 'size' prop has been migrated to String in JS.
  fun setSize(view: ReactSwipeRefreshLayout, value: Int): Unit {
    view.setSize(value)
  }

  override fun setSize(view: ReactSwipeRefreshLayout, size: String?) {
    if (size == null || size.equals("default")) {
      view.setSize(SwipeRefreshLayout.DEFAULT)
    } else if (size.equals("large")) {
      view.setSize(SwipeRefreshLayout.LARGE)
    } else {
      throw IllegalArgumentException("Size must be 'default' or 'large', received: $size")
    }
  }

  // This prop temporarily takes both 0 and 1 as well as 'default' and 'large'.
  // 0 and 1 are deprecated and will be removed in a future release.
  // See T46143833
  @ReactProp(name = "size")
  fun setSize(view: ReactSwipeRefreshLayout, size: Dynamic): Unit {
    when {
      size.isNull -> view.setSize(SwipeRefreshLayout.DEFAULT)
      size.type == ReadableType.Number -> view.setSize(size.asInt())
      size.type == ReadableType.String -> this.setSize(view, size.asString())
      else -> throw IllegalArgumentException("Size must be 'default' or 'large'")
    }
  }

  @ReactProp(name = "refreshing")
  override fun setRefreshing(view: ReactSwipeRefreshLayout, refreshing: Boolean) {
    view.isRefreshing = refreshing
  }

  @ReactProp(name = "progressViewOffset", defaultFloat = 0f)
  override fun setProgressViewOffset(view: ReactSwipeRefreshLayout, offset: Float) {
    view.setProgressViewOffset(offset)
  }

  override fun setNativeRefreshing(view: ReactSwipeRefreshLayout, value: Boolean) {
    setRefreshing(view, value)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactSwipeRefreshLayout) {
    view.setOnRefreshListener {
      val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
      eventDispatcher?.dispatchEvent(RefreshEvent(UIManagerHelper.getSurfaceId(view), view.id))
    }
  }

  override fun receiveCommand(
      root: ReactSwipeRefreshLayout,
      commandId: String,
      args: ReadableArray?
  ) {
    when (commandId) {
      "setNativeRefreshing" ->
          if (args != null) {
            setRefreshing(root, args.getBoolean(0))
          }
      else -> {}
    }
  }

  override fun getExportedViewConstants(): MutableMap<String, Any> =
      mutableMapOf(
          "SIZE" to
              mutableMapOf(
                  "DEFAULT" to SwipeRefreshLayout.DEFAULT, "LARGE" to SwipeRefreshLayout.LARGE))

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants: MutableMap<String, Any> = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(
        mutableMapOf("topRefresh" to mutableMapOf("registrationName" to "onRefresh")))
    return eventTypeConstants
  }

  override fun getDelegate(): ViewManagerDelegate<ReactSwipeRefreshLayout> = delegate

  companion object {
    const val REACT_CLASS: String = "AndroidSwipeRefreshLayout"
  }
}
