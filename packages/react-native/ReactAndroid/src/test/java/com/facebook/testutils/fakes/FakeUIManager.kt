/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to test against UIBlockViewResolver

package com.facebook.testutils.fakes

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.interop.UIBlockViewResolver

@OptIn(UnstableReactNativeAPI::class)
class FakeUIManager : UIManager, UIBlockViewResolver {

  // The number of times resolveView was called
  var resolvedViewCount = 0

  override fun profileNextBatch() {
    TODO("Not yet implemented")
  }

  override fun getPerformanceCounters(): MutableMap<String, Long> {
    TODO("Not yet implemented")
  }

  override fun <T : View?> addRootView(rootView: T, initialProps: WritableMap?): Int {
    TODO("Not yet implemented")
  }

  override fun <T : View?> startSurface(
      rootView: T,
      moduleName: String?,
      initialProps: WritableMap?,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int
  ): Int {
    TODO("Not yet implemented")
  }

  override fun stopSurface(surfaceId: Int) {
    TODO("Not yet implemented")
  }

  override fun updateRootLayoutSpecs(
      rootTag: Int,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int
  ) {
    TODO("Not yet implemented")
  }

  override fun dispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?) {
    TODO("Not yet implemented")
  }

  override fun dispatchCommand(reactTag: Int, commandId: String?, commandArgs: ReadableArray?) {
    TODO("Not yet implemented")
  }

  override fun <T : Any?> getEventDispatcher(): T {
    TODO("Not yet implemented")
  }

  override fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap?) {
    TODO("Not yet implemented")
  }

  override fun sendAccessibilityEvent(reactTag: Int, eventType: Int) {
    TODO("Not yet implemented")
  }

  override fun addUIManagerEventListener(listener: UIManagerListener?) {
    TODO("Not yet implemented")
  }

  override fun removeUIManagerEventListener(listener: UIManagerListener?) {
    TODO("Not yet implemented")
  }

  override fun resolveView(reactTag: Int): View? {
    resolvedViewCount += 1
    return null
  }

  override fun receiveEvent(reactTag: Int, eventName: String?, event: WritableMap?) {
    TODO("Not yet implemented")
  }

  override fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String?,
      event: WritableMap?
  ) {
    TODO("Not yet implemented")
  }

  override fun resolveCustomDirectEventName(eventName: String?): String? {
    TODO("Not yet implemented")
  }

  override fun initialize() {
    TODO("Not yet implemented")
  }

  override fun invalidate() {
    TODO("Not yet implemented")
  }
}
