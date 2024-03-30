/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStripAny;
import java.util.concurrent.Executor;

@DoNotStripAny
public class ReactInstanceManagerInspectorTarget implements AutoCloseable {
  public interface TargetDelegate {
    public void onReload();
  }

  private final HybridData mHybridData;

  public ReactInstanceManagerInspectorTarget(TargetDelegate delegate) {
    mHybridData =
        initHybrid(
            new Executor() {
              @Override
              public void execute(Runnable command) {
                if (UiThreadUtil.isOnUiThread()) {
                  command.run();
                } else {
                  UiThreadUtil.runOnUiThread(command);
                }
              }
            },
            delegate);
  }

  private native HybridData initHybrid(Executor executor, TargetDelegate delegate);

  public void close() {
    mHybridData.resetNative();
  }

  static {
    ReactBridge.staticInit();
  }
}
