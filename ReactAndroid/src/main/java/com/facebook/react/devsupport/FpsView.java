/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import java.util.Locale;

import android.annotation.TargetApi;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.debug.FpsDebugFrameCallback;

/**
 * View that automatically monitors and displays the current app frame rate. Also logs the current
 * FPS to logcat while active.
 *
 * NB: Requires API 16 for use of FpsDebugFrameCallback.
 */
@TargetApi(16)
public class FpsView extends FrameLayout {

  private static final int UPDATE_INTERVAL_MS = 500;

  private final TextView mTextView;
  private final FpsDebugFrameCallback mFrameCallback;
  private final FPSMonitorRunnable mFPSMonitorRunnable;

  public FpsView(ReactContext reactContext) {
    super(reactContext);
    inflate(reactContext, R.layout.fps_view, this);
    mTextView = (TextView) findViewById(R.id.fps_text);
    mFrameCallback = new FpsDebugFrameCallback(reactContext);
    mFPSMonitorRunnable = new FPSMonitorRunnable();
    setCurrentFPS(0, 0, 0, 0);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mFrameCallback.reset();
    mFrameCallback.start();
    mFPSMonitorRunnable.start();
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    mFrameCallback.stop();
    mFPSMonitorRunnable.stop();
  }

  private void setCurrentFPS(double currentFPS, double currentJSFPS, int droppedUIFrames, int total4PlusFrameStutters) {
    String fpsString = String.format(
        Locale.US,
        "UI: %.1f fps\n%d dropped so far\n%d stutters (4+) so far\nJS: %.1f fps",
        currentFPS,
        droppedUIFrames,
        total4PlusFrameStutters,
        currentJSFPS);
    mTextView.setText(fpsString);
    FLog.d(ReactConstants.TAG, fpsString);
  }

  /**
   * Timer that runs every UPDATE_INTERVAL_MS ms and updates the currently displayed FPS.
   */
  private class FPSMonitorRunnable implements Runnable {

    private boolean mShouldStop = false;
    private int mTotalFramesDropped = 0;
    private int mTotal4PlusFrameStutters = 0;

    @Override
    public void run() {
      if (mShouldStop) {
        return;
      }
      mTotalFramesDropped += mFrameCallback.getExpectedNumFrames() - mFrameCallback.getNumFrames();
      mTotal4PlusFrameStutters += mFrameCallback.get4PlusFrameStutters();
      setCurrentFPS(mFrameCallback.getFPS(), mFrameCallback.getJSFPS(), mTotalFramesDropped, mTotal4PlusFrameStutters);
      mFrameCallback.reset();

      postDelayed(this, UPDATE_INTERVAL_MS);
    }

    public void start() {
      mShouldStop = false;
      post(this);
    }

    public void stop() {
      mShouldStop = true;
    }
  }
}
