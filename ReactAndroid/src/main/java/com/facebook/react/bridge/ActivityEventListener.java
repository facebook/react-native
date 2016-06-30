// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import android.content.Intent;

/**
 * Listener for receiving activity events.
 */
public interface ActivityEventListener {

  /**
   * Called when host (activity/service) receives an {@link Activity#onActivityResult} call.
   */
  void onActivityResult(int requestCode, int resultCode, Intent data);

  /**
   * Called when a new intent is passed to the activity
   */
  void onNewIntent(Intent intent);
}
