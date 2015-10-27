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

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import android.util.DisplayMetrics;

import com.facebook.csslayout.CSSLayoutContext;
import com.facebook.react.animation.Animation;
import com.facebook.react.animation.AnimationRegistry;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.debug.NotThreadSafeUiManagerDebugListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

/**
 * <p>Native module to allow JS to create and update native Views.</p>
 *
 * <p>
 * <h2>== Transactional Requirement ==</h2>
 * A requirement of this class is to make sure that transactional UI updates occur all at, meaning
 * that no intermediate state is ever rendered to the screen. For example, if a JS application
 * update changes the background of View A to blue and the width of View B to 100, both need to
 * appear at once. Practically, this means that all UI update code related to a single transaction
 * must be executed as a single code block on the UI thread. Executing as multiple code blocks
 * could allow the platform UI system to interrupt and render a partial UI state.
 * </p>
 *
 * <p>To facilitate this, this module enqueues operations that are then applied to native view
 * hierarchy through {@link NativeViewHierarchyManager} at the end of each transaction.
 *
 * <p>
 * <h2>== CSSNodes ==</h2>
 * In order to allow layout and measurement to occur on a non-UI thread, this module also
 * operates on intermediate CSSNode objects that correspond to a native view. These CSSNode are able
 * to calculate layout according to their styling rules, and then the resulting x/y/width/height of
 * that layout is scheduled as an operation that will be applied to native view hierarchy at the end
 * of current batch.
 * </p>
 *
 * TODO(5241856): Investigate memory usage of creating many small objects in UIManageModule and
 *                consider implementing a pool
 * TODO(5483063): Don't dispatch the view hierarchy at the end of a batch if no UI changes occurred
 */
public class UIManagerModule extends ReactContextBaseJavaModule implements
    OnBatchCompleteListener, LifecycleEventListener {

  // Keep in sync with ReactIOSTagHandles JS module - see that file for an explanation on why the
  // increment here is 10
  private static final int ROOT_VIEW_TAG_INCREMENT = 10;

  private final NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final EventDispatcher mEventDispatcher;
  private final AnimationRegistry mAnimationRegistry = new AnimationRegistry();
  private final ShadowNodeRegistry mShadowNodeRegistry = new ShadowNodeRegistry();
  private final ViewManagerRegistry mViewManagers;
  private final CSSLayoutContext mLayoutContext = new CSSLayoutContext();
  private final Map<String, Object> mModuleConstants;
  private final UIViewOperationQueue mOperationsQueue;
  private final NativeViewHierarchyOptimizer mNativeViewHierarchyOptimizer;
  private final int[] mMeasureBuffer = new int[4];

  private @Nullable NotThreadSafeUiManagerDebugListener mUiManagerDebugListener;
  private int mNextRootViewTag = 1;
  private int mBatchId = 0;

  public UIManagerModule(ReactApplicationContext reactContext, List<ViewManager> viewManagerList) {
    super(reactContext);
    mViewManagers = new ViewManagerRegistry(viewManagerList);
    mEventDispatcher = new EventDispatcher(reactContext);
    mNativeViewHierarchyManager = new NativeViewHierarchyManager(
        mAnimationRegistry,
        mViewManagers);
    mOperationsQueue = new UIViewOperationQueue(
        reactContext,
        this,
        mNativeViewHierarchyManager,
        mAnimationRegistry);
    mNativeViewHierarchyOptimizer = new NativeViewHierarchyOptimizer(
        mOperationsQueue,
        mShadowNodeRegistry);
    DisplayMetrics displayMetrics = reactContext.getResources().getDisplayMetrics();
    DisplayMetricsHolder.setDisplayMetrics(displayMetrics);

    mModuleConstants = UIManagerModuleConstantsHelper.createConstants(
        displayMetrics,
        viewManagerList);
    reactContext.addLifecycleEventListener(this);
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
  public void onHostResume() {
    mOperationsQueue.resumeFrameCallback();
  }

  @Override
  public void onHostPause() {
    mOperationsQueue.pauseFrameCallback();
  }

  @Override
  public void onHostDestroy() {
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    mEventDispatcher.onCatalystInstanceDestroyed();
  }

  /**
   * Registers a new root view. JS can use the returned tag with manageChildren to add/remove
   * children to this view.
   *
   * Note that this must be called after getWidth()/getHeight() actually return something. See
   * CatalystApplicationFragment as an example.
   *
   * TODO(6242243): Make addMeasuredRootView thread safe
   * NB: this method is horribly not-thread-safe, the only reason it works right now is because
   * it's called exactly once and is called before any JS calls are made. As soon as that fact no
   * longer holds, this method will need to be fixed.
   */
  public int addMeasuredRootView(final SizeMonitoringFrameLayout rootView) {
    final int tag = mNextRootViewTag;
    mNextRootViewTag += ROOT_VIEW_TAG_INCREMENT;

    final ReactShadowNode rootCSSNode = new ReactShadowNode();
    rootCSSNode.setReactTag(tag);
    final ThemedReactContext themedRootContext =
        new ThemedReactContext(getReactApplicationContext(), rootView.getContext());
    rootCSSNode.setThemedContext(themedRootContext);
    // If LayoutParams sets size explicitly, we can use that. Otherwise get the size from the view.
    if (rootView.getLayoutParams() != null &&
        rootView.getLayoutParams().width > 0 &&
        rootView.getLayoutParams().height > 0) {
      rootCSSNode.setStyleWidth(rootView.getLayoutParams().width);
      rootCSSNode.setStyleHeight(rootView.getLayoutParams().height);
    } else {
      rootCSSNode.setStyleWidth(rootView.getWidth());
      rootCSSNode.setStyleHeight(rootView.getHeight());
    }
    rootCSSNode.setViewClassName("Root");

    rootView.setOnSizeChangedListener(
        new SizeMonitoringFrameLayout.OnSizeChangedListener() {
          @Override
          public void onSizeChanged(final int width, final int height, int oldW, int oldH) {
            getReactApplicationContext().runOnNativeModulesQueueThread(
                new Runnable() {
                  @Override
                  public void run() {
                    updateRootNodeSize(rootCSSNode, width, height);
                  }
                });
          }
        });

    mShadowNodeRegistry.addRootNode(rootCSSNode);

    if (UiThreadUtil.isOnUiThread()) {
      mNativeViewHierarchyManager.addRootView(tag, rootView, themedRootContext);
    } else {
      final Semaphore semaphore = new Semaphore(0);
      getReactApplicationContext().runOnUiQueueThread(
          new Runnable() {
            @Override
            public void run() {
              mNativeViewHierarchyManager.addRootView(tag, rootView, themedRootContext);
              semaphore.release();
            }
          });
      try {
        SoftAssertions.assertCondition(
            semaphore.tryAcquire(5000, TimeUnit.MILLISECONDS),
            "Timed out adding root view");
      } catch (InterruptedException e) {
        throw new RuntimeException(e);
      }
    }

    return tag;
  }

  @ReactMethod
  public void removeRootView(int rootViewTag) {
    mShadowNodeRegistry.removeRootNode(rootViewTag);
    mOperationsQueue.enqueueRemoveRootView(rootViewTag);
  }

  private void updateRootNodeSize(ReactShadowNode rootCSSNode, int newWidth, int newHeight) {
    getReactApplicationContext().assertOnNativeModulesQueueThread();

    rootCSSNode.setStyleWidth(newWidth);
    rootCSSNode.setStyleHeight(newHeight);

    // If we're in the middle of a batch, the change will automatically be dispatched at the end of
    // the batch. As all batches are executed as a single runnable on the event queue this should
    // always be empty, but that calling architecture is an implementation detail.
    if (mOperationsQueue.isEmpty()) {
      dispatchViewUpdates(-1); // -1 = no associated batch id
    }
  }

  @ReactMethod
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {
    ViewManager viewManager = mViewManagers.get(className);
    ReactShadowNode cssNode = viewManager.createShadowNodeInstance();
    ReactShadowNode rootNode = mShadowNodeRegistry.getNode(rootViewTag);
    cssNode.setReactTag(tag);
    cssNode.setViewClassName(className);
    cssNode.setRootNode(rootNode);
    cssNode.setThemedContext(rootNode.getThemedContext());

    mShadowNodeRegistry.addNode(cssNode);

    CatalystStylesDiffMap styles = null;
    if (props != null) {
      styles = new CatalystStylesDiffMap(props);
      cssNode.updateProperties(styles);
    }

    if (!cssNode.isVirtual()) {
      mNativeViewHierarchyOptimizer.handleCreateView(cssNode, rootViewTag, styles);
    }
  }

  @ReactMethod
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
      CatalystStylesDiffMap styles = new CatalystStylesDiffMap(props);
      cssNode.updateProperties(styles);
      if (!cssNode.isVirtual()) {
        mNativeViewHierarchyOptimizer.handleUpdateView(cssNode, className, styles);
      }
    }
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

    // Apply changes to CSSNode hierarchy
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
      removeCSSNode(tagsToDelete[i]);
    }
  }

  private void removeCSSNode(int tag) {
    ReactShadowNode node = mShadowNodeRegistry.getNode(tag);
    mShadowNodeRegistry.removeNode(tag);
    for (int i = 0;i < node.getChildCount(); i++) {
      removeCSSNode(node.getChildAt(i).getReactTag());
    }
  }

  /**
   * Replaces the View specified by oldTag with the View specified by newTag within oldTag's parent.
   * This resolves to a simple {@link #manageChildren} call, but React doesn't have enough info in
   * JS to formulate it itself.
   */
  @ReactMethod
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
  @ReactMethod
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
   * Determines the location on screen, width, and height of the given view and returns the values
   * via an async callback.
   */
  @ReactMethod
  public void measure(final int reactTag, final Callback callback) {
    // This method is called by the implementation of JS touchable interface (see Touchable.js for
    // more details) at the moment of touch activation. That is after user starts the gesture from
    // a touchable view with a given reactTag, or when user drag finger back into the press
    // activation area of a touchable view that have been activated before.
    mOperationsQueue.enqueueMeasure(reactTag, callback);
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
    mOperationsQueue.enqueueFindTargetForTouch(
        reactTag,
        Math.round(PixelUtil.toPixelFromDIP(point.getDouble(0))),
        Math.round(PixelUtil.toPixelFromDIP(point.getDouble(1))),
        callback);
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
  public void addAnimation(final int reactTag, final int animationID, final Callback onSuccess) {
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

  @ReactMethod
  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    assertViewExists(reactTag, "setJSResponder");
    mOperationsQueue.enqueueSetJSResponder(reactTag, blockNativeResponder);
  }

  @ReactMethod
  public void clearJSResponder() {
    mOperationsQueue.enqueueClearJSResponder();
  }

  @ReactMethod
  public void dispatchViewManagerCommand(
      int reactTag,
      int commandId,
      ReadableArray commandArgs) {
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
  @ReactMethod
  public void showPopupMenu(
      int reactTag,
      ReadableArray items,
      Callback error,
      Callback success) {
    assertViewExists(reactTag, "showPopupMenu");
    mOperationsQueue.enqueueShowPopupMenu(reactTag, items, error, success);
  }

  @ReactMethod
  public void setMainScrollViewTag(int reactTag) {
    // TODO(6588266): Implement if required
  }

  @ReactMethod
  public void configureNextLayoutAnimation(
      ReadableMap config,
      Callback successCallback,
      Callback errorCallback) {
    // TODO(6588266): Implement if required
  }

  private void assertViewExists(int reactTag, String operationNameForExceptionMessage) {
    if (mShadowNodeRegistry.getNode(reactTag) == null) {
      throw new IllegalViewOperationException(
          "Unable to execute operation " + operationNameForExceptionMessage + " on view with " +
              "tag: " + reactTag + ", since the view does not exists");
    }
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
      dispatchViewUpdates(batchId);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  public void setUiManagerDebugListener(@Nullable NotThreadSafeUiManagerDebugListener listener) {
    mUiManagerDebugListener = listener;
  }

  public EventDispatcher getEventDispatcher() {
    return mEventDispatcher;
  }

  private void dispatchViewUpdates(final int batchId) {
    for (int i = 0; i < mShadowNodeRegistry.getRootNodeCount(); i++) {
      int tag = mShadowNodeRegistry.getRootTag(i);
      ReactShadowNode cssRoot = mShadowNodeRegistry.getNode(tag);
      notifyOnBeforeLayoutRecursive(cssRoot);
      cssRoot.calculateLayout(mLayoutContext);
      applyUpdatesRecursive(cssRoot, 0f, 0f);
    }

    mNativeViewHierarchyOptimizer.onBatchComplete();
    mOperationsQueue.dispatchViewUpdates(batchId);
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

  private void applyUpdatesRecursive(ReactShadowNode cssNode, float absoluteX, float absoluteY) {
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
      cssNode.dispatchUpdates(
          absoluteX,
          absoluteY,
          mOperationsQueue,
          mNativeViewHierarchyOptimizer);

      // notify JS about layout event if requested
      if (cssNode.shouldNotifyOnLayout()) {
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

  /* package */ void notifyOnViewHierarchyUpdateEnqueued() {
    if (mUiManagerDebugListener != null) {
      mUiManagerDebugListener.onViewHierarchyUpdateEnqueued();
    }
  }

  /* package */ void notifyOnViewHierarchyUpdateFinished() {
    if (mUiManagerDebugListener != null) {
      mUiManagerDebugListener.onViewHierarchyUpdateFinished();
    }
  }

  @ReactMethod
  public void sendAccessibilityEvent(int tag, int eventType) {
    mOperationsQueue.enqueueSendAccessibilityEvent(tag, eventType);
  }

}
