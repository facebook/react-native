/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.notification;

import android.app.NotificationManager;
import android.content.Context;
import android.support.v4.app.NotificationCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class NotificationModule extends ReactContextBaseJavaModule {

  public NotificationModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "NotificationModule";
  }

  @ReactMethod
  public void presentLocalNotification(final ReadableMap details, final int handle) {
    NotificationCompat.Builder builder = new NotificationCompat.Builder(getReactApplicationContext());

    builder.setSmallIcon(android.R.drawable.stat_sys_warning);
    builder.setAutoCancel(true);

    if (details.hasKey("title")) {
      String title = details.getString("title");

      builder.setContentTitle(title);
      builder.setTicker(title);
    }

    if (details.hasKey("body")) {
     builder.setContentText(details.getString("body"));
    }

    if (details.hasKey("count")) {
      builder.setNumber(details.getInt("count"));
    }

    if (details.hasKey("sticky")) {
      builder.setOngoing(details.getBoolean("sticky"));
    }

    getNotificationManager().notify(handle, builder.build());
  }

  @ReactMethod
  public void cancelLocalNotification(final int handle) {
    getNotificationManager().cancel(handle);
  }

  @ReactMethod
  public void cancelAllLocalNotifications() {
    getNotificationManager().cancelAll();
  }

  private NotificationManager getNotificationManager() {
    return (NotificationManager) getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
  }
}
