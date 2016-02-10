/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.shell;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.camera.CameraRollManager;
import com.facebook.react.modules.camera.ImageEditingManager;
import com.facebook.react.modules.camera.ImageStoreManager;
import com.facebook.react.modules.clipboard.ClipboardModule;
import com.facebook.react.modules.dialog.DialogModule;
import com.facebook.react.modules.datepicker.DatePickerDialogModule;
import com.facebook.react.modules.fresco.FrescoModule;
import com.facebook.react.modules.intent.IntentModule;
import com.facebook.react.modules.location.LocationModule;
import com.facebook.react.modules.netinfo.NetInfoModule;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.statusbar.StatusBarModule;
import com.facebook.react.modules.storage.AsyncStorageModule;
import com.facebook.react.modules.timepicker.TimePickerDialogModule;
import com.facebook.react.modules.toast.ToastModule;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.art.ARTRenderableViewManager;
import com.facebook.react.views.art.ARTSurfaceViewManager;
import com.facebook.react.views.drawer.ReactDrawerLayoutManager;
import com.facebook.react.views.image.ReactImageManager;
import com.facebook.react.views.picker.ReactDialogPickerManager;
import com.facebook.react.views.picker.ReactDropdownPickerManager;
import com.facebook.react.views.progressbar.ReactProgressBarViewManager;
import com.facebook.react.views.recyclerview.RecyclerViewBackedScrollViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager;
import com.facebook.react.views.scroll.ReactScrollViewManager;
import com.facebook.react.views.switchview.ReactSwitchManager;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.text.ReactTextInlineImageViewManager;
import com.facebook.react.views.text.ReactVirtualTextViewManager;
import com.facebook.react.views.textinput.ReactTextInputManager;
import com.facebook.react.views.toolbar.ReactToolbarManager;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.react.views.viewpager.ReactViewPagerManager;
import com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager;
import com.facebook.react.views.webview.ReactWebViewManager;

/**
 * Package defining basic modules and view managers.
 */
public class MainReactPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(
      new AppStateModule(reactContext),
      new AsyncStorageModule(reactContext),
      new CameraRollManager(reactContext),
      new ClipboardModule(reactContext),
      new DatePickerDialogModule(reactContext),
      new DialogModule(reactContext),
      new FrescoModule(reactContext),
      new ImageEditingManager(reactContext),
      new ImageStoreManager(reactContext),
      new IntentModule(reactContext),
      new LocationModule(reactContext),
      new NetworkingModule(reactContext),
      new NetInfoModule(reactContext),
      new StatusBarModule(reactContext),
      new TimePickerDialogModule(reactContext),
      new ToastModule(reactContext),
      new WebSocketModule(reactContext)
    );
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
      ARTRenderableViewManager.createARTGroupViewManager(),
      ARTRenderableViewManager.createARTShapeViewManager(),
      ARTRenderableViewManager.createARTTextViewManager(),
      new ARTSurfaceViewManager(),
      new ReactDialogPickerManager(),
      new ReactDrawerLayoutManager(),
      new ReactDropdownPickerManager(),
      new ReactHorizontalScrollViewManager(),
      new ReactImageManager(),
      new ReactProgressBarViewManager(),
      new ReactRawTextManager(),
      new ReactScrollViewManager(),
      new ReactSwitchManager(),
      new ReactTextInlineImageViewManager(),
      new ReactTextInputManager(),
      new ReactTextViewManager(),
      new ReactToolbarManager(),
      new ReactViewManager(),
      new ReactViewPagerManager(),
      new ReactVirtualTextViewManager(),
      new ReactWebViewManager(),
      new RecyclerViewBackedScrollViewManager(),
      new SwipeRefreshLayoutManager());
  }
}
