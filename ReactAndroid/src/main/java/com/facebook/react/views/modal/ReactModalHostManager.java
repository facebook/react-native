/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal;

import android.content.DialogInterface;
import android.graphics.Point;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.viewmanagers.ModalHostViewManagerDelegate;
import com.facebook.react.viewmanagers.ModalHostViewManagerInterface;
import java.util.Map;

/** View manager for {@link ReactModalHostView} components. */
@ReactModule(name = ReactModalHostManager.REACT_CLASS)
public class ReactModalHostManager extends ViewGroupManager<ReactModalHostView>
    implements ModalHostViewManagerInterface<ReactModalHostView> {

  public static final String REACT_CLASS = "RCTModalHostView";

  private final ViewManagerDelegate<ReactModalHostView> mDelegate;

  public ReactModalHostManager() {
    mDelegate = new ModalHostViewManagerDelegate<>(this);
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
  public LayoutShadowNode createShadowNodeInstance() {
    return new ModalHostShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return ModalHostShadowNode.class;
  }

  @Override
  public void onDropViewInstance(ReactModalHostView view) {
    super.onDropViewInstance(view);
    view.onDropInstance();
  }

  @Override
  @ReactProp(name = "animationType")
  public void setAnimationType(ReactModalHostView view, @Nullable String animationType) {
    if (animationType != null) {
      view.setAnimationType(animationType);
    }
  }

  @Override
  @ReactProp(name = "transparent")
  public void setTransparent(ReactModalHostView view, boolean transparent) {
    view.setTransparent(transparent);
  }

  @Override
  @ReactProp(name = "statusBarTranslucent")
  public void setStatusBarTranslucent(ReactModalHostView view, boolean statusBarTranslucent) {
    view.setStatusBarTranslucent(statusBarTranslucent);
  }

  @Override
  @ReactProp(name = "hardwareAccelerated")
  public void setHardwareAccelerated(ReactModalHostView view, boolean hardwareAccelerated) {
    view.setHardwareAccelerated(hardwareAccelerated);
  }

  @Override
  public void setPresentationStyle(ReactModalHostView view, @Nullable String value) {}

  @Override
  public void setAnimated(ReactModalHostView view, boolean value) {}

  @Override
  public void setSupportedOrientations(ReactModalHostView view, @Nullable ReadableArray value) {}

  @Override
  public void setIdentifier(ReactModalHostView view, int value) {}

  @Override
  protected void addEventEmitters(ThemedReactContext reactContext, final ReactModalHostView view) {
    final EventDispatcher dispatcher =
        UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.getId());
    if (dispatcher != null) {
      view.setOnRequestCloseListener(
          new ReactModalHostView.OnRequestCloseListener() {
            @Override
            public void onRequestClose(DialogInterface dialog) {
              dispatcher.dispatchEvent(new RequestCloseEvent(view.getId()));
            }
          });
      view.setOnShowListener(
          new DialogInterface.OnShowListener() {
            @Override
            public void onShow(DialogInterface dialog) {
              dispatcher.dispatchEvent(new ShowEvent(view.getId()));
            }
          });
    }
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(RequestCloseEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRequestClose"))
        .put(ShowEvent.EVENT_NAME, MapBuilder.of("registrationName", "onShow"))
        .build();
  }

  @Override
  protected void onAfterUpdateTransaction(ReactModalHostView view) {
    super.onAfterUpdateTransaction(view);
    view.showOrUpdate();
  }

  @Override
  public Object updateState(
      ReactModalHostView view, ReactStylesDiffMap props, @Nullable StateWrapper stateWrapper) {
    view.getFabricViewStateManager().setStateWrapper(stateWrapper);
    Point modalSize = ModalHostHelper.getModalHostSize(view.getContext());
    view.updateState(modalSize.x, modalSize.y);
    return null;
  }

  @Override
  public ViewManagerDelegate<ReactModalHostView> getDelegate() {
    return mDelegate;
  }
}
