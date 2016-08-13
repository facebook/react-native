// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import android.app.Activity;
import android.content.Intent;

/**
 * An empty implementation of {@link ActivityEventListener}
 */
public class BaseActivityEventListener implements ActivityEventListener {

  /**
   * @deprecated use {@link #onActivityResult(Activity, int, int, Intent)} instead.
   */
  @Deprecated
  public void onActivityResult(int requestCode, int resultCode, Intent data) { }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) { }

  @Override
  public void onNewIntent(Intent intent) { }
}
