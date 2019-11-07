/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport.interfaces;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import java.io.File;

/**
 * Interface for accessing and interacting with development features. In dev mode, use the
 * implementation {@link DevSupportManagerImpl}. In production mode, use the dummy implementation
 * {@link DisabledDevSupportManager}.
 */
public interface DevSupportManager extends NativeModuleCallExceptionHandler {

  void showNewJavaError(String message, Throwable e);

  void addCustomDevOption(String optionName, DevOptionHandler optionHandler);

  void showNewJSError(String message, ReadableArray details, int errorCookie);

  void updateJSError(final String message, final ReadableArray details, final int errorCookie);

  void hideRedboxDialog();

  void showDevOptionsDialog();

  void setDevSupportEnabled(boolean isDevSupportEnabled);

  void startInspector();

  void stopInspector();

  boolean getDevSupportEnabled();

  DeveloperSettings getDevSettings();

  void onNewReactContextCreated(ReactContext reactContext);

  void onReactInstanceDestroyed(ReactContext reactContext);

  String getSourceMapUrl();

  String getSourceUrl();

  String getJSBundleURLForRemoteDebugging();

  String getDownloadedJSBundleFile();

  boolean hasUpToDateJSBundleInCache();

  void reloadSettings();

  void handleReloadJS();

  void reloadExpoApp();

  void reloadJSFromServer(final String bundleURL);

  void isPackagerRunning(PackagerStatusCallback callback);

  void setHotModuleReplacementEnabled(final boolean isHotModuleReplacementEnabled);

  void setRemoteJSDebugEnabled(final boolean isRemoteJSDebugEnabled);

  void setReloadOnJSChangeEnabled(final boolean isReloadOnJSChangeEnabled);

  void setFpsDebugEnabled(final boolean isFpsDebugEnabled);

  void toggleElementInspector();

  @Nullable
  File downloadBundleResourceFromUrlSync(final String resourceURL, final File outputFile);

  @Nullable
  String getLastErrorTitle();

  @Nullable
  StackFrame[] getLastErrorStack();

  void registerErrorCustomizer(ErrorCustomizer errorCustomizer);
}
