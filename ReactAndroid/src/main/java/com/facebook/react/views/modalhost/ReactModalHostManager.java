/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.modalhost;

import android.content.DialogInterface;
import android.os.SystemClock;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

/**
 * View manager for {@link ReactModalHostView} components.
 *
 * Emits an {@code onDismiss} event when the Dialog host is dismissed.
 */
public class ReactModalHostManager extends ViewGroupManager<ReactModalHostView> {

  private static final String REACT_CLASS = "RCTModalHostView";

  @ReactProp(name = "animated")
  public void setAnimated(ReactModalHostView view, boolean animated) {
    // TODO(8776300): Implement this
  }

  @ReactProp(name = "transparent")
  public void setTransparent(ReactModalHostView view, boolean transparent) {
    view.setTransparent(transparent);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactModalHostView createViewInstance(ThemedReactContext reactContext) {
    return new ReactModalHostView(reactContext);
  }

  @Override
  public void onDropViewInstance(ReactModalHostView view) {
    super.onDropViewInstance(view);
    view.dismissModal();
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactModalHostView view) {
    view.setOnDismissListener(
        new DialogInterface.OnDismissListener() {
          @Override
          public void onDismiss(DialogInterface dialog) {
            reactContext.getNativeModule(UIManagerModule.class)
                .getEventDispatcher()
                .dispatchEvent(new DismissEvent(view.getId(), SystemClock.uptimeMillis()));
          }
        });
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(DismissEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDismiss"))
        .build();
  }
}
