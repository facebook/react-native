// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.devsupport;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import javax.annotation.Nullable;

@ReactModule(name = "JSDevSupport", needsEagerInit = true)
public class JSDevSupport extends ReactContextBaseJavaModule {

  static final String MODULE_NAME = "JSDevSupport";

  @Nullable
  private volatile DevSupportCallback mCurrentCallback = null;

  public interface JSDevSupportModule extends JavaScriptModule {
    void getJSHierarchy(String reactTag);
  }

  public JSDevSupport(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public interface DevSupportCallback {

    void onSuccess(String data);

    void onFailure(Exception error);
  }

  public synchronized void getJSHierarchy(String reactTag, DevSupportCallback callback) {
    if (mCurrentCallback != null) {
      callback.onFailure(new RuntimeException("JS Hierarchy download already in progress."));
      return;
    }

    JSDevSupportModule
        jsDevSupportModule = getReactApplicationContext().getJSModule(JSDevSupportModule.class);
    if (jsDevSupportModule == null) {
      callback.onFailure(new JSCHeapCapture.CaptureException(MODULE_NAME +
        " module not registered."));
      return;
    }
    mCurrentCallback = callback;
    jsDevSupportModule.getJSHierarchy(reactTag);
  }

  @SuppressWarnings("unused")
  @ReactMethod
  public synchronized void setResult(String data, String error) {
    if (mCurrentCallback != null) {
      if (error == null) {
        mCurrentCallback.onSuccess(data);
      } else {
        mCurrentCallback.onFailure(new RuntimeException(error));
      }
    }
    mCurrentCallback = null;
  }

  @Override
  public String getName() {
    return "JSDevSupport";
  }

}
