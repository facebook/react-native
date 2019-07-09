package com.facebook.react.modules.blob;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactContext;
import com.facebook.soloader.SoLoader;

/* package */ class BlobCollector {
  static {
    SoLoader.loadLibrary("reactnativeblob");
  }

  static void install(final ReactContext reactContext, final BlobModule blobModule) {
    reactContext.runOnJSQueueThread(
        new Runnable() {
          @Override
          public void run() {
            JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder();
            synchronized (jsContext) {
              nativeInstall(blobModule, jsContext.get());
            }
          }
        });
  }

  private static native void nativeInstall(Object blobModule, long jsContext);
}
