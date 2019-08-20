/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationCausedNativeException;

/** An exception caused by JS requesting the UI manager to perform an illegal view operation. */
public class IllegalViewOperationException extends JSApplicationCausedNativeException {

  @Nullable private View mView;

  public IllegalViewOperationException(String msg) {
    super(msg);
  }

  public IllegalViewOperationException(String msg, @Nullable View view, Throwable cause) {
    super(msg, cause);
    mView = view;
  }

  @Nullable
  public View getView() {
    return mView;
  }
}
