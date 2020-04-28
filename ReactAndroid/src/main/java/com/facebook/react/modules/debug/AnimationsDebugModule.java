/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.debug;

import android.widget.Toast;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import java.util.Locale;

/**
 * Module that records debug information during transitions (animated navigation events such as
 * going from one screen to another).
 */
@ReactModule(name = AnimationsDebugModule.NAME)
public class AnimationsDebugModule extends ReactContextBaseJavaModule {

  protected static final String NAME = "AnimationsDebugModule";

  private @Nullable FpsDebugFrameCallback mFrameCallback;
  private @Nullable final DeveloperSettings mCatalystSettings;

  public AnimationsDebugModule(
      ReactApplicationContext reactContext, DeveloperSettings catalystSettings) {
    super(reactContext);
    mCatalystSettings = catalystSettings;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void startRecordingFps() {
    if (mCatalystSettings == null || !mCatalystSettings.isAnimationFpsDebugEnabled()) {
      return;
    }

    if (mFrameCallback != null) {
      throw new JSApplicationCausedNativeException("Already recording FPS!");
    }

    mFrameCallback = new FpsDebugFrameCallback(getReactApplicationContext());
    mFrameCallback.startAndRecordFpsAtEachFrame();
  }

  /**
   * Called when an animation finishes. The caller should include the animation stop time in ms
   * (unix time) so that we know when the animation stopped from the JS perspective and we don't
   * count time after as being part of the animation.
   */
  @ReactMethod
  public void stopRecordingFps(double animationStopTimeMs) {
    if (mFrameCallback == null) {
      return;
    }

    mFrameCallback.stop();

    // Casting to long is safe here since animationStopTimeMs is unix time and thus relatively small
    FpsDebugFrameCallback.FpsInfo fpsInfo = mFrameCallback.getFpsInfo((long) animationStopTimeMs);

    if (fpsInfo == null) {
      Toast.makeText(getReactApplicationContext(), "Unable to get FPS info", Toast.LENGTH_LONG);
    } else {
      String fpsString =
          String.format(
              Locale.US,
              "FPS: %.2f, %d frames (%d expected)",
              fpsInfo.fps,
              fpsInfo.totalFrames,
              fpsInfo.totalExpectedFrames);
      String jsFpsString =
          String.format(
              Locale.US,
              "JS FPS: %.2f, %d frames (%d expected)",
              fpsInfo.jsFps,
              fpsInfo.totalJsFrames,
              fpsInfo.totalExpectedFrames);
      String debugString =
          fpsString
              + "\n"
              + jsFpsString
              + "\n"
              + "Total Time MS: "
              + String.format(Locale.US, "%d", fpsInfo.totalTimeMs);
      FLog.d(ReactConstants.TAG, debugString);
      Toast.makeText(getReactApplicationContext(), debugString, Toast.LENGTH_LONG).show();
    }

    mFrameCallback = null;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    if (mFrameCallback != null) {
      mFrameCallback.stop();
      mFrameCallback = null;
    }
  }
}
