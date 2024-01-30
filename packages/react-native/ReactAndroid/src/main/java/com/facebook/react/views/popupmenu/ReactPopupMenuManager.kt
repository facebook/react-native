/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.popupmenu

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidPopupMenuManagerInterface

@ReactModule(name = ReactPopupMenuManager.REACT_CLASS)
class ReactPopupMenuManager() :
    ViewGroupManager<ReactPopupMenuContainer>(),
    AndroidPopupMenuManagerInterface<ReactPopupMenuContainer> {
  override fun createViewInstance(reactContext: ThemedReactContext): ReactPopupMenuContainer {
    return ReactPopupMenuContainer(reactContext)
  }

  @ReactProp(name = "menuItems")
  override fun setMenuItems(view: ReactPopupMenuContainer, menuItems: ReadableArray?) {
    view.setMenuItems(menuItems)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun receiveCommand(
      view: ReactPopupMenuContainer,
      commandId: String,
      items: ReadableArray?
  ) {
    when (commandId) {
      "show" -> show(view)
      else -> {
        // no-op
      }
    }
  }

  override fun show(popupMenu: ReactPopupMenuContainer) {
    popupMenu.showPopupMenu()
  }

  companion object {
    const val REACT_CLASS: String = "AndroidPopupMenu"
  }
}
