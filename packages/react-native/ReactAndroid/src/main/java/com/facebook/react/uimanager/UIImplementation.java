/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.os.SystemClock;
import android.view.View;
import android.view.View.MeasureSpec;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaDirection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * A class that is used to receive React commands from JS and translate them into a shadow node
 * hierarchy that is then mapped to a native view hierarchy.
 */
public class UIImplementation {
  protected Object uiImplementationThreadLock = new Object();

  protected final EventDispatcher mEventDispatcher;
  protected final ReactApplicationContext mReactContext;
  protected final ShadowNodeRegistry mShadowNodeRegistry = new ShadowNodeRegistry();
  private final ViewManagerRegistry mViewManagers;
  private final UIViewOperationQueue mOperationsQueue;
  private final NativeViewHierarchyOptimizer mNativeViewHierarchyOptimizer;
  private final int[] mMeasureBuffer = new int[4];

  private long mLastCalculateLayoutTime = 0;
  protected @Nullable LayoutUpdateListener mLayoutUpdateListener;

  /**
   * When react instance is being shutdown, there could be some pending operations queued in the JS
   * thread. This flag ensures view related operations are not triggered if the Catalyst instance
   * was destroyed.
   */
  private volatile boolean mViewOperationsEnabled = true;

  /** Interface definition for a callback to be invoked when the layout has been updated */
  public interface LayoutUpdateListener {

    /** Called when the layout has been updated */
    void onLayoutUpdated(ReactShadowNode root);
  }

  UIImplementation(
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
    mNativeViewHierarchyOptimizer =
        new NativeViewHierarchyOptimizer(mOperationsQueue, mShadowNodeRegistry);
    mEventDispatcher = eventDispatcher;
  }

  protected ReactShadowNode createRootShadowNode() {
    ReactShadowNode rootCSSNode = new ReactShadowNodeImpl();
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

  public final ReactShadowNode resolveShadowNode(int reactTag) {
    return mShadowNodeRegistry.getNode(reactTag);
  }

  protected final @Nullable ViewManager resolveViewManager(String className) {
    return mViewManagers.getViewManagerIfExists(className);
  }

  /*package*/ UIViewOperationQueue getUIViewOperationQueue() {
    return mOperationsQueue;
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(int tag, int widthMeasureSpec, int heightMeasureSpec) {
    ReactShadowNode rootCSSNode = mShadowNodeRegistry.getNode(tag);
    if (rootCSSNode == null) {
      FLog.w(ReactConstants.TAG, "Tried to update non-existent root tag: " + tag);
      return;
    }
    updateRootView(rootCSSNode, widthMeasureSpec, heightMeasureSpec);
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(
      ReactShadowNode rootCSSNode, int widthMeasureSpec, int heightMeasureSpec) {
    rootCSSNode.setMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
  }

  /**
   * Registers a root node with a given tag, size and ThemedReactContext and adds it to a node
   * registry.
   */
  public <T extends View> void registerRootView(T rootView, int tag, ThemedReactContext context) {
    synchronized (uiImplementationThreadLock) {
      final ReactShadowNode rootCSSNode = createRootShadowNode();
      rootCSSNode.setReactTag(tag); // Thread safety needed here
      rootCSSNode.setThemedContext(context);

      context.runOnNativeModulesQueueThread(
          new Runnable() {
            @Override
            public void run() {
              mShadowNodeRegistry.addRootNode(rootCSSNode);
            }
          });

      // register it within NativeViewHierarchyManager
      mOperationsQueue.addRootView(tag, rootView);
    }
  }

  /** Unregisters a root node with a given tag. */
  public void removeRootView(int rootViewTag) {
    removeRootShadowNode(rootViewTag);
    mOperationsQueue.enqueueRemoveRootView(rootViewTag);
  }

  /**
   * Return root view num
   *
   * @return The num of root view
   */
  public int getRootViewNum() {
    return mOperationsQueue.getNativeViewHierarchyManager().getRootViewNum();
  }

  /** Unregisters a root node with a given tag from the shadow node registry */
  public void removeRootShadowNode(int rootViewTag) {
    synchronized (uiImplementationThreadLock) {
      mShadowNodeRegistry.removeRootNode(rootViewTag); // Thread safety needed here
    }
  }

  /**
   * Invoked when native view that corresponds to a root node, or acts as a root view (ie. Modals)
   * has its size changed.
   */
  public void updateNodeSize(int nodeViewTag, int newWidth, int newHeight) {
    ReactShadowNode cssNode = mShadowNodeRegistry.getNode(nodeViewTag);
    if (cssNode == null) {
      FLog.w(ReactConstants.TAG, "Tried to update size of non-existent tag: " + nodeViewTag);
      return;
    }
    cssNode.setStyleWidth(newWidth);
    cssNode.setStyleHeight(newHeight);

    dispatchViewUpdatesIfNeeded();
  }

  public void setViewLocalData(int tag, Object data) {
    ReactShadowNode shadowNode = mShadowNodeRegistry.getNode(tag);

    if (shadowNode == null) {
      FLog.w(ReactConstants.TAG, "Attempt to set local data for view with unknown tag: " + tag);
      return;
    }

    shadowNode.setLocalData(data);

    dispatchViewUpdatesIfNeeded();
  }

  public void profileNextBatch() {
    mOperationsQueue.profileNextBatch();
  }

  public Map<String, Long> getProfiledBatchPerfCounters() {
    return mOperationsQueue.getProfiledBatchPerfCounters();
  }

  /** Invoked by React to create a new node with a given tag, class name and properties. */
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {
    if (!mViewOperationsEnabled) {
      return;
    }

    synchronized (uiImplementationThreadLock) {
      ReactShadowNode cssNode = createShadowNode(className);
      ReactShadowNode rootNode = mShadowNodeRegistry.getNode(rootViewTag);
      Assertions.assertNotNull(rootNode, "Root node with tag " + rootViewTag + " doesn't exist");
      cssNode.setReactTag(tag); // Thread safety needed here
      cssNode.setViewClassName(className);
      cssNode.setRootTag(rootNode.getReactTag());
      cssNode.setThemedContext(rootNode.getThemedContext());

      mShadowNodeRegistry.addNode(cssNode);

      ReactStylesDiffMap styles = null;
      if (props != null) {
        styles = new ReactStylesDiffMap(props);
        cssNode.updateProperties(styles);
      }

      handleCreateView(cssNode, rootViewTag, styles);
    }
  }

  protected void handleCreateView(
      ReactShadowNode cssNode, int rootViewTag, @Nullable ReactStylesDiffMap styles) {
    if (!cssNode.isVirtual()) {
      mNativeViewHierarchyOptimizer.handleCreateView(cssNode, cssNode.getThemedContext(), styles);
    }
  }

  /** Invoked by React to create a new node with a given tag has its properties changed. */
  public void updateView(int tag, String className, ReadableMap props) {
    if (!mViewOperationsEnabled) {
      return;
    }

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
   * layout-related propertied won't be handled properly. Make sure you know what you're doing
   * before calling this method :)
   */
  public void synchronouslyUpdateViewOnUIThread(int tag, ReactStylesDiffMap props) {
    UiThreadUtil.assertOnUiThread();
    mOperationsQueue.getNativeViewHierarchyManager().updateProperties(tag, props);
  }

  protected void handleUpdateView(
      ReactShadowNode cssNode, String className, ReactStylesDiffMap styles) {
    if (!cssNode.isVirtual()) {
      mNativeViewHierarchyOptimizer.handleUpdateView(cssNode, className, styles);
    }
  }

  /**
   * Invoked when there is a mutation in a node tree.
   *
   * @param tag react tag of the node we want to manage
   * @param indicesToRemove ordered (asc) list of indices at which view should be removed
   * @param viewsToAdd ordered (asc based on mIndex property) list of tag-index pairs that represent
   *     a view which should be added at the specified index
   * @param tagsToDelete list of tags corresponding to views that should be removed
   */
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {
    if (!mViewOperationsEnabled) {
      return;
    }

    synchronized (uiImplementationThreadLock) {
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
          viewsToAdd[i] = new ViewAtIndex(tagToMove, moveTo.getInt(i));
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
          throw new IllegalViewOperationException(
              "Repeated indices in Removal list for view tag: " + viewTag);
        }
        cssNodeToManage.removeChildAt(indicesToRemove[i]); // Thread safety needed here

        lastIndexRemoved = indicesToRemove[i];
      }

      for (int i = 0; i < viewsToAdd.length; i++) {
        ViewAtIndex viewAtIndex = viewsToAdd[i];
        ReactShadowNode cssNodeToAdd = mShadowNodeRegistry.getNode(viewAtIndex.mTag);
        if (cssNodeToAdd == null) {
          throw new IllegalViewOperationException(
              "Trying to add unknown view tag: " + viewAtIndex.mTag);
        }
        cssNodeToManage.addChildAt(cssNodeToAdd, viewAtIndex.mIndex);
      }

      mNativeViewHierarchyOptimizer.handleManageChildren(
          cssNodeToManage, indicesToRemove, tagsToRemove, viewsToAdd, tagsToDelete);

      for (int i = 0; i < tagsToDelete.length; i++) {
        removeShadowNode(mShadowNodeRegistry.getNode(tagsToDelete[i]));
      }
    }
  }

  /**
   * An optimized version of manageChildren that is used for initial setting of child views. The
   * children are assumed to be in index order
   *
   * @param viewTag tag of the parent
   * @param childrenTags tags of the children
   */
  public void setChildren(int viewTag, ReadableArray childrenTags) {
    if (!mViewOperationsEnabled) {
      return;
    }

    synchronized (uiImplementationThreadLock) {
      ReactShadowNode cssNodeToManage = mShadowNodeRegistry.getNode(viewTag);

      for (int i = 0; i < childrenTags.size(); i++) {
        ReactShadowNode cssNodeToAdd = mShadowNodeRegistry.getNode(childrenTags.getInt(i));
        if (cssNodeToAdd == null) {
          throw new IllegalViewOperationException(
              "Trying to add unknown view tag: " + childrenTags.getInt(i));
        }
        cssNodeToManage.addChildAt(cssNodeToAdd, i);
      }

      mNativeViewHierarchyOptimizer.handleSetChildren(cssNodeToManage, childrenTags);
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
  public void findSubviewIn(int reactTag, float targetX, float targetY, Callback callback) {
    mOperationsQueue.enqueueFindTargetForTouch(reactTag, targetX, targetY, callback);
  }

  /**
   * Check if the first shadow node is the descendant of the second shadow node
   *
   * @deprecated This method will not be implemented in Fabric.
   */
  @Deprecated
  public void viewIsDescendantOf(
      final int reactTag, final int ancestorReactTag, final Callback callback) {
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
    if (!mViewOperationsEnabled) {
      return;
    }

    // This method is called by the implementation of JS touchable interface (see Touchable.js for
    // more details) at the moment of touch activation. That is after user starts the gesture from
    // a touchable view with a given reactTag, or when user drag finger back into the press
    // activation area of a touchable view that have been activated before.
    mOperationsQueue.enqueueMeasure(reactTag, callback);
  }

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback. This is the absolute position including
   * things like the status bar
   */
  public void measureInWindow(int reactTag, Callback callback) {
    if (!mViewOperationsEnabled) {
      return;
    }

    mOperationsQueue.enqueueMeasureInWindow(reactTag, callback);
  }

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case the
   * position always will be (0, 0) and method will only measure the view dimensions.
   */
  public void measureLayout(
      int tag, int ancestorTag, Callback errorCallback, Callback successCallback) {
    if (!mViewOperationsEnabled) {
      return;
    }

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
      int tag, Callback errorCallback, Callback successCallback) {
    if (!mViewOperationsEnabled) {
      return;
    }

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

  /** Invoked at the end of the transaction to commit any updates to the node hierarchy. */
  public void dispatchViewUpdates(int batchId) {
    SystraceMessage.beginSection(
            Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementation.dispatchViewUpdates")
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

  private void dispatchViewUpdatesIfNeeded() {
    // If we are in the middle of a batch update, any additional changes
    // will automatically be dispatched at the end of the batch.
    // If we are not, we have to initiate new batch update.
    // As all batches are executed as a single runnable on the event queue
    // this should always be empty, but that calling architecture is an implementation detail.
    if (mOperationsQueue.isEmpty()) {
      dispatchViewUpdates(-1); // "-1" means "no associated batch id"
    }
  }

  protected void updateViewHierarchy() {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementation.updateViewHierarchy");
    try {
      for (int i = 0; i < mShadowNodeRegistry.getRootNodeCount(); i++) {
        int tag = mShadowNodeRegistry.getRootTag(i);
        ReactShadowNode cssRoot = mShadowNodeRegistry.getNode(tag);

        if (cssRoot.getWidthMeasureSpec() != null && cssRoot.getHeightMeasureSpec() != null) {
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
                  Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementation.applyUpdatesRecursive")
              .arg("rootTag", cssRoot.getReactTag())
              .flush();
          try {
            List<ReactShadowNode> onLayoutNodes = new ArrayList<>();
            applyUpdatesRecursive(cssRoot, 0f, 0f, onLayoutNodes);

            for (ReactShadowNode node : onLayoutNodes) {
              mEventDispatcher.dispatchEvent(
                  OnLayoutEvent.obtain(
                      -1, /* surfaceId not used in classic renderer */
                      node.getReactTag(),
                      node.getScreenX(),
                      node.getScreenY(),
                      node.getScreenWidth(),
                      node.getScreenHeight()));
            }

          } finally {
            Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
          }

          if (mLayoutUpdateListener != null) {
            mOperationsQueue.enqueueLayoutUpdateFinished(cssRoot, mLayoutUpdateListener);
          }
        }
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

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
  public void setLayoutAnimationEnabledExperimental(boolean enabled) {
    mOperationsQueue.enqueueSetLayoutAnimationEnabled(enabled);
  }

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
   * @param error will be called if there was an error processing the animation
   */
  public void configureNextLayoutAnimation(ReadableMap config, Callback success) {
    mOperationsQueue.enqueueConfigureLayoutAnimation(config, success);
  }

  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    ReactShadowNode node = mShadowNodeRegistry.getNode(reactTag);

    if (node == null) {
      // TODO: this should only happen when using Fabric renderer. This is a temporary approach
      // and it will be refactored when fabric supports JS Responder.
      return;
    }

    while (node.getNativeKind() == NativeKind.NONE) {
      node = node.getParent();
    }
    mOperationsQueue.enqueueSetJSResponder(node.getReactTag(), reactTag, blockNativeResponder);
  }

  public void clearJSResponder() {
    mOperationsQueue.enqueueClearJSResponder();
  }

  @Deprecated
  public void dispatchViewManagerCommand(
      int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    boolean viewExists =
        checkOrAssertViewExists(reactTag, "dispatchViewManagerCommand: " + commandId);
    if (!viewExists) {
      return;
    }

    mOperationsQueue.enqueueDispatchCommand(reactTag, commandId, commandArgs);
  }

  public void dispatchViewManagerCommand(
      int reactTag, String commandId, @Nullable ReadableArray commandArgs) {
    boolean viewExists =
        checkOrAssertViewExists(reactTag, "dispatchViewManagerCommand: " + commandId);
    if (!viewExists) {
      return;
    }

    mOperationsQueue.enqueueDispatchCommand(reactTag, commandId, commandArgs);
  }

  /**
   * Show a PopupMenu.
   *
   * <p>This is deprecated, please use the <PopupMenuAndroid /> component instead.
   *
   * <p>TODO(T175424986): Remove UIManager.showPopupMenu() in React Native v0.75.
   *
   * @param reactTag the tag of the anchor view (the PopupMenu is displayed next to this view); this
   *     needs to be the tag of a native view (shadow views can not be anchors)
   * @param items the menu items as an array of strings
   * @param error will be called if there is an error displaying the menu
   * @param success will be called with the position of the selected item as the first argument, or
   *     no arguments if the menu is dismissed
   */
  @Deprecated
  public void showPopupMenu(int reactTag, ReadableArray items, Callback error, Callback success) {
    boolean viewExists = checkOrAssertViewExists(reactTag, "showPopupMenu");
    if (!viewExists) {
      return;
    }

    mOperationsQueue.enqueueShowPopupMenu(reactTag, items, error, success);
  }

  /** TODO(T175424986): Remove UIManager.dismissPopupMenu() in React Native v0.75. */
  @Deprecated
  public void dismissPopupMenu() {
    mOperationsQueue.enqueueDismissPopupMenu();
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

  public void onHostDestroy() {}

  public void onCatalystInstanceDestroyed() {
    mViewOperationsEnabled = false;
    mViewManagers.invalidate();
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
      ReactShadowNode node, ReactShadowNode ancestor, int[] outputBuffer) {
    int offsetX = 0;
    int offsetY = 0;
    if (node != ancestor && !node.isVirtual()) {
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

  /**
   * Returns whether a view identified by the tag exists. In debug mode, this will throw whenever
   * the view doesn't exist. In production, it'll log a warning. Callers should use this and just
   * return if the view doesn't exist to avoid crashing.
   */
  private boolean checkOrAssertViewExists(int reactTag, String operationNameForExceptionMessage) {
    boolean viewExists = mShadowNodeRegistry.getNode(reactTag) != null;
    if (viewExists) {
      return true;
    }

    String message =
        "Unable to execute operation "
            + operationNameForExceptionMessage
            + " on view with "
            + "tag: "
            + reactTag
            + ", since the view does not exist";

    if (ReactBuildConfig.DEBUG) {
      throw new IllegalViewOperationException(message);
    } else {
      FLog.w(ReactConstants.TAG, message);
      return false;
    }
  }

  private void assertNodeDoesNotNeedCustomLayoutForChildren(ReactShadowNode node) {
    ViewManager viewManager = Assertions.assertNotNull(mViewManagers.get(node.getViewClass()));
    IViewManagerWithChildren viewManagerWithChildren;
    if (viewManager instanceof IViewManagerWithChildren) {
      viewManagerWithChildren = (IViewManagerWithChildren) viewManager;
    } else {
      throw new IllegalViewOperationException(
          "Trying to use view "
              + node.getViewClass()
              + " as a parent, but its Manager doesn't extends ViewGroupManager");
    }
    if (viewManagerWithChildren != null && viewManagerWithChildren.needsCustomLayoutForChildren()) {
      throw new IllegalViewOperationException(
          "Trying to measure a view using measureLayout/measureLayoutRelativeToParent relative to"
              + " an ancestor that requires custom layout for it's children ("
              + node.getViewClass()
              + "). Use measure instead.");
    }
  }

  private void notifyOnBeforeLayoutRecursive(ReactShadowNode cssNode) {
    if (!cssNode.hasUpdates()) {
      return;
    }
    for (int i = 0; i < cssNode.getChildCount(); i++) {
      notifyOnBeforeLayoutRecursive(cssNode.getChildAt(i));
    }
    cssNode.onBeforeLayout(mNativeViewHierarchyOptimizer);
  }

  protected void calculateRootLayout(ReactShadowNode cssRoot) {
    SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "cssRoot.calculateLayout")
        .arg("rootTag", cssRoot.getReactTag())
        .flush();
    long startTime = SystemClock.uptimeMillis();
    try {
      int widthSpec = cssRoot.getWidthMeasureSpec();
      int heightSpec = cssRoot.getHeightMeasureSpec();
      cssRoot.calculateLayout(
          MeasureSpec.getMode(widthSpec) == MeasureSpec.UNSPECIFIED
              ? YogaConstants.UNDEFINED
              : MeasureSpec.getSize(widthSpec),
          MeasureSpec.getMode(heightSpec) == MeasureSpec.UNSPECIFIED
              ? YogaConstants.UNDEFINED
              : MeasureSpec.getSize(heightSpec));
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      mLastCalculateLayoutTime = SystemClock.uptimeMillis() - startTime;
    }
  }

  protected void applyUpdatesRecursive(
      ReactShadowNode cssNode,
      float absoluteX,
      float absoluteY,
      List<ReactShadowNode> onLayoutNodes) {
    if (!cssNode.hasUpdates()) {
      return;
    }

    if (cssNode.dispatchUpdatesWillChangeLayout(absoluteX, absoluteY)
        && cssNode.shouldNotifyOnLayout()
        && !mShadowNodeRegistry.isRootNode(cssNode.getReactTag())) {
      onLayoutNodes.add(cssNode);
    }

    Iterable<? extends ReactShadowNode> cssChildren = cssNode.calculateLayoutOnChildren();
    if (cssChildren != null) {
      for (ReactShadowNode cssChild : cssChildren) {
        applyUpdatesRecursive(
            cssChild,
            absoluteX + cssNode.getLayoutX(),
            absoluteY + cssNode.getLayoutY(),
            onLayoutNodes);
      }
    }

    cssNode.dispatchUpdates(absoluteX, absoluteY, mOperationsQueue, mNativeViewHierarchyOptimizer);

    cssNode.markUpdateSeen();
    mNativeViewHierarchyOptimizer.onViewUpdatesCompleted(cssNode);
  }

  public void addUIBlock(UIBlock block) {
    mOperationsQueue.enqueueUIBlock(block);
  }

  public void prependUIBlock(UIBlock block) {
    mOperationsQueue.prependUIBlock(block);
  }

  public int resolveRootTagFromReactTag(int reactTag) {
    if (mShadowNodeRegistry.isRootNode(reactTag)) {
      return reactTag;
    }

    ReactShadowNode node = resolveShadowNode(reactTag);
    int rootTag = 0;
    if (node != null) {
      rootTag = node.getRootTag();
    } else {
      FLog.w(
          ReactConstants.TAG,
          "Warning : attempted to resolve a non-existent react shadow node. reactTag=" + reactTag);
    }

    return rootTag;
  }

  public void setLayoutUpdateListener(LayoutUpdateListener listener) {
    mLayoutUpdateListener = listener;
  }

  public void removeLayoutUpdateListener() {
    mLayoutUpdateListener = null;
  }
}
