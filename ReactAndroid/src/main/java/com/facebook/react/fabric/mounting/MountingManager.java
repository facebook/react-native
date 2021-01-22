/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.ANY;

import android.view.View;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.RootViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.yoga.YogaMeasureMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Class responsible for actually dispatching view updates enqueued via {@link
 * FabricUIManager#scheduleMountItems(int, MountItem[])} on the UI thread.
 */
public class MountingManager {
  public static final String TAG = MountingManager.class.getSimpleName();

  @NonNull
  private final ConcurrentHashMap<Integer, SurfaceMountingManager> mSurfaceIdToManager =
      new ConcurrentHashMap<>(); // any thread

  private volatile int mNumStaleSurfaces = 0;

  @Nullable private SurfaceMountingManager mMostRecentSurfaceMountingManager;

  @NonNull private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  @NonNull private final ViewManagerRegistry mViewManagerRegistry;
  @NonNull private final RootViewManager mRootViewManager = new RootViewManager();

  public MountingManager(@NonNull ViewManagerRegistry viewManagerRegistry) {
    mViewManagerRegistry = viewManagerRegistry;
  }

  /**
   * Evict stale SurfaceManagers.
   *
   * <p>The reasoning here is that we want SurfaceManagers to stay around for a little while after
   * the Surface is stopped, to gracefully handle race conditions with (1) native libraries like
   * NativeAnimatedModule, (2) events emitted to nodes on the surface, (3) queued imperative calls
   * like dispatchCommand or sendAccessibilityEvent.
   *
   * <p>Without keeping the SurfaceManager around, those race conditions would result in us not
   * being able to resolve a tag at all, meaning some operation is happening with a totally invalid,
   * unknown tag. However, we want to fail gracefully since it's common for operations to be queued
   * up and races to happen with StopSurface. This way, we can distinguish between those race
   * conditions and other totally invalid operations on non-existing nodes.
   */
  @UiThread
  public void evictStaleSurfaces() {
    UiThreadUtil.assertOnUiThread();

    if (mNumStaleSurfaces == 0) {
      return;
    }

    mNumStaleSurfaces = 0;

    for (Map.Entry<Integer, SurfaceMountingManager> entry : mSurfaceIdToManager.entrySet()) {
      SurfaceMountingManager surfaceMountingManager = entry.getValue();
      int surfacedId = entry.getKey();
      if (surfaceMountingManager.isStopped()) {
        if (surfaceMountingManager.shouldKeepAliveStoppedSurface()) {
          mNumStaleSurfaces++;
        } else {
          FLog.e(TAG, "Evicting stale SurfaceMountingManager: [%d]", surfacedId);
          mSurfaceIdToManager.remove(surfacedId);

          if (surfaceMountingManager == mMostRecentSurfaceMountingManager) {
            mMostRecentSurfaceMountingManager = null;
          }
        }
      }
    }
  }

  /**
   * This mutates the rootView, which is an Android View, so this should only be called on the UI
   * thread.
   *
   * @param surfaceId
   * @param rootView
   */
  @AnyThread
  public void addRootView(
      final int surfaceId, @NonNull final View rootView, ThemedReactContext themedReactContext) {
    SurfaceMountingManager surfaceMountingManager =
        new SurfaceMountingManager(
            surfaceId,
            rootView,
            mJSResponderHandler,
            mViewManagerRegistry,
            mRootViewManager,
            themedReactContext);

    // There could technically be a race condition here if addRootView is called twice from
    // different threads, though this is (probably) extremely unlikely, and likely an error.
    // This logic to protect against race conditions is a holdover from older code, and we don't
    // know if it actually happens in practice - so, we're logging soft exceptions for now.
    // This *will* crash in Debug mode, but not in production.
    mSurfaceIdToManager.putIfAbsent(surfaceId, surfaceMountingManager);
    if (mSurfaceIdToManager.get(surfaceId) != surfaceMountingManager) {
      ReactSoftException.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Called addRootView more than once for the SurfaceId [" + surfaceId + "]"));
    }

    mMostRecentSurfaceMountingManager = mSurfaceIdToManager.get(surfaceId);
  }

  @AnyThread
  public void stopSurface(final int surfaceId) {
    SurfaceMountingManager surfaceMountingManager = mSurfaceIdToManager.get(surfaceId);
    if (surfaceMountingManager != null) {
      surfaceMountingManager.stopSurface();
      mNumStaleSurfaces++;

      if (surfaceMountingManager == mMostRecentSurfaceMountingManager) {
        mMostRecentSurfaceMountingManager = null;
      }
    } else {
      ReactSoftException.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Cannot call StopSurface on non-existent surface: [" + surfaceId + "]"));
    }

    // We do not evict surfaces right away; the SurfaceMountingManager will stay in memory for a bit
    // longer. See SurfaceMountingManager.stopSurface and
    // evictStaleSurfaces for more details.
  }

  @Nullable
  public SurfaceMountingManager getSurfaceManager(int surfaceId) {
    return mSurfaceIdToManager.get(surfaceId);
  }

  @NonNull
  public SurfaceMountingManager getSurfaceManagerEnforced(int surfaceId, String context) {
    SurfaceMountingManager surfaceMountingManager = getSurfaceManager(surfaceId);

    if (surfaceMountingManager == null) {
      throw new RetryableMountingLayerException(
          "Unable to find SurfaceMountingManager for surfaceId: ["
              + surfaceId
              + "]. Context: "
              + context);
    }

    return surfaceMountingManager;
  }

  /**
   * Get SurfaceMountingManager associated with a ReactTag. Unfortunately, this requires lookups
   * over N maps, where N is the number of active or recently-stopped Surfaces. Each lookup will
   * cost `log(M)` operations where M is the number of reactTags in the surface, so the total cost
   * per lookup is `O(N * log(M))`.
   *
   * <p>To mitigate this cost, we attempt to keep track of the "most recent" SurfaceMountingManager
   * and do lookups in it first. For the vast majority of use-cases, except for events or operations
   * sent to off-screen surfaces, or use-cases where multiple surfaces are visible and interactable,
   * this will reduce the lookup time to `O(log(M))`. Someone smarter than me could probably figure
   * out an amortized time.
   *
   * @param reactTag
   * @return
   */
  @Nullable
  public SurfaceMountingManager getSurfaceManagerForView(int reactTag) {
    if (mMostRecentSurfaceMountingManager != null
        && mMostRecentSurfaceMountingManager.getViewExists(reactTag)) {
      return mMostRecentSurfaceMountingManager;
    }

    for (Map.Entry<Integer, SurfaceMountingManager> entry : mSurfaceIdToManager.entrySet()) {
      SurfaceMountingManager smm = entry.getValue();
      if (smm != mMostRecentSurfaceMountingManager && smm.getViewExists(reactTag)) {
        if (mMostRecentSurfaceMountingManager == null) {
          mMostRecentSurfaceMountingManager = smm;
        }
        return smm;
      }
    }
    return null;
  }

  @NonNull
  @AnyThread
  public SurfaceMountingManager getSurfaceManagerForViewEnforced(int reactTag) {
    SurfaceMountingManager surfaceMountingManager = getSurfaceManagerForView(reactTag);

    if (surfaceMountingManager == null) {
      throw new RetryableMountingLayerException(
          "Unable to find SurfaceMountingManager for tag: [" + reactTag + "]");
    }

    return surfaceMountingManager;
  }

  public boolean getViewExists(int reactTag) {
    return getSurfaceManagerForView(reactTag) != null;
  }

  @Deprecated
  public void receiveCommand(
      int surfaceId, int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    UiThreadUtil.assertOnUiThread();
    getSurfaceManagerEnforced(surfaceId, "receiveCommand:int")
        .receiveCommand(reactTag, commandId, commandArgs);
  }

  public void receiveCommand(
      int surfaceId, int reactTag, @NonNull String commandId, @Nullable ReadableArray commandArgs) {
    UiThreadUtil.assertOnUiThread();
    getSurfaceManagerEnforced(surfaceId, "receiveCommand:string")
        .receiveCommand(reactTag, commandId, commandArgs);
  }

  /**
   * Send an accessibility eventType to a Native View. eventType is any valid `AccessibilityEvent.X`
   * value.
   *
   * <p>Why accept `-1` SurfaceId? Currently there are calls to
   * UIManagerModule.sendAccessibilityEvent which is a legacy API and accepts only reactTag. We will
   * have to investigate and migrate away from those calls over time.
   *
   * @param surfaceId
   * @param reactTag
   * @param eventType
   */
  public void sendAccessibilityEvent(int surfaceId, int reactTag, int eventType) {
    UiThreadUtil.assertOnUiThread();
    if (surfaceId != -1) {
      getSurfaceManagerForViewEnforced(reactTag).sendAccessibilityEvent(reactTag, eventType);
    } else {
      getSurfaceManagerEnforced(surfaceId, "sendAccessibilityEvent")
          .sendAccessibilityEvent(reactTag, eventType);
    }
  }

  @UiThread
  public void updateProps(int reactTag, @Nullable ReadableMap props) {
    UiThreadUtil.assertOnUiThread();
    if (props == null) {
      return;
    }

    getSurfaceManagerForViewEnforced(reactTag).updateProps(reactTag, props);
  }

  /**
   * Set the JS responder for the view associated with the tags received as a parameter.
   *
   * <p>The JSResponder coordinates the return values of the onInterceptTouch method in Android
   * Views. This allows JS to coordinate when a touch should be handled by JS or by the Android
   * native views. See {@link JSResponderHandler} for more details.
   *
   * <p>This method is going to be executed on the UIThread as soon as it is delivered from JS to
   * RN.
   *
   * <p>Currently, there is no warranty that the view associated with the react tag exists, because
   * this method is not handled by the react commit process.
   *
   * @param reactTag React tag of the first parent of the view that is NOT virtual
   * @param initialReactTag React tag of the JS view that initiated the touch operation
   * @param blockNativeResponder If native responder should be blocked or not
   */
  @UiThread
  public synchronized void setJSResponder(
      int surfaceId, int reactTag, int initialReactTag, boolean blockNativeResponder) {
    UiThreadUtil.assertOnUiThread();

    getSurfaceManagerEnforced(surfaceId, "setJSResponder")
        .setJSResponder(reactTag, initialReactTag, blockNativeResponder);
  }

  /**
   * Clears the JS Responder specified by {@link #setJSResponder(int, int, int, boolean)}. After
   * this method is called, all the touch events are going to be handled by JS.
   */
  @UiThread
  public void clearJSResponder() {
    mJSResponderHandler.clearJSResponder();
  }

  @AnyThread
  @ThreadConfined(ANY)
  public @Nullable EventEmitterWrapper getEventEmitter(int reactTag) {
    SurfaceMountingManager surfaceMountingManager = getSurfaceManagerForView(reactTag);
    if (surfaceMountingManager == null) {
      return null;
    }
    return surfaceMountingManager.getEventEmitter(reactTag);
  }

  /**
   * Measure a component, given localData, props, state, and measurement information. This needs to
   * remain here for now - and not in SurfaceMountingManager - because sometimes measures are made
   * outside of the context of a Surface; especially from C++ before StartSurface is called.
   *
   * @param context
   * @param componentName
   * @param localData
   * @param props
   * @param state
   * @param width
   * @param widthMode
   * @param height
   * @param heightMode
   * @param attachmentsPositions
   * @return
   */
  @AnyThread
  public long measure(
      @NonNull ReactContext context,
      @NonNull String componentName,
      @NonNull ReadableMap localData,
      @NonNull ReadableMap props,
      @NonNull ReadableMap state,
      float width,
      @NonNull YogaMeasureMode widthMode,
      float height,
      @NonNull YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {

    return mViewManagerRegistry
        .get(componentName)
        .measure(
            context,
            localData,
            props,
            state,
            width,
            widthMode,
            height,
            heightMode,
            attachmentsPositions);
  }

  public void initializeViewManager(String componentName) {
    mViewManagerRegistry.get(componentName);
  }
}
