/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.view.View;
import androidx.annotation.AnyThread;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.RootViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.EventCategoryDef;
import com.facebook.yoga.YogaMeasureMode;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Class responsible for actually dispatching view updates enqueued via {@link
 * FabricUIManager#scheduleMountItem} on the UI thread.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class MountingManager {
  public static final String TAG = MountingManager.class.getSimpleName();
  private static final int MAX_STOPPED_SURFACE_IDS_LENGTH = 15;

  private final ConcurrentHashMap<Integer, SurfaceMountingManager> mSurfaceIdToManager =
      new ConcurrentHashMap<>(); // any thread

  private final CopyOnWriteArrayList<Integer> mStoppedSurfaceIds = new CopyOnWriteArrayList<>();

  @Nullable private SurfaceMountingManager mMostRecentSurfaceMountingManager;
  @Nullable private SurfaceMountingManager mLastQueriedSurfaceMountingManager;

  private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  private final ViewManagerRegistry mViewManagerRegistry;
  private final MountItemExecutor mMountItemExecutor;
  private final RootViewManager mRootViewManager = new RootViewManager();

  public interface MountItemExecutor {
    @UiThread
    @ThreadConfined(UI)
    void executeItems(Queue<MountItem> items);
  }

  public MountingManager(
      ViewManagerRegistry viewManagerRegistry, MountItemExecutor mountItemExecutor) {
    mViewManagerRegistry = viewManagerRegistry;
    mMountItemExecutor = mountItemExecutor;
  }

  /**
   * Starts surface without attaching the view. All view operations executed against that surface
   * will be queued until the view is attached.
   */
  @AnyThread
  public SurfaceMountingManager startSurface(
      final int surfaceId, ThemedReactContext reactContext, @Nullable View rootView) {
    SurfaceMountingManager surfaceMountingManager =
        new SurfaceMountingManager(
            surfaceId,
            mJSResponderHandler,
            mViewManagerRegistry,
            mRootViewManager,
            mMountItemExecutor,
            reactContext);

    // There could technically be a race condition here if addRootView is called twice from
    // different threads, though this is (probably) extremely unlikely, and likely an error.
    // This logic to protect against race conditions is a holdover from older code, and we don't
    // know if it actually happens in practice - so, we're logging soft exceptions for now.
    // This *will* crash in Debug mode, but not in production.
    mSurfaceIdToManager.putIfAbsent(surfaceId, surfaceMountingManager);
    if (mSurfaceIdToManager.get(surfaceId) != surfaceMountingManager) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "Called startSurface more than once for the SurfaceId [" + surfaceId + "]"));
    }

    mMostRecentSurfaceMountingManager = mSurfaceIdToManager.get(surfaceId);

    if (rootView != null) {
      surfaceMountingManager.attachRootView(rootView, reactContext);
    }

    return surfaceMountingManager;
  }

  @AnyThread
  public void attachRootView(
      final int surfaceId, final View rootView, ThemedReactContext themedReactContext) {
    SurfaceMountingManager surfaceMountingManager =
        getSurfaceManagerEnforced(surfaceId, "attachView");

    if (surfaceMountingManager.isStopped()) {
      ReactSoftExceptionLogger.logSoftException(
          TAG, new IllegalStateException("Trying to attach a view to a stopped surface"));
      return;
    }

    surfaceMountingManager.attachRootView(rootView, themedReactContext);
  }

  @AnyThread
  public void stopSurface(final int surfaceId) {
    SurfaceMountingManager surfaceMountingManager = mSurfaceIdToManager.get(surfaceId);
    if (surfaceMountingManager != null) {
      // Maximum number of stopped surfaces to keep track of
      while (mStoppedSurfaceIds.size() >= MAX_STOPPED_SURFACE_IDS_LENGTH) {
        Integer staleStoppedId = mStoppedSurfaceIds.get(0);
        Assertions.assertNotNull(staleStoppedId);
        mSurfaceIdToManager.remove(staleStoppedId.intValue());
        mStoppedSurfaceIds.remove(staleStoppedId);
        FLog.d(TAG, "Removing stale SurfaceMountingManager: [%d]", staleStoppedId.intValue());
      }
      mStoppedSurfaceIds.add(surfaceId);

      surfaceMountingManager.stopSurface();

      if (mMostRecentSurfaceMountingManager == surfaceMountingManager) {
        mMostRecentSurfaceMountingManager = null;
      }
      if (mLastQueriedSurfaceMountingManager == surfaceMountingManager) {
        mLastQueriedSurfaceMountingManager = null;
      }
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "Cannot call stopSurface on non-existent surface: [" + surfaceId + "]"));
    }
  }

  @Nullable
  public SurfaceMountingManager getSurfaceManager(int surfaceId) {
    if (mLastQueriedSurfaceMountingManager != null
        && mLastQueriedSurfaceMountingManager.getSurfaceId() == surfaceId) {
      return mLastQueriedSurfaceMountingManager;
    }

    if (mMostRecentSurfaceMountingManager != null
        && mMostRecentSurfaceMountingManager.getSurfaceId() == surfaceId) {
      return mMostRecentSurfaceMountingManager;
    }

    SurfaceMountingManager surfaceMountingManager = mSurfaceIdToManager.get(surfaceId);
    mLastQueriedSurfaceMountingManager = surfaceMountingManager;
    return surfaceMountingManager;
  }

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

  public boolean surfaceIsStopped(int surfaceId) {
    if (mStoppedSurfaceIds.contains(surfaceId)) {
      return true;
    }

    SurfaceMountingManager surfaceMountingManager = getSurfaceManager(surfaceId);
    if (surfaceMountingManager != null && surfaceMountingManager.isStopped()) {
      return true;
    }

    return false;
  }

  public boolean isWaitingForViewAttach(int surfaceId) {
    SurfaceMountingManager mountingManager = getSurfaceManager(surfaceId);
    if (mountingManager == null) {
      return false;
    }

    if (mountingManager.isStopped()) {
      return false;
    }

    return !mountingManager.isRootViewAttached();
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
      int surfaceId, int reactTag, String commandId, @Nullable ReadableArray commandArgs) {
    UiThreadUtil.assertOnUiThread();
    getSurfaceManagerEnforced(surfaceId, "receiveCommand:string")
        .receiveCommand(reactTag, commandId, commandArgs);
  }

  /**
   * Send an accessibility eventType to a Native View. eventType is any valid `AccessibilityEvent.X`
   * value.
   *
   * <p>Why accept {@ViewUtil.NO_SURFACE_ID}(-1) SurfaceId? Currently there are calls to
   * UIManager.sendAccessibilityEvent which is a legacy API and accepts only reactTag. We will have
   * to investigate and migrate away from those calls over time.
   *
   * @param surfaceId {@link int} that identifies the surface or {@ViewUtil.NO_SURFACE_ID}(-1) to
   *     temporarily support backward compatibility.
   * @param reactTag {@link int} that identifies the react Tag of the view.
   * @param eventType {@link int} that identifies Android eventType. see {@link
   *     View#sendAccessibilityEvent}
   */
  public void sendAccessibilityEvent(int surfaceId, int reactTag, int eventType) {
    UiThreadUtil.assertOnUiThread();
    if (surfaceId == View.NO_ID) {
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
   * Clears the JS Responder specified by {@link SurfaceMountingManager#setJSResponder}. After this
   * method is called, all the touch events are going to be handled by JS.
   */
  @UiThread
  public void clearJSResponder() {
    // MountingManager and SurfaceMountingManagers all share the same JSResponderHandler.
    // Must be called on MountingManager instead of SurfaceMountingManager, because we don't
    // know what surfaceId it's being called for.
    mJSResponderHandler.clearJSResponder();
  }

  @AnyThread
  @ThreadConfined(ANY)
  public @Nullable EventEmitterWrapper getEventEmitter(int surfaceId, int reactTag) {
    SurfaceMountingManager smm = getSurfaceMountingManager(surfaceId, reactTag);
    if (smm == null) {
      return null;
    }
    return smm.getEventEmitter(reactTag);
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
      ReactContext context,
      String componentName,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
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

  /**
   * Measure a component, given localData, props, state, and measurement information. This needs to
   * remain here for now - and not in SurfaceMountingManager - because sometimes measures are made
   * outside of the context of a Surface; especially from C++ before StartSurface is called.
   *
   * @param context
   * @param componentName
   * @param localData
   * @param props
   * @param width
   * @param widthMode
   * @param height
   * @param heightMode
   * @param attachmentsPositions
   * @return
   */
  @AnyThread
  public long measureMapBuffer(
      ReactContext context,
      String componentName,
      MapBuffer localData,
      MapBuffer props,
      @Nullable MapBuffer state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
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

  /**
   * THIS PREFETCH METHOD IS EXPERIMENTAL, DO NOT USE IT FOR PRODUCTION CODE. IT WILL MOST LIKELY
   * CHANGE OR BE REMOVED IN THE FUTURE.
   *
   * @param reactContext
   * @param componentName
   * @param surfaceId {@link int} surface ID
   * @param reactTag reactTag that should be set as ID of the view instance
   * @param params {@link MapBuffer} prefetch request params defined in C++
   */
  @AnyThread
  @UnstableReactNativeAPI
  public void experimental_prefetchResource(
      ReactContext reactContext,
      String componentName,
      int surfaceId,
      int reactTag,
      MapBuffer params) {
    mViewManagerRegistry
        .get(componentName)
        .experimental_prefetchResource(reactContext, surfaceId, reactTag, params);
  }

  public void enqueuePendingEvent(
      int surfaceId,
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      @Nullable WritableMap params,
      @EventCategoryDef int eventCategory) {
    SurfaceMountingManager smm = getSurfaceMountingManager(surfaceId, reactTag);
    if (smm == null) {
      FLog.d(
          TAG,
          "Cannot queue event without valid surface mounting manager for tag: %d, surfaceId: %d",
          reactTag,
          surfaceId);
      return;
    }
    smm.enqueuePendingEvent(reactTag, eventName, canCoalesceEvent, params, eventCategory);
  }

  private @Nullable SurfaceMountingManager getSurfaceMountingManager(int surfaceId, int reactTag) {
    return (surfaceId == ViewUtil.NO_SURFACE_ID
        ? getSurfaceManagerForView(reactTag)
        : getSurfaceManager(surfaceId));
  }
}
