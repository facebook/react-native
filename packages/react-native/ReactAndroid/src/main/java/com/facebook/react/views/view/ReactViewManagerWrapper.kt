/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.IViewGroupManager
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager

/** Temporary to help trace the cause of T151032868 */
class ReactViewReturnTypeException(message: String, e: Throwable) : Exception(message, e)

interface ReactViewManagerWrapper {
  fun createView(
      reactTag: Int,
      reactContext: ThemedReactContext,
      props: Any?,
      stateWrapper: StateWrapper?,
      jsResponderHandler: JSResponderHandler
  ): View

  fun updateProperties(viewToUpdate: View, props: Any?)

  fun receiveCommand(root: View, commandId: String, args: ReadableArray?)

  fun receiveCommand(root: View, commandId: Int, args: ReadableArray?)

  fun setPadding(view: View, left: Int, top: Int, right: Int, bottom: Int)

  fun updateState(view: View, props: Any?, stateWrapper: StateWrapper?): Any?

  fun updateExtraData(root: View, extraData: Any?)

  fun onDropViewInstance(view: View)

  fun getName(): String

  val viewGroupManager: IViewGroupManager<*>

  class DefaultViewManager(private val viewManager: ViewManager<View, *>) :
      ReactViewManagerWrapper {
    override fun createView(
        reactTag: Int,
        reactContext: ThemedReactContext,
        props: Any?,
        stateWrapper: StateWrapper?,
        jsResponderHandler: JSResponderHandler
    ): View {
      try {
        return viewManager.createView(
            reactTag, reactContext, props as? ReactStylesDiffMap, stateWrapper, jsResponderHandler)
      } catch (e: NullPointerException) {
        // Throwing to try capture information about the cause of T151032868, remove after.
        throw ReactViewReturnTypeException(
            "DefaultViewManagerWrapper::createView(${viewManager.getName()}, ${viewManager::class.java}) can't return null",
            e)
      }
    }

    override fun updateProperties(viewToUpdate: View, props: Any?) {
      viewManager.updateProperties(viewToUpdate, props as? ReactStylesDiffMap)
    }

    override fun receiveCommand(root: View, commandId: String, args: ReadableArray?) {
      viewManager.receiveCommand(root, commandId, args)
    }

    override fun receiveCommand(root: View, commandId: Int, args: ReadableArray?) {
      @Suppress("DEPRECATION") viewManager.receiveCommand(root, commandId, args)
    }

    override fun setPadding(view: View, left: Int, top: Int, right: Int, bottom: Int) {
      viewManager.setPadding(view, left, top, right, bottom)
    }

    override fun updateState(view: View, props: Any?, stateWrapper: StateWrapper?): Any? =
        viewManager.updateState(view, props as? ReactStylesDiffMap, stateWrapper)

    override fun updateExtraData(root: View, extraData: Any?) {
      viewManager.updateExtraData(root, extraData)
    }

    override fun onDropViewInstance(view: View) {
      viewManager.onDropViewInstance(view)
    }

    override fun getName(): String = viewManager.name

    override val viewGroupManager: IViewGroupManager<*>
      get() = viewManager as IViewGroupManager<*>
  }
}
