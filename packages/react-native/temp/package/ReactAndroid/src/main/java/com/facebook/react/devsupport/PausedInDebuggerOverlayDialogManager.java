/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Dialog;
import android.content.Context;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
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
          View resumeButton = Assertions.assertNotNull(dialogView.findViewById(R.id.button));
          resumeButton.setOnClickListener((v) -> listener.onResume());
          TextView buttonText = Assertions.assertNotNull(dialogView.findViewById(R.id.button_text));
          buttonText.setText(message);

          mPausedInDebuggerDialog = new Dialog(context, R.style.NoAnimationDialog);
          mPausedInDebuggerDialog.setContentView(dialogView);
          mPausedInDebuggerDialog.setCancelable(false);

          Window dialogWindow = mPausedInDebuggerDialog.getWindow();
          if (dialogWindow != null) {
            WindowManager.LayoutParams layoutParams = dialogWindow.getAttributes();
            layoutParams.dimAmount = 0.2f;

            dialogWindow.setAttributes(layoutParams);
            dialogWindow.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            dialogWindow.setGravity(Gravity.TOP);
            dialogWindow.setElevation(0);
            dialogWindow.setBackgroundDrawable(
                new ColorDrawable(android.graphics.Color.TRANSPARENT));
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
