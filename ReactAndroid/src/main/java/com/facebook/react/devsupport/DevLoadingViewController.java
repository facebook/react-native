/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.WindowManager;
import android.widget.TextView;

import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Locale;

import javax.annotation.Nullable;

/**
 * Controller to display loading messages on top of the screen. All methods are thread safe.
 */
public class DevLoadingViewController {
  private static final int COLOR_DARK_GREEN = Color.parseColor("#035900");

  private static boolean sEnabled = true;
  private final Context mContext;
  private final WindowManager mWindowManager;
  private TextView mDevLoadingView;
  private boolean mIsVisible = false;

  public static void setDevLoadingEnabled(boolean enabled) {
    sEnabled = enabled;
  }

  public DevLoadingViewController(Context context) {
    mContext = context;
    mWindowManager = (WindowManager) mContext.getSystemService(Context.WINDOW_SERVICE);
    LayoutInflater inflater = (LayoutInflater) mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    mDevLoadingView = (TextView) inflater.inflate(R.layout.dev_loading_view, null);
  }

  public void showMessage(final String message, final int color, final int backgroundColor) {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        mDevLoadingView.setBackgroundColor(backgroundColor);
        mDevLoadingView.setText(message);
        mDevLoadingView.setTextColor(color);

        setVisible(true);
      }
    });
  }

  public void showForUrl(String url) {
    URL parsedURL;
    try {
      parsedURL = new URL(url);
    } catch (MalformedURLException e) {
      FLog.e(ReactConstants.TAG, "Bundle url format is invalid. \n\n" + e.toString());
      return;
    }

    showMessage(
      mContext.getString(R.string.catalyst_loading_from_url, parsedURL.getHost() + ":" + parsedURL.getPort()),
      Color.WHITE,
      COLOR_DARK_GREEN);
  }

  public void showForRemoteJSEnabled() {
    showMessage(mContext.getString(R.string.catalyst_remotedbg_message), Color.WHITE, COLOR_DARK_GREEN);
  }

  public void updateProgress(final @Nullable String status, final @Nullable Integer done, final @Nullable Integer total) {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        StringBuilder message = new StringBuilder();
        message.append(status != null ? status : "Loading");
        if (done != null && total != null && total > 0) {
          message.append(String.format(Locale.getDefault(), " %.1f%% (%d/%d)", (float) done / total * 100, done, total));
        }
        message.append("\u2026"); // `...` character

        mDevLoadingView.setText(message);
      }
    });
  }

  public void show() {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        setVisible(true);
      }
    });
  }

  public void hide() {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        setVisible(false);
      }
    });
  }

  private void setVisible(boolean visible) {
    if (visible && !mIsVisible) {
      WindowManager.LayoutParams params = new WindowManager.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT);
      params.gravity = Gravity.TOP;
      mWindowManager.addView(mDevLoadingView, params);
    } else if (!visible && mIsVisible) {
      mWindowManager.removeView(mDevLoadingView);
    }
    mIsVisible = visible;
  }
}
