  /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.content.ComponentCallbacks2;
import android.content.res.Configuration;

import com.facebook.common.logging.FLog;
import com.facebook.react.animation.Animation;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.PerformanceCounter;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_START;

  /**
 * <p>Native module to allow JS to create and update native Views.</p>
 *
 * <p>
 * <h2>== Transactional Requirement ==</h2>
 * A requirement of this class is to make sure that transactional UI updates occur all at once,
 * meaning that no intermediate state is ever rendered to the screen. For example, if a JS
 * application update changes the background of View A to blue and the width of View B to 100, both
 * need to appear at once. Practically, this means that all UI update code related to a single
 * transaction must be executed as a single code block on the UI thread. Executing as multiple code
 * blocks could allow the platform UI system to interrupt and render a partial UI state.
 * </p>
 *
 * <p>To facilitate this, this module enqueues operations that are then applied to native view
 * hierarchy through {@link NativeViewHierarchyManager} at the end of each transaction.
 *
 * <p>
 * <h2>== CSSNodes ==</h2>
 * In order to allow layout and measurement to occur on a non-UI thread, this module also
 * operates on intermediate CSSNodeDEPRECATED objects that correspond to a native view. These CSSNodeDEPRECATED are able
 * to calculate layout according to their styling rules, and then the resulting x/y/width/height of
 * that layout is scheduled as an operation that will be applied to native view hierarchy at the end
 * of current batch.
 * </p>
 *
 * TODO(5241856): Investigate memory usage of creating many small objects in UIManageModule and
 *                consider implementing a pool
 * TODO(5483063): Don't dispatch the view hierarchy at the end of a batch if no UI changes occurred
 */
@ReactModule(name = "RKUIManager")
public class UIManagerModule extends ReactContextBaseJavaModule implements
    OnBatchCompleteListener, LifecycleEventListener, PerformanceCounter {

  // Keep in sync with ReactIOSTagHandles JS module - see that file for an explanation on why the
  // increment here is 10
  private static final int ROOT_VIEW_TAG_INCREMENT = 10;
  private static final boolean DEBUG = false;

  private final EventDispatcher mEventDispatcher;
  private final Map<String, Object> mModuleConstants;
  private final UIImplementation mUIImplementation;
  private final MemoryTrimCallback mMemoryTrimCallback = new MemoryTrimCallback();

  private int mNextRootViewTag = 1;
  private int mBatchId = 0;

  public UIManagerModule(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagerList,
      UIImplementationProvider uiImplementationProvider) {
    super(reactContext);
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext);
    mEventDispatcher = new EventDispatcher(reactContext);
    mModuleConstants = createConstants(viewManagerList);
    mUIImplementation = uiImplementationProvider
      .createUIImplementation(reactContext, viewManagerList, mEventDispatcher);

    reactContext.addLifecycleEventListener(this);
  }

  /**
   * This method gives an access to the {@link UIImplementation} object that can be used to execute
   * operations on the view hierarchy.
   */
  public UIImplementation getUIImplementation() {
    return mUIImplementation;
  }

  @Override
  public String getName() {
    return "RKUIManager";
  }

  @Override
  public Map<String, Object> getConstants() {
    return mModuleConstants;
  }

  @Override
  public void initialize() {
    getReactApplicationContext().registerComponentCallbacks(mMemoryTrimCallback);
  }

  @Override
  public void onHostResume() {
    mUIImplementation.onHostResume();
  }

  @Override
  public void onHostPause() {
    mUIImplementation.onHostPause();
  }

  @Override
  public void onHostDestroy() {
    mUIImplementation.onHostDestroy();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    mEventDispatcher.onCatalystInstanceDestroyed();

    getReactApplicationContext().unregisterComponentCallbacks(mMemoryTrimCallback);
    YogaNodePool.get().clear();
  }

  private static Map<String, Object> createConstants(List<ViewManager> viewManagerList) {
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_START);
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "CreateUIManagerConstants");
    try {
      return UIManagerModuleConstantsHelper.createConstants(viewManagerList);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_END);
    }
  }

  public Map<String,Double> getPerformanceCounters() {
    Map<String,Double> perfMap = new HashMap<>();
    perfMap.put("LayoutCount", mUIImplementation.getLayoutCount());
    perfMap.put("LayoutTimer", mUIImplementation.getLayoutTimer());
    return perfMap;
  }

  /**
   * Registers a new root view. JS can use the returned tag with manageChildren to add/remove
   * children to this view.
   *
   * Note that this must be called after getWidth()/getHeight() actually return something. See
   * CatalystApplicationFragment as an example.
   *
   * TODO(6242243): Make addMeasuredRootView thread safe
   * NB: this method is horribly not-thread-safe.
   */
  public int addMeasuredRootView(final SizeMonitoringFrameLayout rootView) {
    final int tag = mNextRootViewTag;
    mNextRootViewTag += ROOT_VIEW_TAG_INCREMENT;

    final int width;
    final int height;
    // If LayoutParams sets size explicitly, we can use that. Otherwise get the size from the view.
    if (rootView.getLayoutParams() != null &&
        rootView.getLayoutParams().width > 0 &&
        rootView.getLayoutParams().height > 0) {
      width = rootView.getLayoutParams().width;
      height = rootView.getLayoutParams().height;
    } else {
      width = rootView.getWidth();
      height = rootView.getHeight();
    }

    final ThemedReactContext themedRootContext =
        new ThemedReactContext(getReactApplicationContext(), rootView.getContext());

    mUIImplementation.registerRootView(rootView, tag, width, height, themedRootContext);

    rootView.setOnSizeChangedListener(
      new SizeMonitoringFrameLayout.OnSizeChangedListener() {
        @Override
        public void onSizeChanged(final int width, final int height, int oldW, int oldH) {
          getReactApplicationContext().runOnNativeModulesQueueThread(
            new Runnable() {
              @Override
              public void run() {
                updateNodeSize(tag, width, height);
              }
            });
        }
      });

    return tag;
  }

  @ReactMethod
  public void removeRootView(int rootViewTag) {
    mUIImplementation.removeRootView(rootViewTag);
  }

  public void updateNodeSize(int nodeViewTag, int newWidth, int newHeight) {
    getReactApplicationContext().assertOnNativeModulesQueueThread();

    mUIImplementation.updateNodeSize(nodeViewTag, newWidth, newHeight);
  }

  @ReactMethod
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {
    if (DEBUG) {
      FLog.d(
          ReactConstants.TAG,
          "(UIManager.createView) tag: " + tag + ", class: " + className + ", props: " + props);
    }
    mUIImplementation.createView(tag, className, rootViewTag, props);
  }

  @ReactMethod
  public void updateView(int tag, String className, ReadableMap props) {
    if (DEBUG) {
      FLog.d(
          ReactConstants.TAG,
          "(UIManager.updateView) tag: " + tag + ", class: " + className + ", props: " + props);
    }
    mUIImplementation.updateView(tag, className, props);
  }

  /**
   * Interface for adding/removing/moving views within a parent view from JS.
   *
   * @param viewTag the view tag of the parent view
   * @param moveFrom a list of indices in the parent view to move views from
   * @param moveTo parallel to moveFrom, a list of indices in the parent view to move views to
   * @param addChildTags a list of tags of views to add to the parent
   * @param addAtIndices parallel to addChildTags, a list of indices to insert those children at
   * @param removeFrom a list of indices of views to permanently remove. The memory for the
   *        corresponding views and data structures should be reclaimed.
   */
  @ReactMethod
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {
    if (DEBUG) {
      FLog.d(
          ReactConstants.TAG,
          "(UIManager.manageChildren) tag: " + viewTag +
          ", moveFrom: " + moveFrom +
          ", moveTo: " + moveTo +
          ", addTags: " + addChildTags +
          ", atIndices: " + addAtIndices +
          ", removeFrom: " + removeFrom);
    }
    mUIImplementation.manageChildren(
        viewTag,
        moveFrom,
        moveTo,
        addChildTags,
        addAtIndices,
        removeFrom);
  }

  /**
   * Interface for fast tracking the initial adding of views.  Children view tags are assumed to be
   * in order
   *
   * @param viewTag the view tag of the parent view
   * @param childrenTags An array of tags to add to the parent in order
   */
  @ReactMethod
  public void setChildren(
    int viewTag,
    ReadableArray childrenTags) {
    if (DEBUG) {
      FLog.d(
          ReactConstants.TAG,
          "(UIManager.setChildren) tag: " + viewTag + ", children: " + childrenTags);
    }
    mUIImplementation.setChildren(viewTag, childrenTags);
  }

  /**
   * Replaces the View specified by oldTag with the View specified by newTag within oldTag's parent.
   * This resolves to a simple {@link #manageChildren} call, but React doesn't have enough info in
   * JS to formulate it itself.
   */
  @ReactMethod
  public void replaceExistingNonRootView(int oldTag, int newTag) {
    mUIImplementation.replaceExistingNonRootView(oldTag, newTag);
  }

  /**
   * Method which takes a container tag and then releases all subviews for that container upon
   * receipt.
   * TODO: The method name is incorrect and will be renamed, #6033872
   * @param containerTag the tag of the container for which the subviews must be removed
   */
  @ReactMethod
  public void removeSubviewsFromContainerWithID(int containerTag) {
    mUIImplementation.removeSubviewsFromContainerWithID(containerTag);
  }

  /**
   * Determines the location on screen, width, and height of the given view and returns the values
   * via an async callback.
   */
  @ReactMethod
  public void measure(int reactTag, Callback callback) {
    mUIImplementation.measure(reactTag, callback);
  }

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback.  This is the absolute position including
   * things like the status bar
   */
  @ReactMethod
  public void measureInWindow(int reactTag, Callback callback) {
    mUIImplementation.measureInWindow(reactTag, callback);
  }

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case
   * the position always will be (0, 0) and method will only measure the view dimensions.
   *
   * NB: Unlike {@link #measure}, this will measure relative to the view layout, not the visible
   * window which can cause unexpected results when measuring relative to things like ScrollViews
   * that can have offset content on the screen.
   */
  @ReactMethod
  public void measureLayout(
      int tag,
      int ancestorTag,
      Callback errorCallback,
      Callback successCallback) {
    mUIImplementation.measureLayout(tag, ancestorTag, errorCallback, successCallback);
  }

  /**
   * Like {@link #measure} and {@link #measureLayout} but measures relative to the immediate parent.
   *
   * NB: Unlike {@link #measure}, this will measure relative to the view layout, not the visible
   * window which can cause unexpected results when measuring relative to things like ScrollViews
   * that can have offset content on the screen.
   */
  @ReactMethod
  public void measureLayoutRelativeToParent(
      int tag,
      Callback errorCallback,
      Callback successCallback) {
    mUIImplementation.measureLayoutRelativeToParent(tag, errorCallback, successCallback);
  }

  /**
   * Find the touch target child native view in  the supplied root view hierarchy, given a react
   * target location.
   *
   * This method is currently used only by Element Inspector DevTool.
   *
   * @param reactTag the tag of the root view to traverse
   * @param point an array containing both X and Y target location
   * @param callback will be called if with the identified child view react ID, and measurement
   *        info. If no view was found, callback will be invoked with no data.
   */
  @ReactMethod
  public void findSubviewIn(
      final int reactTag,
      final ReadableArray point,
      final Callback callback) {
    mUIImplementation.findSubviewIn(
      reactTag,
      Math.round(PixelUtil.toPixelFromDIP(point.getDouble(0))),
      Math.round(PixelUtil.toPixelFromDIP(point.getDouble(1))),
      callback);
  }

  /**
   * Registers a new Animation that can then be added to a View using {@link #addAnimation}.
   */
  public void registerAnimation(Animation animation) {
    mUIImplementation.registerAnimation(animation);
  }

  /**
   * Adds an Animation previously registered with {@link #registerAnimation} to a View and starts it
   */
  public void addAnimation(int reactTag, int animationID, Callback onSuccess) {
    mUIImplementation.addAnimation(reactTag, animationID, onSuccess);
  }

  /**
   * Removes an existing Animation, canceling it if it was in progress.
   */
  public void removeAnimation(int reactTag, int animationID) {
    mUIImplementation.removeAnimation(reactTag, animationID);
  }

  @ReactMethod
  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    mUIImplementation.setJSResponder(reactTag, blockNativeResponder);
  }

  @ReactMethod
  public void clearJSResponder() {
    mUIImplementation.clearJSResponder();
  }

  @ReactMethod
  public void dispatchViewManagerCommand(int reactTag, int commandId, ReadableArray commandArgs) {
    mUIImplementation.dispatchViewManagerCommand(reactTag, commandId, commandArgs);
  }

  /**
   * Show a PopupMenu.
   *
   * @param reactTag the tag of the anchor view (the PopupMenu is displayed next to this view); this
   *        needs to be the tag of a native view (shadow views can not be anchors)
   * @param items the menu items as an array of strings
   * @param error will be called if there is an error displaying the menu
   * @param success will be called with the position of the selected item as the first argument, or
   *        no arguments if the menu is dismissed
   */
  @ReactMethod
  public void showPopupMenu(int reactTag, ReadableArray items, Callback error, Callback success) {
    mUIImplementation.showPopupMenu(reactTag, items, error, success);
  }

  /**
   * LayoutAnimation API on Android is currently experimental. Therefore, it needs to be enabled
   * explicitly in order to avoid regression in existing application written for iOS using this API.
   *
   * Warning : This method will be removed in future version of React Native, and layout animation
   * will be enabled by default, so always check for its existence before invoking it.
   *
   * TODO(9139831) : remove this method once layout animation is fully stable.
   *
   * @param enabled whether layout animation is enabled or not
   */
  @ReactMethod
  public void setLayoutAnimationEnabledExperimental(boolean enabled) {
    mUIImplementation.setLayoutAnimationEnabledExperimental(enabled);
  }

  /**
   * Configure an animation to be used for the native layout changes, and native views
   * creation. The animation will only apply during the current batch operations.
   *
   * TODO(7728153) : animating view deletion is currently not supported.
   * TODO(7613721) : callbacks are not supported, this feature will likely be killed.
   *
   * @param config the configuration of the animation for view addition/removal/update.
   * @param success will be called when the animation completes, or when the animation get
   *        interrupted. In this case, callback parameter will be false.
   * @param error will be called if there was an error processing the animation
   */
  @ReactMethod
  public void configureNextLayoutAnimation(
      ReadableMap config,
      Callback success,
      Callback error) {
    mUIImplementation.configureNextLayoutAnimation(config, success, error);
  }

  /**
   * To implement the transactional requirement mentioned in the class javadoc, we only commit
   * UI changes to the actual view hierarchy once a batch of JS->Java calls have been completed.
   * We know this is safe because all JS->Java calls that are triggered by a Java->JS call (e.g.
   * the delivery of a touch event or execution of 'renderApplication') end up in a single
   * JS->Java transaction.
   *
   * A better way to do this would be to have JS explicitly signal to this module when a UI
   * transaction is done. Right now, though, this is how iOS does it, and we should probably
   * update the JS and native code and make this change at the same time.
   *
   * TODO(5279396): Make JS UI library explicitly notify the native UI module of the end of a UI
   *                transaction using a standard native call
   */
  @Override
  public void onBatchComplete() {
    int batchId = mBatchId;
    mBatchId++;

    SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "onBatchCompleteUI")
          .arg("BatchId", batchId)
          .flush();
    try {
      mUIImplementation.dispatchViewUpdates(batchId);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  public void setViewHierarchyUpdateDebugListener(
      @Nullable NotThreadSafeViewHierarchyUpdateDebugListener listener) {
    mUIImplementation.setViewHierarchyUpdateDebugListener(listener);
  }

  public EventDispatcher getEventDispatcher() {
    return mEventDispatcher;
  }

  @ReactMethod
  public void sendAccessibilityEvent(int tag, int eventType) {
    mUIImplementation.sendAccessibilityEvent(tag, eventType);
  }

  /**
   * Schedule a block to be executed on the UI thread. Useful if you need to execute
   * view logic after all currently queued view updates have completed.
   *
   * @param block that contains UI logic you want to execute.
   *
   * Usage Example:

   UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
   uiManager.addUIBlock(new UIBlock() {
     public void execute (NativeViewHierarchyManager nvhm) {
       View view = nvhm.resolveView(tag);
       // ...execute your code on View (e.g. snapshot the view)
     }
   });
     */
  public void addUIBlock (UIBlock block) {
    mUIImplementation.addUIBlock(block);
  }

  /**
   * Given a reactTag from a component, find its root node tag, if possible.
   * Otherwise, this will return 0. If the reactTag belongs to a root node, this
   * will return the same reactTag.
   *
   * @param reactTag the component tag
   *
   * @return the rootTag
   */
  public int resolveRootTagFromReactTag(int reactTag) {
    return mUIImplementation.resolveRootTagFromReactTag(reactTag);
  }

  /**
   * Listener that drops the CSSNode pool on low memory when the app is backgrounded.
   */
  private class MemoryTrimCallback implements ComponentCallbacks2 {

    @Override
    public void onTrimMemory(int level) {
      if (level >= TRIM_MEMORY_MODERATE) {
        YogaNodePool.get().clear();
      }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
    }

    @Override
    public void onLowMemory() {
    }
  }
}
