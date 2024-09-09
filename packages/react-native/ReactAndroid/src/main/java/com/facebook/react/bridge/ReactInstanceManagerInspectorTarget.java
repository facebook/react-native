/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.devsupport.inspector.InspectorNetworkRequestListener;
import java.util.Map;
import java.util.concurrent.Executor;
import javax.annotation.Nullable;

@DoNotStripAny
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactInstanceManagerInspectorTarget implements AutoCloseable {
  @DoNotStripAny
  public interface TargetDelegate {
    /** Android implementation for {@code HostTargetDelegate::getMetadata} */
    public Map<String, String> getMetadata();

    /** Android implementation for {@code HostTargetDelegate::onReload} */
    public void onReload();

    /** Android implementation for {@code HostTargetDelegate::onSetPausedInDebuggerMessage} */
    public void onSetPausedInDebuggerMessage(@Nullable String message);

    /** Android implementation for {@code HostTargetDelegate::loadNetworkResource} */
    public void loadNetworkResource(String url, InspectorNetworkRequestListener listener);
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

  public native void sendDebuggerResumeCommand();

  public void close() {
    mHybridData.resetNative();
  }

  /*internal*/ boolean isValid() {
    return mHybridData.isValid();
  }

  static {
    ReactBridge.staticInit();
  }
}
