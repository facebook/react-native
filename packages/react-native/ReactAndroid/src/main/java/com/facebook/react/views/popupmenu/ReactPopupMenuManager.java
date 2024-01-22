/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.popupmenu;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidPopupMenuManagerInterface;

@ReactModule(name = ReactPopupMenuManager.REACT_CLASS)
public class ReactPopupMenuManager extends ViewGroupManager<ReactPopupMenuContainer>
    implements AndroidPopupMenuManagerInterface<ReactPopupMenuContainer> {

  public static final String REACT_CLASS = "AndroidPopupMenu";

  public ReactPopupMenuManager() {}

  @Override
  public ReactPopupMenuContainer createViewInstance(ThemedReactContext context) {
    return new ReactPopupMenuContainer(context);
  }

  @ReactProp(name = "menuItems")
  public void setMenuItems(ReactPopupMenuContainer view, @Nullable ReadableArray items) {
    view.setMenuItems(items);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public void receiveCommand(
      @NonNull ReactPopupMenuContainer view, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "show":
        show(view);
        break;
    }
  }

  @Override
  public void show(ReactPopupMenuContainer popupMenu) {
    popupMenu.showPopupMenu();
  }
}
