/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Typeface;
import android.text.method.ScrollingMovementMethod;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.TextView;

import com.facebook.react.R;

/**
 * Dialog for displaying JS errors in an eye-catching form (red box).
 */
/* package */ class RedBoxDialog extends Dialog {

  private final DevSupportManager mDevSupportManager;

  private TextView mTitle;
  private TextView mDetails;
  private Button mReloadJs;
  private int mCookie = 0;

  protected RedBoxDialog(Context context, DevSupportManager devSupportManager) {
    super(context, R.style.Theme_Catalyst_RedBox);

    requestWindowFeature(Window.FEATURE_NO_TITLE);

    setContentView(R.layout.redbox_view);

    mDevSupportManager = devSupportManager;

    mTitle = (TextView) findViewById(R.id.catalyst_redbox_title);
    mDetails = (TextView) findViewById(R.id.catalyst_redbox_details);
    mDetails.setTypeface(Typeface.MONOSPACE);
    mDetails.setHorizontallyScrolling(true);
    mDetails.setMovementMethod(new ScrollingMovementMethod());
    mReloadJs = (Button) findViewById(R.id.catalyst_redbox_reloadjs);
    mReloadJs.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View v) {
        mDevSupportManager.handleReloadJS();
      }
    });
  }

  public void setTitle(String title) {
    mTitle.setText(title);
  }

  public void setDetails(CharSequence details) {
    mDetails.setText(details);
  }

  public void setErrorCookie(int cookie) {
    mCookie = cookie;
  }

  public int getErrorCookie() {
    return mCookie;
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU) {
      mDevSupportManager.showDevOptionsDialog();
      return true;
    }

    return super.onKeyUp(keyCode, event);
  }
}
