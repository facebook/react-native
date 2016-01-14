package com.facebook.react.views.modalhost;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.facebook.react.R;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * A Modal view that works as a base ViewGroup to host other views.
 */
public class ReactModalHostView extends ViewGroup {

  private ReactViewGroup mHostView;
  private Dialog mDialog;

  public ReactModalHostView(Context context) {
    super(context);

    mHostView = new ReactViewGroup(context);

    mDialog = new Dialog(context, R.style.Theme_ReactNative_AppCompat_Light_NoActionBar_FullScreen);
    mDialog.setContentView(mHostView);
    mDialog.show();
    mDialog.getWindow().setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT);
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
  }

  @Override
  public void addView(View child, int index) {
    mHostView.addView(child, index);
  }

  @Override
  public int getChildCount() {
    return mHostView.getChildCount();
  }

  @Override
  public View getChildAt(int index) {
    return mHostView.getChildAt(index);
  }

  @Override
  public void removeView(View child) {
    mHostView.removeView(child);
  }

  /*package*/ void setOnDismissListener(DialogInterface.OnDismissListener listener) {
    mDialog.setOnDismissListener(listener);
  }

  @VisibleForTesting
  public Dialog getDialog() {
    return mDialog;
  }
}
