/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Activity;
import android.util.Pair;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.DefaultJSExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.SurfaceDelegate;
import com.facebook.react.devsupport.interfaces.BundleLoadCallback;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.ErrorCustomizer;
import com.facebook.react.devsupport.interfaces.ErrorType;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import java.io.File;

/**
 * A dummy implementation of {@link DevSupportManager} to be used in production mode where
 * development features aren't needed.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReleaseDevSupportManager implements DevSupportManager {

  private final DefaultJSExceptionHandler mDefaultJSExceptionHandler;

  public ReleaseDevSupportManager() {
    mDefaultJSExceptionHandler = new DefaultJSExceptionHandler();
  }

  @Override
  public void showNewJavaError(@Nullable String message, @Nullable Throwable e) {}

  @Override
  public void addCustomDevOption(
      @Nullable String optionName, @Nullable DevOptionHandler optionHandler) {}

  @Override
  public void showNewJSError(
      @Nullable String message, @Nullable ReadableArray details, int errorCookie) {}

  @Override
  public @Nullable View createRootView(@Nullable String appKey) {
    return null;
  }

  @Override
  public void destroyRootView(@Nullable View rootView) {}

  @Override
  public void updateJSError(
      @Nullable String message, @Nullable ReadableArray details, int errorCookie) {}

  @Override
  public void hideRedboxDialog() {}

  @Override
  public void showDevOptionsDialog() {}

  @Override
  public void setDevSupportEnabled(boolean isDevSupportEnabled) {}

  @Override
  public void startInspector() {}

  @Override
  public void stopInspector() {}

  @Override
  public void setHotModuleReplacementEnabled(boolean isHotModuleReplacementEnabled) {}

  @Override
  public void setRemoteJSDebugEnabled(boolean isRemoteJSDebugEnabled) {}

  @Override
  public void setFpsDebugEnabled(boolean isFpsDebugEnabled) {}

  @Override
  public void toggleElementInspector() {}

  @Override
  public boolean getDevSupportEnabled() {
    return false;
  }

  @Override
  public @Nullable DeveloperSettings getDevSettings() {
    return null;
  }

  @Override
  public @Nullable RedBoxHandler getRedBoxHandler() {
    return null;
  }

  @Override
  public void onNewReactContextCreated(ReactContext reactContext) {}

  @Override
  public void onReactInstanceDestroyed(ReactContext reactContext) {}

  @Override
  public @Nullable String getSourceMapUrl() {
    return null;
  }

  @Override
  public @Nullable String getSourceUrl() {
    return null;
  }

  @Override
  public @Nullable String getJSBundleURLForRemoteDebugging() {
    return null;
  }

  @Override
  public @Nullable String getDownloadedJSBundleFile() {
    return null;
  }

  @Override
  public boolean hasUpToDateJSBundleInCache() {
    return false;
  }

  @Override
  public void reloadSettings() {}

  @Override
  public void handleReloadJS() {}

  @Override
  public void reloadJSFromServer(final String bundleURL, final BundleLoadCallback callback) {}

  @Override
  public void loadSplitBundleFromServer(String bundlePath, DevSplitBundleCallback callback) {}

  @Override
  public void isPackagerRunning(final PackagerStatusCallback callback) {
    callback.onPackagerStatusFetched(false);
  }

  @Override
  public @Nullable File downloadBundleResourceFromUrlSync(
      final String resourceURL, @Nullable final File outputFile) {
    return null;
  }

  @Override
  public @Nullable String getLastErrorTitle() {
    return null;
  }

  @Override
  public @Nullable StackFrame[] getLastErrorStack() {
    return null;
  }

  @Override
  public @Nullable ErrorType getLastErrorType() {
    return null;
  }

  @Override
  public int getLastErrorCookie() {
    return 0;
  }

  @Override
  public void registerErrorCustomizer(@Nullable ErrorCustomizer errorCustomizer) {}

  @Override
  public @Nullable Pair<String, StackFrame[]> processErrorCustomizers(
      @Nullable Pair<String, StackFrame[]> errorInfo) {
    return errorInfo;
  }

  @Override
  public void setPackagerLocationCustomizer(
      @Nullable DevSupportManager.PackagerLocationCustomizer packagerLocationCustomizer) {}

  @Override
  public void handleException(Exception e) {
    mDefaultJSExceptionHandler.handleException(e);
  }

  @Override
  public @Nullable Activity getCurrentActivity() {
    return null;
  }

  @Override
  public @Nullable SurfaceDelegate createSurfaceDelegate(@Nullable String moduleName) {
    return null;
  }

  @Override
  public void openDebugger() {}

  @Override
  public void showPausedInDebuggerOverlay(
      String message, PausedInDebuggerOverlayCommandListener listener) {}

  @Override
  public void hidePausedInDebuggerOverlay() {}

  @Override
  public void setAdditionalOptionForPackager(String name, String value) {}
}
