// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import android.content.Intent;

/**
 * Listener for receiving activity events.
 */
public interface PermissionRequestListener {

  /**
   * Called when host (activity/service) receives an {@link Activity#onRequestPermissionsResult} permission request.
   */
  void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults);
}
