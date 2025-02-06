/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/**
 * This is an interface that should be implemented by view managers supporting the base view
 * properties such as backgroundColor, opacity, etc.
 */
public interface BaseViewManagerInterface<T : View> {
  public fun setAccessibilityActions(view: T, accessibilityActions: ReadableArray?)

  public fun setAccessibilityHint(view: T, accessibilityHint: String?)

  public fun setAccessibilityLabel(view: T, accessibilityLabel: String?)

  public fun setAccessibilityLiveRegion(view: T, liveRegion: String?)

  public fun setAccessibilityRole(view: T, accessibilityRole: String?)

  public fun setAccessibilityCollection(view: T, accessibilityCollection: ReadableMap?)

  public fun setAccessibilityCollectionItem(view: T, accessibilityCollectionItem: ReadableMap?)

  public fun setViewState(view: T, accessibilityState: ReadableMap?)

  public fun setBackgroundColor(view: T, backgroundColor: Int)

  public fun setBorderRadius(view: T, borderRadius: Float)

  public fun setBorderBottomLeftRadius(view: T, borderRadius: Float)

  public fun setBorderBottomRightRadius(view: T, borderRadius: Float)

  public fun setBorderTopLeftRadius(view: T, borderRadius: Float)

  public fun setBorderTopRightRadius(view: T, borderRadius: Float)

  public fun setElevation(view: T, elevation: Float)

  public fun setFilter(view: T, filter: ReadableArray)

  public fun setMixBlendMode(view: T, setMixBlendMode: String)

  public fun setShadowColor(view: T, shadowColor: Int)

  public fun setImportantForAccessibility(view: T, importantForAccessibility: String?)

  public fun setRole(view: T, role: String?)

  public fun setNativeId(view: T, nativeId: String?)

  public fun setAccessibilityLabelledBy(view: T, nativeId: Dynamic?)

  public fun setOpacity(view: T, opacity: Float)

  public fun setRenderToHardwareTexture(view: T, useHWTexture: Boolean)

  public fun setRotation(view: T, rotation: Float)

  public fun setScaleX(view: T, scaleX: Float)

  public fun setScaleY(view: T, scaleY: Float)

  public fun setTestId(view: T, testId: String?)

  public fun setTransform(view: T, matrix: ReadableArray?)

  public fun setTransformOrigin(view: T, transformOrigin: ReadableArray?)

  public fun setTranslateX(view: T, translateX: Float)

  public fun setTranslateY(view: T, translateY: Float)

  public fun setZIndex(view: T, zIndex: Float)
}
