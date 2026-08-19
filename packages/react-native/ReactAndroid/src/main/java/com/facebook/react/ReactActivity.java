/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.window.OnBackInvokedCallback;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.util.AndroidVersion;
import org.jetbrains.annotations.NotNull;

/** Base Activity for React Native applications. */
public abstract class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private static final String PREDICTIVE_BACK_TAG = "PredictiveBack";

  private final ReactActivityDelegate mDelegate;

  // On targetSdk 36, Activity.onBackPressed() is no longer invoked by the system. This callback
  // keeps JS BackHandler working by consuming back and forwarding it to JS.
  // An enabled callback suppresses the system predictive-back animation (back-to-home,
  // cross-activity, cross-task) and FragmentManager predictive-back transitions. Navigation
  // libraries that implement predictive back should disable it via getBackPressedCallback().
  private final OnBackPressedCallback mBackPressedCallback =
      new OnBackPressedCallback(true) {
        @Override
        public void handleOnBackPressed() {
          setEnabled(false);
          onBackPressed();
          setEnabled(true);
        }
      };

  // Registered only on API 36+. Typed as Object so ReactActivity can load on older devices
  // that do not have android.window.OnBackInvokedCallback.
  private @Nullable Object mSystemNavigationObserver;

  @SuppressWarnings("this-escape")
  protected ReactActivity() {
    mDelegate = createReactActivityDelegate();
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component. e.g. "MoviesApp"
   */
  protected @Nullable String getMainComponentName() {
    return null;
  }

  /** Called at construction time, override if you have a custom delegate implementation. */
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mDelegate.onCreate(savedInstanceState);
    if (AndroidVersion.isAtLeastTargetSdk36(this)) {
      getOnBackPressedDispatcher().addCallback(this, mBackPressedCallback);
      mSystemNavigationObserver = SystemNavigationBackObserver.register(this);
    }
  }

  @Override
  protected void onPause() {
    super.onPause();
    mDelegate.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    mDelegate.onResume();
  }

  @Override
  protected void onDestroy() {
    if (mSystemNavigationObserver != null && AndroidVersion.isAtLeastTargetSdk36(this)) {
      SystemNavigationBackObserver.unregister(this, mSystemNavigationObserver);
      mSystemNavigationObserver = null;
    }
    super.onDestroy();
    mDelegate.onDestroy();
  }

  public @Nullable ReactDelegate getReactDelegate() {
    return mDelegate.getReactDelegate();
  }

  public ReactActivityDelegate getReactActivityDelegate() {
    return mDelegate;
  }

  /**
   * Returns the {@link OnBackPressedCallback} React Native registers on Android 16+ (targetSdk 36)
   * to keep JS {@code BackHandler} working after {@code Activity.onBackPressed()} stopped being
   * called.
   *
   * <p>While this callback is enabled, Android will not play the system predictive-back animation,
   * and FragmentManager will not receive the gesture. Navigation libraries that implement
   * predictive back should disable it:
   *
   * <pre>{@code
   * getBackPressedCallback().setEnabled(false);
   * }</pre>
   *
   * <p>Disabling the callback means JS {@code BackHandler} can no longer prevent back. The system
   * or the next enabled callback (for example FragmentManager) handles the gesture instead. On
   * Android 16+, a {@code PRIORITY_SYSTEM_NAVIGATION_OBSERVER} still delivers the committed
   * app-exit event to {@code BackHandler} without suppressing the predictive-back animation.
   * Returning {@code true} from a listener cannot cancel an exit that is already in progress.
   */
  public OnBackPressedCallback getBackPressedCallback() {
    return mBackPressedCallback;
  }

  /**
   * Called when the system is handling back (app exit) and this activity's consuming callback is
   * disabled. Notifies JS without consuming the gesture, so the predictive-back animation can run.
   */
  void onSystemNavigationBackInvoked() {
    if (mBackPressedCallback.isEnabled()) {
      return;
    }
    Log.i(PREDICTIVE_BACK_TAG, "observer: system back committed, notifying JS");
    mDelegate.onBackPressed();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    mDelegate.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    return mDelegate.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mDelegate.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event);
  }

  @Override
  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    return mDelegate.onKeyLongPress(keyCode, event) || super.onKeyLongPress(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (!mDelegate.onBackPressed()) {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    // System predictive back may already be finishing the activity. Calling super again would
    // re-enter the dispatcher after JS BackHandler.exitApp().
    if (isFinishing()) {
      return;
    }
    // Temporarily disable so super.onBackPressed() can run the fallback (finish the activity)
    // instead of re-entering this callback. Restore the previous enabled state so that
    // libraries which disabled the callback for predictive back stay disabled after resume.
    boolean enabled = mBackPressedCallback.isEnabled();
    mBackPressedCallback.setEnabled(false);
    super.onBackPressed();
    mBackPressedCallback.setEnabled(enabled);
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (!mDelegate.onNewIntent(intent)) {
      super.onNewIntent(intent);
    }
  }

  @Override
  public void onUserLeaveHint() {
    super.onUserLeaveHint();
    mDelegate.onUserLeaveHint();
  }

  @Override
  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {
    mDelegate.requestPermissions(permissions, requestCode, listener);
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode, @NotNull String[] permissions, @NotNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    mDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    mDelegate.onWindowFocusChanged(hasFocus);
  }

  @Override
  public void onConfigurationChanged(@NotNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    mDelegate.onConfigurationChanged(newConfig);
  }

  protected final ReactNativeHost getReactNativeHost() {
    return mDelegate.getReactNativeHost();
  }

  protected ReactHost getReactHost() {
    return mDelegate.getReactHost();
  }

  protected final ReactInstanceManager getReactInstanceManager() {
    return mDelegate.getReactInstanceManager();
  }

  protected final void loadApp(String appKey) {
    mDelegate.loadApp(appKey);
  }

  /**
   * Isolated so that {@link OnBackInvokedCallback} (API 33) is only loaded when predictive back is
   * active, and not from {@link ReactActivity} fields or method signatures.
   */
  @RequiresApi(36)
  private static final class SystemNavigationBackObserver {

    // android.window.OnBackInvokedDispatcher.PRIORITY_SYSTEM_NAVIGATION_OBSERVER (API 36).
    // Inlined because this codebase is also compiled against older SDKs that lack the constant.
    private static final int PRIORITY_SYSTEM_NAVIGATION_OBSERVER = -2;

    @SuppressLint("WrongConstant")
    static @Nullable Object register(ReactActivity activity) {
      OnBackInvokedCallback callback = activity::onSystemNavigationBackInvoked;
      try {
        activity
            .getOnBackInvokedDispatcher()
            .registerOnBackInvokedCallback(PRIORITY_SYSTEM_NAVIGATION_OBSERVER, callback);
        return callback;
      } catch (IllegalArgumentException e) {
        // Observer priority is a flagged API and may be rejected on some devices.
        return null;
      }
    }

    static void unregister(ReactActivity activity, Object observer) {
      if (observer instanceof OnBackInvokedCallback) {
        activity
            .getOnBackInvokedDispatcher()
            .unregisterOnBackInvokedCallback((OnBackInvokedCallback) observer);
      }
    }
  }
}
