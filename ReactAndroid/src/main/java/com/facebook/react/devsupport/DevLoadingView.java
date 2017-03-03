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
import android.view.View;
import android.widget.RelativeLayout;
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
 * View to display loading messages on top of the screen. All methods are thread safe.
 */
public class DevLoadingView extends RelativeLayout {
  private static boolean sEnabled = true;

  public static void setDevLoadingEnabled(boolean enabled) {
    sEnabled = enabled;
  }

  private TextView mMessageTextView;

  public DevLoadingView(Context context) {
    super(context);
    inflate(context, R.layout.dev_loading_view, this);

    mMessageTextView = (TextView) findViewById(R.id.loading_text);
    setVisibility(View.GONE);
  }

  public void showMessage(final String message, final int color, final int backgroundColor) {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        setBackgroundColor(backgroundColor);

        mMessageTextView.setText(message);
        mMessageTextView.setTextColor(color);

        setVisibility(View.VISIBLE);
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
      getContext().getString(R.string.catalyst_loading_from_url, parsedURL.getHost() + ":" + parsedURL.getPort()),
      Color.WHITE,
      Color.parseColor("#035900"));
  }

  public void showForRemoteJSEnabled() {
    showMessage(getContext().getString(R.string.catalyst_remotedbg_message), Color.WHITE, Color.parseColor("#035900"));
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
        message.append("\u2026");

        mMessageTextView.setText(message);
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
        setVisibility(View.VISIBLE);
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
        setVisibility(View.GONE);
      }
    });
  }
}
