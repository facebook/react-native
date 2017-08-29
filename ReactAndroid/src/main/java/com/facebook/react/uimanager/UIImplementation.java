/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.uimanager;

import android.os.SystemClock;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.animation.Animation;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import com.facebook.yoga.YogaDirection;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * An class that is used to receive React commands from JS and translate them into a
 * shadow node hierarchy that is then mapped to a native view hierarchy.
 */
public class UIImplementation {

  private final ShadowNodeRegistry mShadowNodeRegistry = new ShadowNodeRegistry();
  private final ViewManagerRegistry mViewManagers;
  private final UIViewOperationQueue mOperationsQueue;
  private final NativeViewHierarchyOptimizer mNativeViewHierarchyOptimizer;
  private final int[] mMeasureBuffer = new int[4];
  private final ReactApplicationContext mReactContext;
  protected final EventDispatcher mEventDispatcher;

  private long mLastCalculateLayoutTime = 0;

  public UIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagers,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    this(
        reactContext,
        new ViewManagerRegistry(viewManagers),
        eventDispatcher,
        minTimeLeftInFrameForNonBatchedOperationMs);
  }

  private UIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagers,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    this(
        reactContext,
        viewManagers,
        new UIViewOperationQueue(
            reactContext,
            new NativeViewHierarchyManager(viewManagers),
            minTimeLeftInFrameForNonBatchedOperationMs),
        eventDispatcher);
  }

  protected UIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagers,
      UIViewOperationQueue operationsQueue,
      EventDispatcher eventDispatcher) {
    mReactContext = reactContext;
    mViewManagers = viewManagers;
    mOperationsQueue = operationsQueue;
    mNativeViewHierarchyOptimizer = new NativeViewHierarchyOptimizer(
        mOperationsQueue,
        mShadowNodeRegistry);
    mEventDispatcher = eventDispatcher;
  }

  protected ReactShadowNode createRootShadowNode() {
    ReactShadowNode rootCSSNode = new ReactShadowNode();
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    if (sharedI18nUtilInstance.isRTL(mReactContext)) {
      rootCSSNode.setLayoutDirection(YogaDirection.RTL);
    }
    rootCSSNode.setViewClassName("Root");
    return rootCSSNode;
  }

  protected ReactShadowNode createShadowNode(String className) {
    ViewManager viewManager = mViewManagers.get(className);
    return viewManager.createShadowNodeInstance(mReactContext);
  }

  protected final ReactShadowNode resolveShadowNode(int reactTag) {
    return mShadowNodeRegistry.getNode(reactTag);
  }

  protected final ViewManager resolveViewManager(String className) {
    return mViewManagers.get(className);
  }

  /*package*/ UIViewOperationQueue getUIViewOperationQueue() {
    return mOperationsQueue;
  }

  /**
   * Registers a root node with a given tag, size and ThemedReactContext
   * and adds it to a node registry.
   */
  public void registerRootView(
      SizeMonitoringFrameLayout rootView,
      int tag,
      int width,
      int height,
      ThemedReactContext context) {
    final ReactShadowNode rootCSSNode = createRootShadowNode();
    rootCSSNode.setReactTag(tag);
    rootCSSNode.setThemedContext(context);
    rootCSSNode.setStyleWidth(width);
    rootCSSNode.setStyleHeight(height);

    mShadowNodeRegistry.addRootNode(rootCSSNode);

    // register it within NativeViewHierarchyManager
    mOperationsQueue.addRootView(tag, rootView, context);
  }

  /**
   * Unregisters a root node with a given tag.
   */
  public void removeRootView(int rootViewTag) {
    removeRootShadowNode(rootViewTag);
    mOperationsQueue.enqueueRemoveRootView(rootViewTag);
  }

  /**
   * Unregisters a root node with a given tag from the shadow node registry
   */
  public void removeRootShadowNode(int rootViewTag) {
    mShadowNodeRegistry.removeRootNode(rootViewTag);
  }

  /**
   * Invoked when native view that corresponds to a root node, or acts as a root view (ie. Modals)
   * has its size changed.
   */
  public void updateNodeSize(
      int nodeViewTag,
      int newWidth,
      int newHeight) {
    ReactShadowNode cssNode = mShadowNodeRegistry.getNode(nodeViewTag);
    if (cssNode == null) {
      FLog.w(
        ReactConstants.TAG,
        "Tried to update size of non-existent tag: " + nodeViewTag);
      return;
    }
    cssNode.setStyleWidth(newWidth);
    cssNode.setStyleHeight(newHeight);

    // If we're in the middle of a batch, the change will automatically be dispatched at the end of
    // the batch. As all batches are executed as a single runnable on the event queue this should
    // always be empty, but that calling architecture is an implementation detail.
    if (mOperationsQueue.isEmpty()) {
      dispatchViewUpdates(-1); // -1 = no associated batch id
    }
  }

  public void profileNextBatch() {
    mOperationsQueue.profileNextBatch();
  }

  public Map<String, Long> getProfiledBatchPerfCounters() {
    return mOperationsQueue.getProfiledBatchPerfCounters();
  }

  /**
   * Invoked by React to create a new node with a given tag, class name and properties.
   */
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {
    ReactShadowNode cssNode = createShadowNode(className);
    ReactShadowNode rootNode = mShadowNodeRegistry.getNode(rootViewTag);
    cssNode.setReactTag(tag);
    cssNode.setViewClassName(className);
    cssNode.setRootNode(rootNode);
    cssNode.setThemedContext(rootNode.getThemedContext());

    mShadowNodeRegistry.addNode(cssNode);

    ReactStylesDiffMap styles = null;
    if (props != null) {
      styles = new ReactStylesDiffMap(props);
      cssNode.updateProperties(styles);
    }

    handleCreateView(cssNode, rootViewTag, styles);
  }

  protected void handleCreateView(
      ReactShadowNode cssNode,
      int rootViewTag,
      @Nullable ReactStylesDiffMap styles) {
    if (!cssNode.isVirtual()) {
      mNativeViewHierarchyOptimizer.handleCreateView(cssNode, cssNode.getThemedContext(), styles);
    }
  }

  /**
   * Invoked by React to create a new node with a given tag has its properties changed.
   */
  public void updateView(int tag, String className, ReadableMap props) {
    ViewManager viewManager = mViewManagers.get(className);
    if (viewManager == null) {
      throw new IllegalViewOperationException("Got unknown view type: " + className);
    }
    ReactShadowNode cssNode = mShadowNodeRegistry.getNode(tag);
    if (cssNode == null) {
      throw new IllegalViewOperationException("Trying to update non-existent view with tag " + tag);
    }

    if (props != null) {
      ReactStylesDiffMap styles = new ReactStylesDiffMap(props);
      cssNode.updateProperties(styles);
      handleUpdateView(cssNode, className, styles);
    }
  }

  /**
   * Used by native animated module to bypass the process of updating the values through the shadow
   * view hierarchy. This method will directly update native views, which means that updates for
   * layout-related propertied won't be handled properly.
   * Make sure you know what you're doing before calling this method :)
   */
  public void synchronouslyUpdateViewOnUIThread(int tag, ReactStylesDiffMap props) {
    UiThreadUtil.assertOnUiThread();
    mOperationsQueue.getNativeViewHierarchyManager().updateProperties(tag, props);
  }

  protected void handleUpdateView(
      ReactShadowNode cssNode,
      String className,
      ReactStylesDiffMap styles) {
    if (!cssNode.isVirtual()) {
      mNativeViewHierarchyOptimizer.handleUpdateView(cssNode, className, styles);
    }
  }

  /**
   * Invoked when there is a mutation in a node tree.
   *
   * @param tag react tag of the node we want to manage
   * @param indicesToRemove ordered (asc) list of indicies at which view should be removed
   * @param viewsToAdd ordered (asc based on mIndex property) list of tag-index pairs that represent
   * a view which should be added at the specified index
   * @param tagsToDelete list of tags corresponding to views that should be removed
   */
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {
    ReactShadowNode cssNodeToManage = mShadowNodeRegistry.getNode(viewTag);

    int numToMove = moveFrom == null ? 0 : moveFrom.size();
    int numToAdd = addChildTags == null ? 0 : addChildTags.size();
    int numToRemove = removeFrom == null ? 0 : removeFrom.size();

    if (numToMove != 0 && (moveTo == null || numToMove != moveTo.size())) {
      throw new IllegalViewOperationException("Size of moveFrom != size of moveTo!");
    }

    if (numToAdd != 0 && (addAtIndices == null || numToAdd != addAtIndices.size())) {
      throw new IllegalViewOperationException("Size of addChildTags != size of addAtIndices!");
    }

    // We treat moves as an add and a delete
    ViewAtIndex[] viewsToAdd = new ViewAtIndex[numToMove + numToAdd];
    int[] indicesToRemove = new int[numToMove + numToRemove];
    int[] tagsToRemove = new int[indicesToRemove.length];
    int[] tagsToDelete = new int[numToRemove];

    if (numToMove > 0) {
      Assertions.assertNotNull(moveFrom);
      Assertions.assertNotNull(moveTo);
      for (int i = 0; i < numToMove; i++) {
        int moveFromIndex = moveFrom.getInt(i);
        int tagToMove = cssNodeToManage.getChildAt(moveFromIndex).getReactTag();
        viewsToAdd[i] = new ViewAtIndex(
            tagToMove,
            moveTo.getInt(i));
        indicesToRemove[i] = moveFromIndex;
        tagsToRemove[i] = tagToMove;
      }
    }

    if (numToAdd > 0) {
      Assertions.assertNotNull(addChildTags);
      Assertions.assertNotNull(addAtIndices);
      for (int i = 0; i < numToAdd; i++) {
        int viewTagToAdd = addChildTags.getInt(i);
        int indexToAddAt = addAtIndices.getInt(i);
        viewsToAdd[numToMove + i] = new ViewAtIndex(viewTagToAdd, indexToAddAt);
      }
    }

    if (numToRemove > 0) {
      Assertions.assertNotNull(removeFrom);
      for (int i = 0; i < numToRemove; i++) {
        int indexToRemove = removeFrom.getInt(i);
        int tagToRemove = cssNodeToManage.getChildAt(indexToRemove).getReactTag();
        indicesToRemove[numToMove + i] = indexToRemove;
        tagsToRemove[numToMove + i] = tagToRemove;
        tagsToDelete[i] = tagToRemove;
      }
    }

    // NB: moveFrom and removeFrom are both relative to the starting state of the View's children.
    // moveTo and addAt are both relative to the final state of the View's children.
    //
    // 1) Sort the views to add and indices to remove by index
    // 2) Iterate the indices being removed from high to low and remove them. Going high to low
    //    makes sure we remove the correct index when there are multiple to remove.
    // 3) Iterate the views being added by index low to high and add them. Like the view removal,
    //    iteration direction is important to preserve the correct index.

    Arrays.sort(viewsToAdd, ViewAtIndex.COMPARATOR);
    Arrays.sort(indicesToRemove);

    // Apply changes to CSSNodeDEPRECATED hierarchy
    int lastIndexRemoved = -1;
    for (int i = indicesToRemove.length - 1; i >= 0; i--) {
      int indexToRemove = indicesToRemove[i];
      if (indexToRemove == lastIndexRemoved) {
        throw new IllegalViewOperationException("Repeated indices in Removal list for view tag: "
            + viewTag);
      }
      cssNodeToManage.removeChildAt(indicesToRemove[i]);
      lastIndexRemoved = indicesToRemove[i];
    }

    for (int i = 0; i < viewsToAdd.length; i++) {
      ViewAtIndex viewAtIndex = viewsToAdd[i];
      ReactShadowNode cssNodeToAdd = mShadowNodeRegistry.getNode(viewAtIndex.mTag);
      if (cssNodeToAdd == null) {
        throw new IllegalViewOperationException("Trying to add unknown view tag: "
            + viewAtIndex.mTag);
      }
      cssNodeToManage.addChildAt(cssNodeToAdd, viewAtIndex.mIndex);
    }

    if (!cssNodeToManage.isVirtual() && !cssNodeToManage.isVirtualAnchor()) {
      mNativeViewHierarchyOptimizer.handleManageChildren(
          cssNodeToManage,
          indicesToRemove,
          tagsToRemove,
          viewsToAdd,
          tagsToDelete);
    }

    for (int i = 0; i < tagsToDelete.length; i++) {
      removeShadowNode(mShadowNodeRegistry.getNode(tagsToDelete[i]));
    }
  }

  /**
   * An optimized version of manageChildren that is used for initial setting of child views.
   * The children are assumed to be in index order
   *
   * @param viewTag tag of the parent
   * @param childrenTags tags of the children
   */
  public void setChildren(
    int viewTag,
    ReadableArray childrenTags) {

    ReactShadowNode cssNodeToManage = mShadowNodeRegistry.getNode(viewTag);

    for (int i = 0; i < childrenTags.size(); i++) {
      ReactShadowNode cssNodeToAdd = mShadowNodeRegistry.getNode(childrenTags.getInt(i));
      if (cssNodeToAdd == null) {
        throw new IllegalViewOperationException("Trying to add unknown view tag: "
          + childrenTags.getInt(i));
      }
      cssNodeToManage.addChildAt(cssNodeToAdd, i);
    }

    if (!cssNodeToManage.isVirtual() && !cssNodeToManage.isVirtualAnchor()) {
      mNativeViewHierarchyOptimizer.handleSetChildren(
        cssNodeToManage,
        childrenTags);
    }
  }

  /**
   * Replaces the View specified by oldTag with the View specified by newTag within oldTag's parent.
   */
  public void replaceExistingNonRootView(int oldTag, int newTag) {
    if (mShadowNodeRegistry.isRootNode(oldTag) || mShadowNodeRegistry.isRootNode(newTag)) {
      throw new IllegalViewOperationException("Trying to add or replace a root tag!");
    }

    ReactShadowNode oldNode = mShadowNodeRegistry.getNode(oldTag);
    if (oldNode == null) {
      throw new IllegalViewOperationException("Trying to replace unknown view tag: " + oldTag);
    }

    ReactShadowNode parent = oldNode.getParent();
    if (parent == null) {
      throw new IllegalViewOperationException("Node is not attached to a parent: " + oldTag);
    }

    int oldIndex = parent.indexOf(oldNode);
    if (oldIndex < 0) {
      throw new IllegalStateException("Didn't find child tag in parent");
    }

    WritableArray tagsToAdd = Arguments.createArray();
    tagsToAdd.pushInt(newTag);

    WritableArray addAtIndices = Arguments.createArray();
    addAtIndices.pushInt(oldIndex);

    WritableArray indicesToRemove = Arguments.createArray();
    indicesToRemove.pushInt(oldIndex);

    manageChildren(parent.getReactTag(), null, null, tagsToAdd, addAtIndices, indicesToRemove);
  }

  /**
   * Method which takes a container tag and then releases all subviews for that container upon
   * receipt.
   * TODO: The method name is incorrect and will be renamed, #6033872
   * @param containerTag the tag of the container for which the subviews must be removed
   */
  public void removeSubviewsFromContainerWithID(int containerTag) {
    ReactShadowNode containerNode = mShadowNodeRegistry.getNode(containerTag);
    if (containerNode == null) {
      throw new IllegalViewOperationException(
          "Trying to remove subviews of an unknown view tag: " + containerTag);
    }

    WritableArray indicesToRemove = Arguments.createArray();
    for (int childIndex = 0; childIndex < containerNode.getChildCount(); childIndex++) {
      indicesToRemove.pushInt(childIndex);
    }

    manageChildren(containerTag, null, null, null, null, indicesToRemove);
  }

  /**
   * Find the touch target child native view in  the supplied root view hierarchy, given a react
   * target location.
   *
   * This method is currently used only by Element Inspector DevTool.
   *
   * @param reactTag the tag of the root view to traverse
   * @param targetX target X location
   * @param targetY target Y location
   * @param callback will be called if with the identified child view react ID, and measurement
   *        info. If no view was found, callback will be invoked with no data.
   */
  public void findSubviewIn(int reactTag, float targetX, float targetY, Callback callback) {
    mOperationsQueue.enqueueFindTargetForTouch(reactTag, targetX, targetY, callback);
  }

  /**
   *  Check if the first shadow node is the descendant of the second shadow node
   */
  public void viewIsDescendantOf(
      final int reactTag,
      final int ancestorReactTag,
      final Callback callback) {
    ReactShadowNode node = mShadowNodeRegistry.getNode(reactTag);
    ReactShadowNode ancestorNode = mShadowNodeRegistry.getNode(ancestorReactTag);
    if (node == null || ancestorNode == null) {
      callback.invoke(false);
      return;
    }
    callback.invoke(node.isDescendantOf(ancestorNode));
  }

  /**
   * Determines the location on screen, width, and height of the given view relative to the root
   * view and returns the values via an async callback.
   */
  public void measure(int reactTag, Callback callback) {
    // This method is called by the implementation of JS touchable interface (see Touchable.js for
    // more details) at the moment of touch activation. That is after user starts the gesture from
    // a touchable view with a given reactTag, or when user drag finger back into the press
    // activation area of a touchable view that have been activated before.
    mOperationsQueue.enqueueMeasure(reactTag, callback);
  }

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback.  This is the absolute position including
   * things like the status bar
   */
  public void measureInWindow(int reactTag, Callback callback) {
    mOperationsQueue.enqueueMeasureInWindow(reactTag, callback);
  }

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case
   * the position always will be (0, 0) and method will only measure the view dimensions.
   */
  public void measureLayout(
      int tag,
      int ancestorTag,
      Callback errorCallback,
      Callback successCallback) {
    try {
      measureLayout(tag, ancestorTag, mMeasureBuffer);
      float relativeX = PixelUtil.toDIPFromPixel(mMeasureBuffer[0]);
      float relativeY = PixelUtil.toDIPFromPixel(mMeasureBuffer[1]);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      successCallback.invoke(relativeX, relativeY, width, height);
    } catch (IllegalViewOperationException e) {
      errorCallback.invoke(e.getMessage());
    }
  }

  /**
   * Like {@link #measure} and {@link #measureLayout} but measures relative to the immediate parent.
   */
  public void measureLayoutRelativeToParent(
      int tag,
      Callback errorCallback,
      Callback successCallback) {
    try {
      measureLayoutRelativeToParent(tag, mMeasureBuffer);
      float relativeX = PixelUtil.toDIPFromPixel(mMeasureBuffer[0]);
      float relativeY = PixelUtil.toDIPFromPixel(mMeasureBuffer[1]);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      successCallback.invoke(relativeX, relativeY, width, height);
    } catch (IllegalViewOperationException e) {
      errorCallback.invoke(e.getMessage());
    }
  }

  /**
   * Invoked at the end of the transaction to commit any updates to the node hierarchy.
   */
  public void dispatchViewUpdates(int batchId) {
    SystraceMessage.beginSection(
      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
      "UIImplementation.dispatchViewUpdates")
      .arg("batchId", batchId)
      .flush();
    final long commitStartTime = SystemClock.uptimeMillis();
    try {
      updateViewHierarchy();
      mNativeViewHierarchyOptimizer.onBatchComplete();
      mOperationsQueue.dispatchViewUpdates(batchId, commitStartTime, mLastCalculateLayoutTime);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  protected void updateViewHierarchy() {
    Systrace.beginSection(
      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
      "UIImplementation.updateViewHierarchy");
    try {
      for (int i = 0; i < mShadowNodeRegistry.getRootNodeCount(); i++) {
        int tag = mShadowNodeRegistry.getRootTag(i);
        ReactShadowNode cssRoot = mShadowNodeRegistry.getNode(tag);
        SystraceMessage.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "UIImplementation.notifyOnBeforeLayoutRecursive")
          .arg("rootTag", cssRoot.getReactTag())
          .flush();
        try {
          notifyOnBeforeLayoutRecursive(cssRoot);
        } finally {
          Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        }

        calculateRootLayout(cssRoot);
        SystraceMessage.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "UIImplementation.applyUpdatesRecursive")
          .arg("rootTag", cssRoot.getReactTag())
          .flush();
        try {
          applyUpdatesRecursive(cssRoot, 0f, 0f);
        } finally {
          Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        }
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /**
   * Registers a new Animation that can then be added to a View using {@link #addAnimation}.
   */
  public void registerAnimation(Animation animation) {
    mOperationsQueue.enqueueRegisterAnimation(animation);
  }

  /**
   * Adds an Animation previously registered with {@link #registerAnimation} to a View and starts it
   */
  public void addAnimation(int reactTag, int animationID, Callback onSuccess) {
    assertViewExists(reactTag, "addAnimation");
    mOperationsQueue.enqueueAddAnimation(reactTag, animationID, onSuccess);
  }

  /**
   * Removes an existing Animation, canceling it if it was in progress.
   */
  public void removeAnimation(int reactTag, int animationID) {
    assertViewExists(reactTag, "removeAnimation");
    mOperationsQueue.enqueueRemoveAnimation(animationID);
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
  public void setLayoutAnimationEnabledExperimental(boolean enabled) {
    mOperationsQueue.enqueueSetLayoutAnimationEnabled(enabled);
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
  public void configureNextLayoutAnimation(
      ReadableMap config,
      Callback success,
      Callback error) {
    mOperationsQueue.enqueueConfigureLayoutAnimation(config, success, error);
  }

  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    assertViewExists(reactTag, "setJSResponder");
    ReactShadowNode node = mShadowNodeRegistry.getNode(reactTag);
    while (node.isVirtual() || node.isLayoutOnly()) {
      node = node.getParent();
    }
    mOperationsQueue.enqueueSetJSResponder(node.getReactTag(), reactTag, blockNativeResponder);
  }

  public void clearJSResponder() {
    mOperationsQueue.enqueueClearJSResponder();
  }

  public void dispatchViewManagerCommand(int reactTag, int commandId, ReadableArray commandArgs) {
    assertViewExists(reactTag, "dispatchViewManagerCommand");
    mOperationsQueue.enqueueDispatchCommand(reactTag, commandId, commandArgs);
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
  public void showPopupMenu(int reactTag, ReadableArray items, Callback error, Callback success) {
    assertViewExists(reactTag, "showPopupMenu");
    mOperationsQueue.enqueueShowPopupMenu(reactTag, items, error, success);
  }

  public void sendAccessibilityEvent(int tag, int eventType) {
    mOperationsQueue.enqueueSendAccessibilityEvent(tag, eventType);
  }

  public void onHostResume() {
    mOperationsQueue.resumeFrameCallback();
  }

  public void onHostPause() {
    mOperationsQueue.pauseFrameCallback();
  }

  public void onHostDestroy() {
  }

  public void setViewHierarchyUpdateDebugListener(
      @Nullable NotThreadSafeViewHierarchyUpdateDebugListener listener) {
    mOperationsQueue.setViewHierarchyUpdateDebugListener(listener);
  }

  protected final void removeShadowNode(ReactShadowNode nodeToRemove) {
    removeShadowNodeRecursive(nodeToRemove);
    nodeToRemove.dispose();
  }

  private void removeShadowNodeRecursive(ReactShadowNode nodeToRemove) {
    NativeViewHierarchyOptimizer.handleRemoveNode(nodeToRemove);
    mShadowNodeRegistry.removeNode(nodeToRemove.getReactTag());
    for (int i = nodeToRemove.getChildCount() - 1; i >= 0; i--) {
      removeShadowNodeRecursive(nodeToRemove.getChildAt(i));
    }
    nodeToRemove.removeAndDisposeAllChildren();
  }

  private void measureLayout(int tag, int ancestorTag, int[] outputBuffer) {
    ReactShadowNode node = mShadowNodeRegistry.getNode(tag);
    ReactShadowNode ancestor = mShadowNodeRegistry.getNode(ancestorTag);
    if (node == null || ancestor == null) {
      throw new IllegalViewOperationException(
          "Tag " + (node == null ? tag : ancestorTag) + " does not exist");
    }

    if (node != ancestor) {
      ReactShadowNode currentParent = node.getParent();
      while (currentParent != ancestor) {
        if (currentParent == null) {
          throw new IllegalViewOperationException(
              "Tag " + ancestorTag + " is not an ancestor of tag " + tag);
        }
        currentParent = currentParent.getParent();
      }
    }

    measureLayoutRelativeToVerifiedAncestor(node, ancestor, outputBuffer);
  }

  private void measureLayoutRelativeToParent(int tag, int[] outputBuffer) {
    ReactShadowNode node = mShadowNodeRegistry.getNode(tag);
    if (node == null) {
      throw new IllegalViewOperationException("No native view for tag " + tag + " exists!");
    }
    ReactShadowNode parent = node.getParent();
    if (parent == null) {
      throw new IllegalViewOperationException("View with tag " + tag + " doesn't have a parent!");
    }

    measureLayoutRelativeToVerifiedAncestor(node, parent, outputBuffer);
  }

  private void measureLayoutRelativeToVerifiedAncestor(
      ReactShadowNode node,
      ReactShadowNode ancestor,
      int[] outputBuffer) {
    int offsetX = 0;
    int offsetY = 0;
    if (node != ancestor) {
      offsetX = Math.round(node.getLayoutX());
      offsetY = Math.round(node.getLayoutY());
      ReactShadowNode current = node.getParent();
      while (current != ancestor) {
        Assertions.assertNotNull(current);
        assertNodeDoesNotNeedCustomLayoutForChildren(current);
        offsetX += Math.round(current.getLayoutX());
        offsetY += Math.round(current.getLayoutY());
        current = current.getParent();
      }
      assertNodeDoesNotNeedCustomLayoutForChildren(ancestor);
    }

    outputBuffer[0] = offsetX;
    outputBuffer[1] = offsetY;
    outputBuffer[2] = node.getScreenWidth();
    outputBuffer[3] = node.getScreenHeight();
  }

  private void assertViewExists(int reactTag, String operationNameForExceptionMessage) {
    if (mShadowNodeRegistry.getNode(reactTag) == null) {
      throw new IllegalViewOperationException(
          "Unable to execute operation " + operationNameForExceptionMessage + " on view with " +
              "tag: " + reactTag + ", since the view does not exists");
    }
  }

  private void assertNodeDoesNotNeedCustomLayoutForChildren(ReactShadowNode node) {
    ViewManager viewManager = Assertions.assertNotNull(mViewManagers.get(node.getViewClass()));
    ViewGroupManager viewGroupManager;
    if (viewManager instanceof ViewGroupManager) {
      viewGroupManager = (ViewGroupManager) viewManager;
    } else {
      throw new IllegalViewOperationException("Trying to use view " + node.getViewClass() +
          " as a parent, but its Manager doesn't extends ViewGroupManager");
    }
    if (viewGroupManager != null && viewGroupManager.needsCustomLayoutForChildren()) {
      throw new IllegalViewOperationException(
          "Trying to measure a view using measureLayout/measureLayoutRelativeToParent relative to" +
              " an ancestor that requires custom layout for it's children (" + node.getViewClass() +
              "). Use measure instead.");
    }
  }

  private void notifyOnBeforeLayoutRecursive(ReactShadowNode cssNode) {
    if (!cssNode.hasUpdates()) {
      return;
    }
    for (int i = 0; i < cssNode.getChildCount(); i++) {
      notifyOnBeforeLayoutRecursive(cssNode.getChildAt(i));
    }
    cssNode.onBeforeLayout();
  }

  protected void calculateRootLayout(ReactShadowNode cssRoot) {
    SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "cssRoot.calculateLayout")
        .arg("rootTag", cssRoot.getReactTag())
        .flush();
    long startTime = SystemClock.uptimeMillis();
    try {
      cssRoot.calculateLayout();
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      mLastCalculateLayoutTime = SystemClock.uptimeMillis() - startTime;
    }
  }

  protected void applyUpdatesRecursive(
      ReactShadowNode cssNode,
      float absoluteX,
      float absoluteY) {
    if (!cssNode.hasUpdates()) {
      return;
    }

    if (!cssNode.isVirtualAnchor()) {
      for (int i = 0; i < cssNode.getChildCount(); i++) {
        applyUpdatesRecursive(
            cssNode.getChildAt(i),
            absoluteX + cssNode.getLayoutX(),
            absoluteY + cssNode.getLayoutY());
      }
    }

    int tag = cssNode.getReactTag();
    if (!mShadowNodeRegistry.isRootNode(tag)) {
      boolean frameDidChange = cssNode.dispatchUpdates(
          absoluteX,
          absoluteY,
          mOperationsQueue,
          mNativeViewHierarchyOptimizer);

      // Notify JS about layout event if requested
      // and if the position or dimensions actually changed
      // (consistent with iOS).
      if (frameDidChange && cssNode.shouldNotifyOnLayout()) {
        mEventDispatcher.dispatchEvent(
            OnLayoutEvent.obtain(
                tag,
                cssNode.getScreenX(),
                cssNode.getScreenY(),
                cssNode.getScreenWidth(),
                cssNode.getScreenHeight()));
      }
    }
    cssNode.markUpdateSeen();
  }

  public void addUIBlock(UIBlock block) {
    mOperationsQueue.enqueueUIBlock(block);
  }

  public int resolveRootTagFromReactTag(int reactTag) {
    if (mShadowNodeRegistry.isRootNode(reactTag)) {
      return reactTag;
    }

    ReactShadowNode node = resolveShadowNode(reactTag);
    int rootTag = 0;
    if (node != null) {
      rootTag = node.getRootNode().getReactTag();
    } else {
      FLog.w(
        ReactConstants.TAG,
        "Warning : attempted to resolve a non-existent react shadow node. reactTag=" + reactTag);
    }

    return rootTag;
  }
}
