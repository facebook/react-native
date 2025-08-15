/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactContext
import com.facebook.soloader.SoLoader

internal object BlobCollector {
  init {
    SoLoader.loadLibrary("reactnativeblob")
  }

  @JvmStatic
  fun install(reactContext: ReactContext, blobModule: BlobModule) {
    reactContext.runOnJSQueueThread {
      val jsContext: JavaScriptContextHolder? = reactContext.getJavaScriptContextHolder()
      // When debugging in chrome the JS context is not available.
      if (jsContext != null && jsContext.get() != 0L) {
        nativeInstall(blobModule, jsContext.get())
      }
    }
  }

  private external fun nativeInstall(blobModule: Any, jsContext: Long)
}
