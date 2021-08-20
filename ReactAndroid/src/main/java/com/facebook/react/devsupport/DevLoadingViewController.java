/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import static android.view.ViewGroup.LayoutParams.MATCH_PARENT;
import static android.view.ViewGroup.LayoutParams.WRAP_CONTENT;

import android.app.Activity;
import android.content.Context;
import android.graphics.Rect;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.widget.PopupWindow;
import android.widget.TextView;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Locale;

/** Controller to display loading messages on top of the screen. All methods are thread safe. */
public class DevLoadingViewController {
  private static boolean sEnabled = true;
  private final ReactInstanceManagerDevHelper mReactInstanceManagerHelper;
  private @Nullable TextView mDevLoadingView;
  private @Nullable PopupWindow mDevLoadingPopup;

  public static void setDevLoadingEnabled(boolean enabled) {
    sEnabled = enabled;
  }

  public DevLoadingViewController(ReactInstanceManagerDevHelper reactInstanceManagerHelper) {
    mReactInstanceManagerHelper = reactInstanceManagerHelper;
  }

  public void showMessage(final String message) {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            showInternal(message);
          }
        });
  }

  public void showForUrl(String url) {
    Context context = getContext();
    if (context == null) {
      return;
    }

    URL parsedURL;
    try {
      parsedURL = new URL(url);
    } catch (MalformedURLException e) {
      FLog.e(ReactConstants.TAG, "Bundle url format is invalid. \n\n" + e.toString());
      return;
    }

    showMessage(
        context.getString(
            R.string.catalyst_loading_from_url, parsedURL.getHost() + ":" + parsedURL.getPort()));
  }

  public void showForRemoteJSEnabled() {
    Context context = getContext();
    if (context == null) {
      return;
    }

    showMessage(context.getString(R.string.catalyst_debug_connecting));
  }

  public void updateProgress(
      final @Nullable String status, final @Nullable Integer done, final @Nullable Integer total) {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            StringBuilder message = new StringBuilder();
            message.append(status != null ? status : "Loading");
            if (done != null && total != null && total > 0) {
              message.append(
                  String.format(Locale.getDefault(), " %.1f%%", (float) done / total * 100));
            }
            message.append("\u2026"); // `...` character
            if (mDevLoadingView != null) {
              mDevLoadingView.setText(message);
            }
          }
        });
  }

  public void hide() {
    if (!sEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            hideInternal();
          }
        });
  }

  private void showInternal(String message) {
    if (mDevLoadingPopup != null && mDevLoadingPopup.isShowing()) {
      // already showing
      return;
    }

    Activity currentActivity = mReactInstanceManagerHelper.getCurrentActivity();
    if (currentActivity == null) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react " + "activity isn't available");
      return;
    }

    // PopupWindow#showAtLocation uses absolute screen position. In order for
    // loading view to be placed below status bar (if the status bar is present) we need to pass
    // an appropriate Y offset.
    Rect rectangle = new Rect();
    currentActivity.getWindow().getDecorView().getWindowVisibleDisplayFrame(rectangle);
    int topOffset = rectangle.top;

    LayoutInflater inflater =
        (LayoutInflater) currentActivity.getSystemService(Context.LAYOUT_INFLATER_SERVICE);

    mDevLoadingView = (TextView) inflater.inflate(R.layout.dev_loading_view, null);
    mDevLoadingView.setText(message);

    mDevLoadingPopup = new PopupWindow(mDevLoadingView, MATCH_PARENT, WRAP_CONTENT);
    mDevLoadingPopup.setTouchable(false);

    mDevLoadingPopup.showAtLocation(
        currentActivity.getWindow().getDecorView(), Gravity.NO_GRAVITY, 0, topOffset);
  }

  private void hideInternal() {
    if (mDevLoadingPopup != null && mDevLoadingPopup.isShowing()) {
      mDevLoadingPopup.dismiss();
      mDevLoadingPopup = null;
      mDevLoadingView = null;
    }
  }

  private @Nullable Context getContext() {
    return mReactInstanceManagerHelper.getCurrentActivity();
  }
}
