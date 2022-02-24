/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.app.Activity;
import android.content.Intent;

/** An empty implementation of {@link ActivityEventListener} */
public class BaseActivityEventListener implements ActivityEventListener {

  /** @deprecated use {@link #onActivityResult(Activity, int, int, Intent)} instead. */
  @Deprecated
  public void onActivityResult(int requestCode, int resultCode, Intent data) {}

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {}

  @Override
  public void onNewIntent(Intent intent) {}
}
