/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common;

import javax.annotation.Nullable;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;

/**
 * Subclass of {@link FrameLayout} that allows registering for size change events. The main purpose
 * for this class is to hide complexity of {@link ReactRootView} from the code under
 * {@link com.facebook.react.uimanager} package.
 */
public class SizeMonitoringFrameLayout extends FrameLayout {

  public interface OnSizeChangedListener {
    void onSizeChanged(int width, int height, int oldWidth, int oldHeight);
  }

  private @Nullable OnSizeChangedListener mOnSizeChangedListener;

  public SizeMonitoringFrameLayout(Context context) {
    super(context);
  }

  public SizeMonitoringFrameLayout(Context context, AttributeSet attrs) {
    super(context, attrs);
  }

  public SizeMonitoringFrameLayout(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
  }

  public void setOnSizeChangedListener(OnSizeChangedListener onSizeChangedListener) {
    mOnSizeChangedListener = onSizeChangedListener;
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);

    if (mOnSizeChangedListener != null) {
      mOnSizeChangedListener.onSizeChanged(w, h, oldw, oldh);
    }
  }
}
