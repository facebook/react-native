/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.support.annotation.Nullable;
import android.view.View;
import com.facebook.react.bridge.JSApplicationCausedNativeException;

/**
 * An exception caused by JS requesting the UI manager to perform an illegal view operation.
 */
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
