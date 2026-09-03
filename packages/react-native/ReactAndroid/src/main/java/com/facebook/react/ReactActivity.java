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
import android.graphics.Outline;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.PathInterpolator;
import android.window.BackEvent;
import android.window.OnBackAnimationCallback;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.util.AndroidVersion;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.jetbrains.annotations.NotNull;

/** Base Activity for React Native applications. */
public abstract class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  /**
   * {@code nativeID} of the view that in-app predictive back should scrub. Keep the previous
   * screen mounted underneath this view so it can peek through during the gesture.
   */
  public static final String PREDICTIVE_BACK_FRONT_PANE_NATIVE_ID = "predictiveBackFrontPane";

  private static final String PREDICTIVE_BACK_TAG = "PredictiveBack";
  private static final String PREDICTIVE_BACK_JS_EVENT = "predictiveBack";
  private static final long JS_PROGRESS_THROTTLE_MS = 32;
  private static final PredictiveBackEvent EMPTY_PREDICTIVE_BACK_EVENT =
      new PredictiveBackEvent(0f, PredictiveBackEvent.EDGE_NONE, 0f, 0f);

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
          finishPredictiveBackCommit();
          setEnabled(true);
        }
      };

  // Registered only on API 36+. Typed as Object so ReactActivity can load on older devices
  // that do not have android.window.OnBackInvokedCallback.
  private @Nullable Object mSystemNavigationObserver;

  // In-app OnBackAnimationCallback. Typed as Object for the same older-device class loading.
  private @Nullable Object mInAppPredictiveBack;

  private boolean mJsInterceptEnabled;
  private final List<PredictiveBackHandler> mPredictiveBackHandlers = new CopyOnWriteArrayList<>();
  private PredictiveBackEvent mLastPredictiveBackEvent = EMPTY_PREDICTIVE_BACK_EVENT;
  private long mLastJsProgressEmitMs;

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
    if (AndroidVersion.isAtLeastTargetSdk36(this)) {
      if (mSystemNavigationObserver != null) {
        SystemNavigationBackObserver.unregister(this, mSystemNavigationObserver);
        mSystemNavigationObserver = null;
      }
      if (mInAppPredictiveBack != null) {
        InAppPredictiveBack.unregister(this, mInAppPredictiveBack);
        mInAppPredictiveBack = null;
      }
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
    if (mBackPressedCallback.isEnabled() || mInAppPredictiveBack != null) {
      return;
    }
    Log.i(PREDICTIVE_BACK_TAG, "observer: system back committed, notifying JS");
    mDelegate.onBackPressed();
  }

  /**
   * When {@code true}, React Native consumes the back gesture so JS {@code BackHandler} can pop an
   * in-app screen. On Android 16+ (targetSdk 36) this registers a platform {@link
   * OnBackAnimationCallback} that scrubs the view tagged with {@link
   * #PREDICTIVE_BACK_FRONT_PANE_NATIVE_ID} during the swipe, revealing whatever is drawn behind it
   * — unless a {@link PredictiveBackHandler} is registered, in which case that handler owns the
   * animation. When {@code false} and no native handler is registered, the system predictive-back
   * animation can run.
   */
  public void setInterceptEnabled(boolean enabled) {
    mJsInterceptEnabled = enabled;
    updateConsumeCallback();
  }

  /**
   * Registers a native plugin (for example react-native-screens) as an owner of the back gesture.
   * While any handler is registered, React Native consumes the gesture. If a handler returns {@code
   * true} from {@link PredictiveBackHandler#onPredictiveBackCommitted()}, JS {@code
   * hardwareBackPress} is not emitted.
   */
  public void addPredictiveBackHandler(PredictiveBackHandler handler) {
    if (!mPredictiveBackHandlers.contains(handler)) {
      mPredictiveBackHandlers.add(handler);
    }
    updateConsumeCallback();
  }

  public void removePredictiveBackHandler(PredictiveBackHandler handler) {
    mPredictiveBackHandlers.remove(handler);
    updateConsumeCallback();
  }

  private void updateConsumeCallback() {
    boolean consume = mJsInterceptEnabled || !mPredictiveBackHandlers.isEmpty();
    if (!AndroidVersion.isAtLeastTargetSdk36(this)) {
      mBackPressedCallback.setEnabled(consume);
      return;
    }
    // Keep the commit-only callback off so it does not steal the gesture without progress.
    mBackPressedCallback.setEnabled(false);
    if (consume) {
      if (mInAppPredictiveBack == null) {
        mInAppPredictiveBack = InAppPredictiveBack.register(this);
      }
    } else if (mInAppPredictiveBack != null) {
      InAppPredictiveBack.unregister(this, mInAppPredictiveBack);
      mInAppPredictiveBack = null;
    }
  }

  boolean shouldScrubDefaultFrontPane() {
    return mJsInterceptEnabled && mPredictiveBackHandlers.isEmpty();
  }

  void dispatchPredictiveBackStarted(PredictiveBackEvent event) {
    mLastPredictiveBackEvent = event;
    mLastJsProgressEmitMs = 0;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackStarted(event);
    }
    emitPredictiveBackToJs("start", event, false);
  }

  void dispatchPredictiveBackProgressed(PredictiveBackEvent event) {
    mLastPredictiveBackEvent = event;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackProgressed(event);
    }
    emitPredictiveBackToJs("progress", event, true);
  }

  void dispatchPredictiveBackCancelled() {
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackCancelled();
    }
    emitPredictiveBackToJs("cancel", mLastPredictiveBackEvent, false);
  }

  void finishPredictiveBackCommit() {
    boolean consumed = false;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      if (mPredictiveBackHandlers.get(i).onPredictiveBackCommitted()) {
        consumed = true;
        break;
      }
    }
    emitPredictiveBackToJs("commit", mLastPredictiveBackEvent, false);
    if (!consumed) {
      notifyJsHardwareBackPressed();
    }
  }

  private void emitPredictiveBackToJs(
      String phase, PredictiveBackEvent event, boolean throttleProgress) {
    if (throttleProgress) {
      long now = SystemClock.uptimeMillis();
      if (mLastJsProgressEmitMs != 0 && now - mLastJsProgressEmitMs < JS_PROGRESS_THROTTLE_MS) {
        return;
      }
      mLastJsProgressEmitMs = now;
    }
    ReactDelegate reactDelegate = getReactDelegate();
    if (reactDelegate == null) {
      return;
    }
    ReactContext context = reactDelegate.getCurrentReactContext();
    if (context == null) {
      return;
    }
    WritableMap map = Arguments.createMap();
    map.putString("phase", phase);
    map.putDouble("progress", event.progress);
    map.putInt("swipeEdge", event.swipeEdge);
    map.putDouble("touchX", event.touchX);
    map.putDouble("touchY", event.touchY);
    context.emitDeviceEvent(PREDICTIVE_BACK_JS_EVENT, map);
  }

  void notifyJsHardwareBackPressed() {
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
   * Isolated so that {@link OnBackAnimationCallback} (API 34) is only loaded when in-app predictive
   * back is enabled, and not from {@link ReactActivity} fields or method signatures.
   */
  @RequiresApi(34)
  private static final class InAppPredictiveBack {

    static Object register(ReactActivity activity) {
      Callback callback = new Callback(activity);
      activity
          .getOnBackInvokedDispatcher()
          .registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback);
      return callback;
    }

    static void unregister(ReactActivity activity, Object callback) {
      if (callback instanceof OnBackInvokedCallback) {
        activity
            .getOnBackInvokedDispatcher()
            .unregisterOnBackInvokedCallback((OnBackInvokedCallback) callback);
      }
    }

    private static final class Callback implements OnBackAnimationCallback {
      private static final float MAX_SCALE_DELTA = 0.1f;
      private static final float MAX_CORNER_RADIUS_DP = 32f;
      private static final float MAX_SHADOW_Z_DP = 24f;
      private static final long CANCEL_DURATION_MS = 250;
      private static final long COMMIT_DURATION_MS = 220;
      private static final float COMMIT_SCALE = 0.8f;
      private static final float COMMIT_TRANSLATION_FRACTION = 0.12f;
      // System progress hits 1.0 well before a full-screen swipe. Decide commit
      // from actual travel so a short drag snaps back instead of popping.
      private static final float COMMIT_DISTANCE_FRACTION = 0.25f;
      private static final float COMMIT_VELOCITY_DP_PER_S = 900f;

      private final ReactActivity activity;
      private @Nullable View frontPane;
      private @Nullable ViewGroup paneParent;
      private boolean parentClippedChildren;
      private boolean parentClippedToPadding;
      private float originalElevation;
      private float cornerRadiusPx;
      private boolean gestureCancelled;
      private int swipeEdge;
      private float startTouchX;
      private float lastTouchX;
      private long lastEventTimeMs;
      private float velocityPxPerS;
      private float lastProgress;

      Callback(ReactActivity activity) {
        this.activity = activity;
      }

      @Override
      public void onBackStarted(BackEvent backEvent) {
        gestureCancelled = false;
        swipeEdge = backEvent.getSwipeEdge();
        startTouchX = backEvent.getTouchX();
        lastTouchX = startTouchX;
        lastEventTimeMs = SystemClock.uptimeMillis();
        velocityPxPerS = 0f;
        lastProgress = 0f;
        activity.dispatchPredictiveBackStarted(toPredictiveBackEvent(backEvent));
        if (!activity.shouldScrubDefaultFrontPane()) {
          Log.i(PREDICTIVE_BACK_TAG, "in-app: back started, native handler owns animation");
          return;
        }
        frontPane = findFrontPane();
        if (frontPane == null) {
          Log.i(PREDICTIVE_BACK_TAG, "in-app: back started, no front pane");
          return;
        }
        Log.i(
            PREDICTIVE_BACK_TAG,
            "in-app: back started pane="
                + frontPane.getClass().getSimpleName()
                + " "
                + frontPane.getWidth()
                + "x"
                + frontPane.getHeight());
        originalElevation = frontPane.getElevation();
        prepareParentForShadow(frontPane);
        frontPane.setAlpha(1f);
        frontPane.animate().cancel();
        frontPane.setClipToOutline(true);
        frontPane.setOutlineProvider(
            new ViewOutlineProvider() {
              @Override
              public void getOutline(View view, Outline outline) {
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), cornerRadiusPx);
              }
            });
        applyProgress(backEvent);
      }

      @Override
      public void onBackProgressed(BackEvent backEvent) {
        activity.dispatchPredictiveBackProgressed(toPredictiveBackEvent(backEvent));
        if (!activity.shouldScrubDefaultFrontPane()) {
          updateGestureMetrics(backEvent);
          return;
        }
        if (frontPane == null) {
          frontPane = findFrontPane();
          if (frontPane == null) {
            updateGestureMetrics(backEvent);
            return;
          }
        }
        applyProgress(backEvent);
      }

      @Override
      public void onBackCancelled() {
        Log.i(PREDICTIVE_BACK_TAG, "in-app: back cancelled");
        activity.dispatchPredictiveBackCancelled();
        cancelGesture();
      }

      @Override
      public void onBackInvoked() {
        if (gestureCancelled) {
          return;
        }
        if (!shouldCommit()) {
          Log.i(
              PREDICTIVE_BACK_TAG,
              "in-app: swipe too short, snapping back distance="
                  + Math.abs(lastTouchX - startTouchX)
                  + " progress="
                  + lastProgress);
          onBackCancelled();
          return;
        }
        commitGesture();
      }

      private void commitGesture() {
        Log.i(PREDICTIVE_BACK_TAG, "in-app: back committed, finishing animation");
        if (!activity.shouldScrubDefaultFrontPane() || frontPane == null) {
          activity.finishPredictiveBackCommit();
          return;
        }
        final View pane = frontPane;
        float width = pane.getWidth();
        float translationX =
            swipeEdge == BackEvent.EDGE_LEFT
                ? width * COMMIT_TRANSLATION_FRACTION
                : -width * COMMIT_TRANSLATION_FRACTION;
        cornerRadiusPx =
            MAX_CORNER_RADIUS_DP * activity.getResources().getDisplayMetrics().density;
        pane.invalidateOutline();
        float shadowZ =
            MAX_SHADOW_Z_DP * activity.getResources().getDisplayMetrics().density;
        pane.setElevation(originalElevation + shadowZ);
        pane.animate().cancel();
        pane.animate()
            .scaleX(COMMIT_SCALE)
            .scaleY(COMMIT_SCALE)
            .translationX(translationX)
            .translationZ(shadowZ)
            .alpha(0f)
            .setDuration(COMMIT_DURATION_MS)
            .setInterpolator(new PathInterpolator(0.4f, 0f, 1f, 1f))
            .withEndAction(
                () -> {
                  restoreParentClip();
                  if (activity.isFinishing() || activity.isDestroyed()) {
                    return;
                  }
                  if (frontPane == pane) {
                    frontPane = null;
                  }
                  activity.finishPredictiveBackCommit();
                })
            .start();
      }

      private boolean shouldCommit() {
        float width =
            frontPane != null
                ? frontPane.getWidth()
                : activity.getWindow().getDecorView().getWidth();
        float distancePx = Math.abs(lastTouchX - startTouchX);
        int touchSlop = ViewConfiguration.get(activity).getScaledTouchSlop();
        if (distancePx <= touchSlop) {
          // No drag reported. Either a 3-button press, or touch coords were
          // missing; fall back to progress so a short gesture can still cancel.
          return lastProgress < 0.05f || lastProgress >= 0.5f;
        }
        boolean farEnough = width > 0 && distancePx >= width * COMMIT_DISTANCE_FRACTION;
        float density = activity.getResources().getDisplayMetrics().density;
        float commitVelocityPx = COMMIT_VELOCITY_DP_PER_S * density;
        float commitVelocity =
            swipeEdge == BackEvent.EDGE_LEFT ? velocityPxPerS : -velocityPxPerS;
        boolean flung = commitVelocity >= commitVelocityPx;
        return farEnough || flung;
      }

      private void cancelGesture() {
        gestureCancelled = true;
        resetFrontPane(true);
      }

      private @Nullable View findFrontPane() {
        View root = activity.getWindow().getDecorView();
        View tagged = findLastViewWithNativeId(root, PREDICTIVE_BACK_FRONT_PANE_NATIVE_ID);
        if (tagged == null) {
          return null;
        }
        // Never scrub the activity/root wrapper: that scales the whole tree,
        // including the destination screen, which is what we want to reveal.
        if (tagged == root || tagged == activity.findViewById(android.R.id.content)) {
          return null;
        }
        return tagged;
      }

      private static @Nullable View findLastViewWithNativeId(View root, String nativeId) {
        View match = null;
        if (nativeId.equals(root.getTag(com.facebook.react.R.id.view_tag_native_id))) {
          match = root;
        }
        if (root instanceof ViewGroup) {
          ViewGroup group = (ViewGroup) root;
          for (int i = 0; i < group.getChildCount(); i++) {
            View childMatch = findLastViewWithNativeId(group.getChildAt(i), nativeId);
            if (childMatch != null) {
              match = childMatch;
            }
          }
        }
        return match;
      }

      private void applyProgress(BackEvent backEvent) {
        updateGestureMetrics(backEvent);
        if (frontPane == null) {
          return;
        }
        float progress = lastProgress;
        float density = activity.getResources().getDisplayMetrics().density;
        float scale = 1f - (MAX_SCALE_DELTA * progress);
        frontPane.setScaleX(scale);
        frontPane.setScaleY(scale);
        float maxTranslation = frontPane.getWidth() / 20f;
        float translationX =
            backEvent.getSwipeEdge() == BackEvent.EDGE_LEFT
                ? maxTranslation * progress
                : -maxTranslation * progress;
        frontPane.setTranslationX(translationX);
        frontPane.setElevation(originalElevation + MAX_SHADOW_Z_DP * progress * density);
        frontPane.setTranslationZ(MAX_SHADOW_Z_DP * progress * density);
        cornerRadiusPx = MAX_CORNER_RADIUS_DP * progress * density;
        frontPane.invalidateOutline();
      }

      private void updateGestureMetrics(BackEvent backEvent) {
        long now = SystemClock.uptimeMillis();
        float touchX = backEvent.getTouchX();
        if (lastEventTimeMs > 0 && now > lastEventTimeMs) {
          velocityPxPerS = (touchX - lastTouchX) * 1000f / (now - lastEventTimeMs);
        }
        lastTouchX = touchX;
        lastEventTimeMs = now;
        lastProgress = backEvent.getProgress();
        swipeEdge = backEvent.getSwipeEdge();
      }

      private static PredictiveBackEvent toPredictiveBackEvent(BackEvent backEvent) {
        return new PredictiveBackEvent(
            backEvent.getProgress(),
            backEvent.getSwipeEdge(),
            backEvent.getTouchX(),
            backEvent.getTouchY());
      }

      private void prepareParentForShadow(View pane) {
        if (!(pane.getParent() instanceof ViewGroup)) {
          paneParent = null;
          return;
        }
        paneParent = (ViewGroup) pane.getParent();
        parentClippedChildren = paneParent.getClipChildren();
        parentClippedToPadding = paneParent.getClipToPadding();
        paneParent.setClipChildren(false);
        paneParent.setClipToPadding(false);
      }

      private void restoreParentClip() {
        if (paneParent == null) {
          return;
        }
        paneParent.setClipChildren(parentClippedChildren);
        paneParent.setClipToPadding(parentClippedToPadding);
        paneParent = null;
      }

      private void resetFrontPane(boolean animate) {
        if (frontPane == null) {
          return;
        }
        cornerRadiusPx = 0f;
        if (animate) {
          frontPane
              .animate()
              .scaleX(1f)
              .scaleY(1f)
              .translationX(0f)
              .translationZ(0f)
              .alpha(1f)
              .setDuration(CANCEL_DURATION_MS)
              .setInterpolator(new DecelerateInterpolator())
              .withEndAction(
                  () -> {
                    if (frontPane != null) {
                      frontPane.setElevation(originalElevation);
                      frontPane.invalidateOutline();
                    }
                    restoreParentClip();
                  })
              .start();
        } else {
          frontPane.animate().cancel();
          frontPane.setScaleX(1f);
          frontPane.setScaleY(1f);
          frontPane.setTranslationX(0f);
          frontPane.setTranslationZ(0f);
          frontPane.setAlpha(1f);
          frontPane.setElevation(originalElevation);
          frontPane.invalidateOutline();
          restoreParentClip();
        }
      }
    }
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
