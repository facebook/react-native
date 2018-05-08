/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.react.devsupport.interfaces.ErrorCustomizer;
import javax.annotation.Nullable;

import java.io.File;

import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;

/**
 * A dummy implementation of {@link DevSupportManager} to be used in production mode where
 * development features aren't needed.
 */
public class DisabledDevSupportManager implements DevSupportManager {

  private final DefaultNativeModuleCallExceptionHandler mDefaultNativeModuleCallExceptionHandler;

  public DisabledDevSupportManager() {
    mDefaultNativeModuleCallExceptionHandler = new DefaultNativeModuleCallExceptionHandler();
  }

  @Override
  public void showNewJavaError(String message, Throwable e) {

  }

  @Override
  public void addCustomDevOption(String optionName, DevOptionHandler optionHandler) {

  }

  @Override
  public void showNewJSError(String message, ReadableArray details, int errorCookie) {

  }

  @Override
  public void updateJSError(String message, ReadableArray details, int errorCookie) {

  }

  @Override
  public void hideRedboxDialog() {

  }

  @Override
  public void showDevOptionsDialog() {

  }

  @Override
  public void setDevSupportEnabled(boolean isDevSupportEnabled) {

  }

  @Override
  public void startInspector() {

  }

  @Override
  public void stopInspector() {

  }

  @Override
  public boolean getDevSupportEnabled() {
    return false;
  }

  @Override
  public DeveloperSettings getDevSettings() {
    return null;
  }

  @Override
  public void onNewReactContextCreated(ReactContext reactContext) {

  }

  @Override
  public void onReactInstanceDestroyed(ReactContext reactContext) {

  }

  @Override
  public String getSourceMapUrl() {
    return null;
  }

  @Override
  public String getSourceUrl() {
    return null;
  }

  @Override
  public String getJSBundleURLForRemoteDebugging() {
    return null;
  }

  @Override
  public String getDownloadedJSBundleFile() {
    return null;
  }

  @Override
  public boolean hasUpToDateJSBundleInCache() {
    return false;
  }

  @Override
  public void reloadSettings() {

  }

  @Override
  public void handleReloadJS() {

  }

  @Override
  public void reloadJSFromServer(String bundleURL) {

  }

  @Override
  public void isPackagerRunning(PackagerStatusCallback callback) {

  }

  @Override
  public @Nullable File downloadBundleResourceFromUrlSync(
      final String resourceURL,
      final File outputFile) {
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
  public void registerErrorCustomizer(ErrorCustomizer errorCustomizer) {
    
  }

  @Override
  public void handleException(Exception e) {
    mDefaultNativeModuleCallExceptionHandler.handleException(e);
  }
}
