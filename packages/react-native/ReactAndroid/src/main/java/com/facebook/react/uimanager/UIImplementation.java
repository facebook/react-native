/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.HashMap;
import java.util.Map;

/**
 * A class that is used to receive React commands from JS and translate them into a shadow node
 * hierarchy that is then mapped to a native view hierarchy.
 *
 * @deprecated This class is a stub retained for backward compatibility. It is part of the Legacy
 *     Architecture and will be removed in a future release.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    since = "This class is part of Legacy Architecture and will be removed in a future release")
public class UIImplementation {
  static {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "UIImplementation", LegacyArchitectureLogLevel.ERROR);
  }

  /** Interface definition for a callback to be invoked when the layout has been updated */
  public interface LayoutUpdateListener {

    /** Called when the layout has been updated */
    void onLayoutUpdated(ReactShadowNode root);
  }

  UIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagers,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {}

  protected UIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagers,
      UIViewOperationQueue operationsQueue,
      EventDispatcher eventDispatcher) {}

  /**
   * @deprecated This method is a stub and always returns null.
   */
  protected ReactShadowNode createRootShadowNode() {
    return null;
  }

  /**
   * @deprecated This method is a stub and always returns null.
   */
  protected ReactShadowNode createShadowNode(String className) {
    return null;
  }

  /**
   * @deprecated This method is a stub and always returns null.
   */
  public final ReactShadowNode resolveShadowNode(int reactTag) {
    return null;
  }

  /**
   * @deprecated This method is a stub and always returns null.
   */
  protected final @Nullable ViewManager resolveViewManager(String className) {
    return null;
  }

  /*package*/ UIViewOperationQueue getUIViewOperationQueue() {
    return null;
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(int tag, int widthMeasureSpec, int heightMeasureSpec) {}

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(
      ReactShadowNode rootCSSNode, int widthMeasureSpec, int heightMeasureSpec) {}

  /**
   * Registers a root node with a given tag, size and ThemedReactContext and adds it to a node
   * registry.
   */
  public <T extends View> void registerRootView(T rootView, int tag, ThemedReactContext context) {}

  /** Unregisters a root node with a given tag. */
  public void removeRootView(int rootViewTag) {}

  /**
   * Return root view num
   *
   * @return The num of root view
   */
  public int getRootViewNum() {
    return 0;
  }

  /** Unregisters a root node with a given tag from the shadow node registry */
  public void removeRootShadowNode(int rootViewTag) {}

  /**
   * Invoked when native view that corresponds to a root node, or acts as a root view (ie. Modals)
   * has its size changed.
   */
  public void updateNodeSize(int nodeViewTag, int newWidth, int newHeight) {}

  /** Updates the insets padding for a given view. */
  public void updateInsetsPadding(int nodeViewTag, int top, int left, int bottom, int right) {}

  /** Sets local data for a shadow node. */
  public void setViewLocalData(int tag, Object data) {}

  /** Profiles the next batch of operations. */
  public void profileNextBatch() {}

  /**
   * Returns profiled batch performance counters.
   *
   * @return an empty map (stub)
   */
  public Map<String, Long> getProfiledBatchPerfCounters() {
    return new HashMap<>();
  }

  /** Invoked by React to create a new node with a given tag, class name and properties. */
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {}

  /** Handles the creation of a view from a shadow node. */
  protected void handleCreateView(
      ReactShadowNode cssNode, int rootViewTag, @Nullable ReactStylesDiffMap styles) {}

  /** Invoked by React to create a new node with a given tag has its properties changed. */
  public void updateView(int tag, String className, ReadableMap props) {}

  /**
   * Used by native animated module to bypass the process of updating the values through the shadow
   * view hierarchy. This method will directly update native views, which means that updates for
   * layout-related propertied won't be handled properly. Make sure you know what you're doing
   * before calling this method :)
   */
  public void synchronouslyUpdateViewOnUIThread(int tag, ReactStylesDiffMap props) {}

  /** Handles the update of a view from a shadow node. */
  protected void handleUpdateView(
      ReactShadowNode cssNode, String className, ReactStylesDiffMap styles) {}

  /**
   * Invoked when there is a mutation in a node tree.
   *
   * @param viewTag react tag of the node we want to manage
   * @param moveFrom ordered list of move-from indices
   * @param moveTo ordered list of move-to indices
   * @param addChildTags tags of views to add
   * @param addAtIndices indices at which to add the views
   * @param removeFrom indices from which to remove views
   */
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {}

  /**
   * An optimized version of manageChildren that is used for initial setting of child views. The
   * children are assumed to be in index order
   *
   * @param viewTag tag of the parent
   * @param childrenTags tags of the children
   */
  public void setChildren(int viewTag, ReadableArray childrenTags) {}

  /**
   * Replaces the View specified by oldTag with the View specified by newTag within oldTag's parent.
   */
  public void replaceExistingNonRootView(int oldTag, int newTag) {}

  /**
   * Find the touch target child native view in the supplied root view hierarchy, given a react
   * target location.
   *
   * <p>This method is currently used only by Element Inspector DevTool.
   *
   * @param reactTag the tag of the root view to traverse
   * @param targetX target X location
   * @param targetY target Y location
   * @param callback will be called if with the identified child view react ID, and measurement
   *     info. If no view was found, callback will be invoked with no data.
   */
  public void findSubviewIn(int reactTag, float targetX, float targetY, Callback callback) {}

  /**
   * Check if the first shadow node is the descendant of the second shadow node
   *
   * @deprecated This method will not be implemented in Fabric.
   */
  @Deprecated
  public void viewIsDescendantOf(
      final int reactTag, final int ancestorReactTag, final Callback callback) {}

  /**
   * Determines the location on screen, width, and height of the given view relative to the root
   * view and returns the values via an async callback.
   */
  public void measure(int reactTag, Callback callback) {}

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback. This is the absolute position including
   * things like the status bar
   */
  public void measureInWindow(int reactTag, Callback callback) {}

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case the
   * position always will be (0, 0) and method will only measure the view dimensions.
   */
  public void measureLayout(
      int tag, int ancestorTag, Callback errorCallback, Callback successCallback) {}

  /**
   * Like {@link #measure} and {@link #measureLayout} but measures relative to the immediate parent.
   */
  public void measureLayoutRelativeToParent(
      int tag, Callback errorCallback, Callback successCallback) {}

  /** Invoked at the end of the transaction to commit any updates to the node hierarchy. */
  public void dispatchViewUpdates(int batchId) {}

  /** Updates the view hierarchy. */
  protected void updateViewHierarchy() {}

  /**
   * LayoutAnimation API on Android is currently experimental. Therefore, it needs to be enabled
   * explicitly in order to avoid regression in existing application written for iOS using this API.
   *
   * <p>Warning : This method will be removed in future version of React Native, and layout
   * animation will be enabled by default, so always check for its existence before invoking it.
   *
   * <p>TODO(9139831) : remove this method once layout animation is fully stable.
   *
   * @param enabled whether layout animation is enabled or not
   */
  public void setLayoutAnimationEnabledExperimental(boolean enabled) {}

  /**
   * Configure an animation to be used for the native layout changes, and native views creation. The
   * animation will only apply during the current batch operations.
   *
   * <p>TODO(7728153) : animating view deletion is currently not supported. TODO(7613721) :
   * callbacks are not supported, this feature will likely be killed.
   *
   * @param config the configuration of the animation for view addition/removal/update.
   * @param success will be called when the animation completes, or when the animation get
   *     interrupted. In this case, callback parameter will be false.
   */
  public void configureNextLayoutAnimation(ReadableMap config, Callback success) {}

  /** Sets the JS responder for a given react tag. */
  public void setJSResponder(int reactTag, boolean blockNativeResponder) {}

  /** Clears the JS responder. */
  public void clearJSResponder() {}

  /**
   * @deprecated Use {@link #dispatchViewManagerCommand(int, String, ReadableArray)} instead.
   */
  @Deprecated
  public void dispatchViewManagerCommand(
      int reactTag, int commandId, @Nullable ReadableArray commandArgs) {}

  /** Dispatches a view manager command. */
  public void dispatchViewManagerCommand(
      int reactTag, String commandId, @Nullable ReadableArray commandArgs) {}

  /** Sends an accessibility event for a given tag. */
  public void sendAccessibilityEvent(int tag, int eventType) {}

  /** Called when the host activity resumes. */
  public void onHostResume() {}

  /** Called when the host activity pauses. */
  public void onHostPause() {}

  /** Called when the host activity is destroyed. */
  public void onHostDestroy() {}

  /** Called when the Catalyst instance is destroyed. */
  public void onCatalystInstanceDestroyed() {}

  /** Removes a shadow node and all its descendants. */
  protected final void removeShadowNode(ReactShadowNode nodeToRemove) {}

  protected void calculateRootLayout(ReactShadowNode cssRoot) {}

  /** Adds a UI block to be executed on the UI thread. */
  public void addUIBlock(UIBlock block) {}

  /** Prepends a UI block to be executed on the UI thread. */
  public void prependUIBlock(UIBlock block) {}

  /**
   * Resolves the root tag from a given react tag.
   *
   * @return 0 (stub)
   */
  public int resolveRootTagFromReactTag(int reactTag) {
    return 0;
  }

  /** Sets a listener for layout updates. */
  public void setLayoutUpdateListener(LayoutUpdateListener listener) {}

  /** Removes the layout update listener. */
  public void removeLayoutUpdateListener() {}
}
