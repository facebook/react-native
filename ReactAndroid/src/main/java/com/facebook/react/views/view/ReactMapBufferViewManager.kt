/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

object ReactMapBufferViewManager : ReactViewManagerWrapper {
  private val viewManager = ReactViewManager()

  override fun createView(
      reactTag: Int,
      reactContext: ThemedReactContext,
      props: Any?,
      stateWrapper: StateWrapper?,
      jsResponderHandler: JSResponderHandler
  ): View =
      viewManager
          .createView(
              reactTag,
              reactContext,
              props as? ReactStylesDiffMap,
              stateWrapper,
              jsResponderHandler)
          .also { view ->
            if (props is ReadableMapBuffer) {
              updateProperties(view, props)
            }
          }

  override fun updateProperties(viewToUpdate: View, props: Any?) {
    if (props !is ReadableMapBuffer) {
      viewManager.updateProperties(viewToUpdate as ReactViewGroup, props as? ReactStylesDiffMap)
    } else {
      ReactMapBufferPropSetter.setProps(viewToUpdate as ReactViewGroup, viewManager, props)
    }
  }

  override fun receiveCommand(root: View, commandId: String, args: ReadableArray?) {
    viewManager.receiveCommand(root as ReactViewGroup, commandId, args)
  }

  override fun receiveCommand(root: View, commandId: Int, args: ReadableArray?) {
    viewManager.receiveCommand(root as ReactViewGroup, commandId, args)
  }

  override fun setPadding(view: View, left: Int, top: Int, right: Int, bottom: Int) {
    viewManager.setPadding(view as ReactViewGroup, left, top, right, bottom)
  }

  override fun updateState(view: View, props: Any?, stateWrapper: StateWrapper?): Any? = null

  override fun updateExtraData(root: View, extraData: Any?) {
    viewManager.updateExtraData(root as ReactViewGroup, extraData)
  }

  override fun onDropViewInstance(view: View) {
    viewManager.onDropViewInstance(view as ReactViewGroup)
  }

  override fun getName(): String = viewManager.name

  override val viewGroupManager: ViewGroupManager<*>
    get() = viewManager
}
