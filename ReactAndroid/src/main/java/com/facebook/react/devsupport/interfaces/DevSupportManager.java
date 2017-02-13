/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport.interfaces;

import javax.annotation.Nullable;

import java.io.File;

import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;

/**
 * Interface for accessing and interacting with development features.
 * In dev mode, use the implementation {@link DevSupportManagerImpl}.
 * In production mode, use the dummy implementation {@link DisabledDevSupportManager}.
 */
public interface DevSupportManager extends NativeModuleCallExceptionHandler {

  void showNewJavaError(String message, Throwable e);
  void addCustomDevOption(String optionName, DevOptionHandler optionHandler);
  void showNewJSError(String message, ReadableArray details, int errorCookie);
  void updateJSError(final String message, final ReadableArray details, final int errorCookie);
  void hideRedboxDialog();
  void showDevOptionsDialog();
  void setDevSupportEnabled(boolean isDevSupportEnabled);
  boolean getDevSupportEnabled();
  DeveloperSettings getDevSettings();
  void onNewReactContextCreated(ReactContext reactContext);
  void onReactInstanceDestroyed(ReactContext reactContext);
  String getSourceMapUrl();
  String getSourceUrl();
  String getJSBundleURLForRemoteDebugging();
  String getDownloadedJSBundleFile();
  String getHeapCaptureUploadUrl();
  boolean hasUpToDateJSBundleInCache();
  void reloadSettings();
  void handleReloadJS();
  void reloadJSFromServer(final String bundleURL);
  void isPackagerRunning(PackagerStatusCallback callback);
  @Nullable File downloadBundleResourceFromUrlSync(
      final String resourceURL,
      final File outputFile);
  @Nullable String getLastErrorTitle();
  @Nullable StackFrame[] getLastErrorStack();
}
