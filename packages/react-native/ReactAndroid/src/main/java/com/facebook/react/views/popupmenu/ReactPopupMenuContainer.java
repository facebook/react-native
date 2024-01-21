/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.popupmenu;

import android.content.Context;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.PopupMenu;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;

public class ReactPopupMenuContainer extends FrameLayout {

  private @Nullable ReadableArray mMenuItems;

  public ReactPopupMenuContainer(Context context) {
    super(context);
  }

  public void setMenuItems(@Nullable ReadableArray menuItems) {
    mMenuItems = menuItems;
  }

  public void showPopupMenu() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.HONEYCOMB) {
      View view = this.getChildAt(0);

      PopupMenu popupMenu = new PopupMenu(getContext(), view);
      Menu menu = null;
      menu = popupMenu.getMenu();
      if (mMenuItems != null) {
        for (int i = 0; i < mMenuItems.size(); i++) {
          menu.add(Menu.NONE, Menu.NONE, i, mMenuItems.getString(i));
        }
      }

      popupMenu.setOnMenuItemClickListener(
          new PopupMenu.OnMenuItemClickListener() {
            @Override
            public boolean onMenuItemClick(MenuItem menuItem) {
              ReactContext reactContext = (ReactContext) getContext();
              EventDispatcher eventDispatcher =
                  UIManagerHelper.getEventDispatcherForReactTag(reactContext, getId());
              if (eventDispatcher != null) {
                eventDispatcher.dispatchEvent(
                    new PopupMenuSelectionEvent(
                        UIManagerHelper.getSurfaceId(reactContext), getId(), menuItem.getOrder()));
              }
              return true;
            }
          });

      popupMenu.show();
    }
  }
}
