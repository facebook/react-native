/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Dialog;
import android.content.Context;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.util.Supplier;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager;

/* internal */ class PausedInDebuggerOverlayDialogManager
    implements PausedInDebuggerOverlayManager {

  private final Supplier<Context> mContextSupplier;
  private @Nullable Dialog mPausedInDebuggerDialog;

  public PausedInDebuggerOverlayDialogManager(Supplier<Context> contextSupplier) {
    mContextSupplier = contextSupplier;
  }

  @Override
  public void showPausedInDebuggerOverlay(
      String message, DevSupportManager.PausedInDebuggerOverlayCommandListener listener) {
    UiThreadUtil.runOnUiThread(
        () -> {
          if (mPausedInDebuggerDialog != null) {
            mPausedInDebuggerDialog.dismiss();
          }
          @Nullable Context context = mContextSupplier.get();
          if (context == null) {
            return;
          }
          View dialogView =
              LayoutInflater.from(context).inflate(R.layout.paused_in_debugger_view, null);
          mPausedInDebuggerDialog = new Dialog(context);
          mPausedInDebuggerDialog.setContentView(dialogView);
          mPausedInDebuggerDialog.setCancelable(false);
          TextView pausedText = Assertions.assertNotNull(dialogView.findViewById(R.id.paused_text));
          pausedText.setText(message);
          View resumeButton = Assertions.assertNotNull(dialogView.findViewById(R.id.resume_button));
          resumeButton.setOnClickListener((v) -> listener.onResume());
          Window dialogWindow = mPausedInDebuggerDialog.getWindow();
          if (dialogWindow != null) {
            dialogWindow.setGravity(Gravity.TOP);
            dialogWindow.setBackgroundDrawableResource(R.drawable.paused_in_debugger_background);
          }
          mPausedInDebuggerDialog.show();
        });
  }

  @Override
  public void hidePausedInDebuggerOverlay() {
    UiThreadUtil.runOnUiThread(
        () -> {
          if (mPausedInDebuggerDialog != null) {
            mPausedInDebuggerDialog.dismiss();
            mPausedInDebuggerDialog = null;
          }
        });
  }
}
