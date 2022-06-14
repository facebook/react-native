/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.intent;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.nfc.NfcAdapter;
import android.provider.Settings;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeIntentAndroidSpec;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.module.annotations.ReactModule;

/** Intent module. Launch other activities or open URLs. */
@ReactModule(name = IntentModule.NAME)
public class IntentModule extends NativeIntentAndroidSpec {

  public static final String NAME = "IntentAndroid";

  public IntentModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  /**
   * Return the URL the activity was started with
   *
   * @param promise a promise which is resolved with the initial URL
   */
  @Override
  public void getInitialURL(Promise promise) {
    try {
      Activity currentActivity = getCurrentActivity();
      String initialURL = null;

      if (currentActivity != null) {
        Intent intent = currentActivity.getIntent();
        String action = intent.getAction();
        Uri uri = intent.getData();

        if (uri != null
            && (Intent.ACTION_VIEW.equals(action)
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action))) {
          initialURL = uri.toString();
        }
      }

      promise.resolve(initialURL);
    } catch (Exception e) {
      promise.reject(
          new JSApplicationIllegalArgumentException(
              "Could not get the initial URL : " + e.getMessage()));
    }
  }

  /**
   * Starts a corresponding external activity for the given URL.
   *
   * <p>For example, if the URL is "https://www.facebook.com", the system browser will be opened, or
   * the "choose application" dialog will be shown.
   *
   * @param url the URL to open
   */
  @Override
  public void openURL(String url, Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }

    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url).normalizeScheme());
      sendOSIntent(intent, false);

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(
          new JSApplicationIllegalArgumentException(
              "Could not open URL '" + url + "': " + e.getMessage()));
    }
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * @param url the URL to open
   * @param promise a promise that is always resolved with a boolean argument
   */
  @Override
  public void canOpenURL(String url, Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }

    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      // We need Intent.FLAG_ACTIVITY_NEW_TASK since getReactApplicationContext() returns
      // the ApplicationContext instead of the Activity context.
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      boolean canOpen =
          intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null;
      promise.resolve(canOpen);
    } catch (Exception e) {
      promise.reject(
          new JSApplicationIllegalArgumentException(
              "Could not check if URL '" + url + "' can be opened: " + e.getMessage()));
    }
  }

  /**
   * Starts an external activity to open app's settings into Android Settings
   *
   * @param promise a promise which is resolved when the Settings is opened
   */
  @Override
  public void openSettings(Promise promise) {
    try {
      Intent intent = new Intent();
      Activity currentActivity = getCurrentActivity();
      String selfPackageName = getReactApplicationContext().getPackageName();

      intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
      intent.addCategory(Intent.CATEGORY_DEFAULT);
      intent.setData(Uri.parse("package:" + selfPackageName));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
      currentActivity.startActivity(intent);

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(
          new JSApplicationIllegalArgumentException(
              "Could not open the Settings: " + e.getMessage()));
    }
  }

  /**
   * Allows to send intents on Android
   *
   * <p>For example, you can open the Notification Category screen for a specific application
   * passing action = 'android.settings.CHANNEL_NOTIFICATION_SETTINGS' and extras = [ {
   * 'android.provider.extra.APP_PACKAGE': 'your.package.name.here' }, {
   * 'android.provider.extra.CHANNEL_ID': 'your.channel.id.here } ]
   *
   * @param action The general action to be performed
   * @param extras An array of extras [{ String, String | Number | Boolean }]
   */
  @Override
  public void sendIntent(String action, @Nullable ReadableArray extras, Promise promise) {
    if (action == null || action.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid Action: " + action + "."));
      return;
    }

    Intent intent = new Intent(action);

    PackageManager packageManager = getReactApplicationContext().getPackageManager();
    if (intent.resolveActivity(packageManager) == null) {
      promise.reject(
          new JSApplicationIllegalArgumentException(
              "Could not launch Intent with action " + action + "."));
      return;
    }

    if (extras != null) {
      for (int i = 0; i < extras.size(); i++) {
        ReadableMap map = extras.getMap(i);
        String name = map.keySetIterator().nextKey();
        ReadableType type = map.getType(name);

        switch (type) {
          case String:
            {
              intent.putExtra(name, map.getString(name));
              break;
            }
          case Number:
            {
              // We cannot know from JS if is an Integer or Double
              // See: https://github.com/facebook/react-native/issues/4141
              // We might need to find a workaround if this is really an issue
              Double number = map.getDouble(name);
              intent.putExtra(name, number);
              break;
            }
          case Boolean:
            {
              intent.putExtra(name, map.getBoolean(name));
              break;
            }
          default:
            {
              promise.reject(
                  new JSApplicationIllegalArgumentException(
                      "Extra type for " + name + " not supported."));
              return;
            }
        }
      }
    }

    sendOSIntent(intent, true);
  }

  private void sendOSIntent(Intent intent, Boolean useNewTaskFlag) {
    Activity currentActivity = getCurrentActivity();

    String selfPackageName = getReactApplicationContext().getPackageName();
    ComponentName componentName =
        intent.resolveActivity(getReactApplicationContext().getPackageManager());
    String otherPackageName = (componentName != null ? componentName.getPackageName() : "");

    // If there is no currentActivity or we are launching to a different package we need to set
    // the FLAG_ACTIVITY_NEW_TASK flag
    if (useNewTaskFlag || currentActivity == null || !selfPackageName.equals(otherPackageName)) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    if (currentActivity != null) {
      currentActivity.startActivity(intent);
    } else {
      getReactApplicationContext().startActivity(intent);
    }
  }
}
