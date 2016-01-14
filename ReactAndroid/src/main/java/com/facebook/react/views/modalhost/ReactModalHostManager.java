// Copyright 2004-present Facebook. All Rights Reserved.

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
 *
 * TODO(8776300): Refactor this class to use @ReactProp
 */
public class ReactModalHostManager extends ViewGroupManager<ReactModalHostView> {

  private static final String REACT_CLASS = "RCTModalHostView";

  @ReactProp(name = "animated")
  public void setAnimated(ReactModalHostView view, boolean animated) {
    // TODO(8776300): Implement this
  }

  @ReactProp(name = "transparent")
  public void setTransparent(ReactModalHostView view, boolean transparent) {
    // TODO(8776300): Implement this
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
