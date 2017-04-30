/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.fresco.FrescoModule;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.yoga.YogaDirection;

import javax.annotation.Nullable;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FlatUIImplementation builds on top of UIImplementation and allows pre-creating everything
 * required for drawing (DrawCommands) and touching (NodeRegions) views in background thread
 * for faster drawing and interactions.
 */
public class FlatUIImplementation extends UIImplementation {

  private static final Map<String, Class<? extends ViewManager>> flatManagerClassMap;

  static {
    flatManagerClassMap = new HashMap<>();
    flatManagerClassMap.put(RCTViewManager.REACT_CLASS, RCTViewManager.class);
    flatManagerClassMap.put(RCTTextManager.REACT_CLASS, RCTTextManager.class);
    flatManagerClassMap.put(RCTRawTextManager.REACT_CLASS, RCTRawTextManager.class);
    flatManagerClassMap.put(RCTVirtualTextManager.REACT_CLASS, RCTVirtualTextManager.class);
    flatManagerClassMap.put(RCTTextInlineImageManager.REACT_CLASS, RCTTextInlineImageManager.class);
    flatManagerClassMap.put(RCTImageViewManager.REACT_CLASS, RCTImageViewManager.class);
    flatManagerClassMap.put(RCTTextInputManager.REACT_CLASS, RCTTextInputManager.class);
    flatManagerClassMap.put(RCTViewPagerManager.REACT_CLASS, RCTViewPagerManager.class);
    flatManagerClassMap.put(FlatARTSurfaceViewManager.REACT_CLASS, FlatARTSurfaceViewManager.class);
    flatManagerClassMap.put(RCTModalHostManager.REACT_CLASS, RCTModalHostManager.class);
  }

  /**
   * Build the map of view managers, checking that the managers FlatUI requires are correctly
   * overriden.
   */
  private static Map<String, ViewManager> buildViewManagerMap(List<ViewManager> viewManagers) {
    Map<String, ViewManager> viewManagerMap = new HashMap<>();
    for (ViewManager viewManager : viewManagers) {
      viewManagerMap.put(viewManager.getName(), viewManager);
    }
    for (Map.Entry<String, Class<? extends ViewManager>> entry : flatManagerClassMap.entrySet()) {
      String name = entry.getKey();
      ViewManager maybeFlatViewManager = viewManagerMap.get(name);
      if (maybeFlatViewManager == null) {
        // We don't have a view manager for this name in the package, no need to add one.
        continue;
      }

      Class<? extends ViewManager> flatClazz = entry.getValue();
      if (maybeFlatViewManager.getClass() != flatClazz) {
        // If we have instances that have flat equivalents, override them.
        try {
          viewManagerMap.put(name, flatClazz.newInstance());
        } catch (IllegalAccessException e) {
          throw new RuntimeException("Unable to access flat class for " + name, e);
        } catch (InstantiationException e) {
          throw new RuntimeException("Unable to instantiate flat class for " + name, e);
        }
      }
    }
    return viewManagerMap;
  }

  public static FlatUIImplementation createInstance(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagers,
      EventDispatcher eventDispatcher,
      boolean memoryImprovementEnabled) {

    Map<String, ViewManager> viewManagerMap = buildViewManagerMap(viewManagers);

    RCTImageViewManager imageViewManager =
      (RCTImageViewManager) viewManagerMap.get(RCTImageViewManager.REACT_CLASS);
    if (imageViewManager != null) {
      Object callerContext = imageViewManager.getCallerContext();
      if (callerContext != null) {
        RCTImageView.setCallerContext(callerContext);
      }
    }
    DraweeRequestHelper.setResources(reactContext.getResources());

    TypefaceCache.setAssetManager(reactContext.getAssets());

    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagerMap);
    FlatNativeViewHierarchyManager nativeViewHierarchyManager = new FlatNativeViewHierarchyManager(
      viewManagerRegistry);
    FlatUIViewOperationQueue operationsQueue = new FlatUIViewOperationQueue(
      reactContext,
      nativeViewHierarchyManager);
    return new FlatUIImplementation(
      reactContext,
      imageViewManager,
      viewManagerRegistry,
      operationsQueue,
      eventDispatcher,
      memoryImprovementEnabled
    );
  }

  /**
   * Helper class that sorts moveTo/moveFrom arrays passed to #manageChildren().
   * Not used outside of the said method.
   */
  private final MoveProxy mMoveProxy = new MoveProxy();
  private final ReactApplicationContext mReactContext;
  private @Nullable RCTImageViewManager mRCTImageViewManager;
  private final StateBuilder mStateBuilder;
  private final boolean mMemoryImprovementEnabled;

  private FlatUIImplementation(
      ReactApplicationContext reactContext,
      @Nullable RCTImageViewManager rctImageViewManager,
      ViewManagerRegistry viewManagers,
      FlatUIViewOperationQueue operationsQueue,
      EventDispatcher eventDispatcher,
      boolean memoryImprovementEnabled) {
    super(reactContext, viewManagers, operationsQueue, eventDispatcher);
    mReactContext = reactContext;
    mRCTImageViewManager = rctImageViewManager;
    mStateBuilder = new StateBuilder(operationsQueue);
    mMemoryImprovementEnabled = memoryImprovementEnabled;
  }

  @Override
  protected ReactShadowNode createRootShadowNode() {
    if (mRCTImageViewManager != null) {
      // This is not the best place to initialize DraweeRequestHelper, but order of module
      // initialization is undefined, and this is pretty much the earliest when we are guarantied
      // that Fresco is initalized and DraweeControllerBuilder can be queried. This also happens
      // relatively rarely to have any performance considerations.
      mReactContext.getNativeModule(FrescoModule.class); // initialize Fresco
      DraweeRequestHelper.setDraweeControllerBuilder(
        mRCTImageViewManager.getDraweeControllerBuilder());
      mRCTImageViewManager = null;
    }

    ReactShadowNode node = new FlatRootShadowNode();
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    if (sharedI18nUtilInstance.isRTL(mReactContext)) {
      node.setLayoutDirection(YogaDirection.RTL);
    }
    return node;
  }

  @Override
  protected ReactShadowNode createShadowNode(String className) {
    ReactShadowNode cssNode = super.createShadowNode(className);
    if (cssNode instanceof FlatShadowNode || cssNode.isVirtual()) {
      return cssNode;
    }

    ViewManager viewManager = resolveViewManager(className);
    return new NativeViewWrapper(viewManager);
  }

  @Override
  protected void handleCreateView(
    ReactShadowNode cssNode,
    int rootViewTag,
    @Nullable ReactStylesDiffMap styles) {
    if (cssNode instanceof FlatShadowNode) {
      FlatShadowNode node = (FlatShadowNode) cssNode;

      if (styles != null) {
        node.handleUpdateProperties(styles);
      }

      if (node.mountsToView()) {
        mStateBuilder.enqueueCreateOrUpdateView(node, styles);
      }
    } else {
      super.handleCreateView(cssNode, rootViewTag, styles);
    }
  }

  @Override
  protected void handleUpdateView(
    ReactShadowNode cssNode,
    String className,
    ReactStylesDiffMap styles) {
    if (cssNode instanceof FlatShadowNode) {
      FlatShadowNode node = (FlatShadowNode) cssNode;

      node.handleUpdateProperties(styles);

      if (node.mountsToView()) {
        mStateBuilder.enqueueCreateOrUpdateView(node, styles);
      }
    } else {
      super.handleUpdateView(cssNode, className, styles);
    }
  }

  @Override
  public void manageChildren(
    int viewTag,
    @Nullable ReadableArray moveFrom,
    @Nullable ReadableArray moveTo,
    @Nullable ReadableArray addChildTags,
    @Nullable ReadableArray addAtIndices,
    @Nullable ReadableArray removeFrom) {

    ReactShadowNode parentNode = resolveShadowNode(viewTag);

    // moveFrom and removeFrom are defined in original order before any mutations.
    removeChildren(parentNode, moveFrom, moveTo, removeFrom);

    // moveTo and addAtIndices are defined in final order after all the mutations applied.
    addChildren(parentNode, addChildTags, addAtIndices);
  }

  @Override
  public void setChildren(
    int viewTag,
    ReadableArray children) {

    ReactShadowNode parentNode = resolveShadowNode(viewTag);

    for (int i = 0; i < children.size(); i++) {
      ReactShadowNode addToChild = resolveShadowNode(children.getInt(i));
      addChildAt(parentNode, addToChild, i, i - 1);
    }
  }

  @Override
  public void measure(int reactTag, Callback callback) {
    measureHelper(reactTag, false, callback);
  }

  private void measureHelper(int reactTag, boolean relativeToWindow, Callback callback) {
    FlatShadowNode node = (FlatShadowNode) resolveShadowNode(reactTag);
    if (node.mountsToView()) {
      mStateBuilder.ensureBackingViewIsCreated(node);
      if (relativeToWindow) {
        super.measureInWindow(reactTag, callback);
      } else {
        super.measure(reactTag, callback);
      }
      return;
    }

    // virtual nodes do not have values for width and height, so get these values
    // from the first non-virtual parent node
    while (node != null && node.isVirtual()) {
      node = (FlatShadowNode) node.getParent();
    }

    if (node == null) {
      // everything is virtual, this shouldn't happen so just silently return
      return;
    }

    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();

    boolean nodeMountsToView = node.mountsToView();
    // this is to avoid double-counting xInParent and yInParent when we visit
    // the while loop, below.
    float xInParent = nodeMountsToView ? node.getLayoutX() : 0;
    float yInParent = nodeMountsToView ? node.getLayoutY() : 0;

    while (!node.mountsToView()) {
      if (!node.isVirtual()) {
        xInParent += node.getLayoutX();
        yInParent += node.getLayoutY();
      }

      node = Assertions.assumeNotNull((FlatShadowNode) node.getParent());
    }

    float parentWidth = node.getLayoutWidth();
    float parentHeight = node.getLayoutHeight();

    FlatUIViewOperationQueue operationsQueue = mStateBuilder.getOperationsQueue();
    operationsQueue.enqueueMeasureVirtualView(
      node.getReactTag(),
      xInParent / parentWidth,
      yInParent / parentHeight,
      width / parentWidth,
      height / parentHeight,
      relativeToWindow,
      callback);
  }

  private void ensureMountsToViewAndBackingViewIsCreated(int reactTag) {
    FlatShadowNode node = (FlatShadowNode) resolveShadowNode(reactTag);
    if (node.isBackingViewCreated()) {
      return;
    }
    node.forceMountToView();
    mStateBuilder.ensureBackingViewIsCreated(node);
  }

  @Override
  public void findSubviewIn(int reactTag, float targetX, float targetY, Callback callback) {
    ensureMountsToViewAndBackingViewIsCreated(reactTag);
    super.findSubviewIn(reactTag, targetX, targetY, callback);
  }

  @Override
  public void measureInWindow(int reactTag, Callback callback) {
    measureHelper(reactTag, true, callback);
  }

  @Override
  public void addAnimation(int reactTag, int animationID, Callback onSuccess) {
    ensureMountsToViewAndBackingViewIsCreated(reactTag);
    super.addAnimation(reactTag, animationID, onSuccess);
  }

  @Override
  public void dispatchViewManagerCommand(int reactTag, int commandId, ReadableArray commandArgs) {
    // Make sure that our target view is actually a view, then delay command dispatch until after
    // we have updated the view hierarchy.
    ensureMountsToViewAndBackingViewIsCreated(reactTag);
    mStateBuilder.enqueueViewManagerCommand(reactTag, commandId, commandArgs);
  }

  @Override
  public void showPopupMenu(int reactTag, ReadableArray items, Callback error, Callback success) {
    ensureMountsToViewAndBackingViewIsCreated(reactTag);
    super.showPopupMenu(reactTag, items, error, success);
  }

  @Override
  public void sendAccessibilityEvent(int reactTag, int eventType) {
    ensureMountsToViewAndBackingViewIsCreated(reactTag);
    super.sendAccessibilityEvent(reactTag, eventType);
  }

  /**
   * Removes all children defined by moveFrom and removeFrom from a given parent,
   * preparing elements in moveFrom to be re-added at proper index.
   */
  private void removeChildren(
    ReactShadowNode parentNode,
    @Nullable ReadableArray moveFrom,
    @Nullable ReadableArray moveTo,
    @Nullable ReadableArray removeFrom) {

    int prevIndex = Integer.MAX_VALUE;

    mMoveProxy.setup(moveFrom, moveTo);

    int moveFromIndex = mMoveProxy.size() - 1;
    int moveFromChildIndex = (moveFromIndex == -1) ? -1 : mMoveProxy.getMoveFrom(moveFromIndex);

    int numToRemove = removeFrom == null ? 0 : removeFrom.size();
    int[] indicesToRemove = new int[numToRemove];
    if (numToRemove > 0) {
      Assertions.assertNotNull(removeFrom);
      for (int i = 0; i < numToRemove; i++) {
        int indexToRemove = removeFrom.getInt(i);
        indicesToRemove[i] = indexToRemove;
      }
    }

    // this isn't guaranteed to be sorted actually
    Arrays.sort(indicesToRemove);

    int removeFromIndex;
    int removeFromChildIndex;
    if (removeFrom == null) {
      removeFromIndex = -1;
      removeFromChildIndex = -1;
    } else {
      removeFromIndex = indicesToRemove.length - 1;
      removeFromChildIndex = indicesToRemove[removeFromIndex];
    }

    // both moveFrom and removeFrom are already sorted, but combined order is not sorted. Use
    // a merge step from mergesort to walk over both arrays and extract elements in sorted order.

    while (true) {
      if (moveFromChildIndex > removeFromChildIndex) {
        moveChild(removeChildAt(parentNode, moveFromChildIndex, prevIndex), moveFromIndex);
        prevIndex = moveFromChildIndex;

        --moveFromIndex;
        moveFromChildIndex = (moveFromIndex == -1) ? -1 : mMoveProxy.getMoveFrom(moveFromIndex);
      } else if (removeFromChildIndex > moveFromChildIndex) {
        removeChild(removeChildAt(parentNode, removeFromChildIndex, prevIndex), parentNode);
        prevIndex = removeFromChildIndex;

        --removeFromIndex;
        removeFromChildIndex = (removeFromIndex == -1) ? -1 : indicesToRemove[removeFromIndex];
      } else {
        // moveFromChildIndex == removeFromChildIndex can only be if both are equal to -1
        // which means that we exhausted both arrays, and all children are removed.
        break;
      }
    }
  }

  /**
   * Unregisters given element and all of its children from ShadowNodeRegistry,
   * and drops all Views used by it and its children.
   */
  private void removeChild(ReactShadowNode child, ReactShadowNode parentNode) {
    dropNativeViews(child, parentNode);
    removeShadowNode(child);
  }

  private void dropNativeViews(ReactShadowNode child, ReactShadowNode parentNode) {
    if (child instanceof FlatShadowNode) {
      FlatShadowNode node = (FlatShadowNode) child;
      if (node.mountsToView() && node.isBackingViewCreated()) {
        int tag = -1;

        // this tag is used to remove the reference to this dropping view if it it's clipped.
        // we need to figure out the correct "view parent" tag to do this. note that this is
        // not necessarily getParent().getReactTag(), since getParent() may represent something
        // that's not a View - we need to find the first View (what would represent
        // view.getParent() on the ui thread), which is what this code is finding.
        ReactShadowNode tmpNode = parentNode;
        while (tmpNode != null) {
          if (tmpNode instanceof FlatShadowNode) {
            FlatShadowNode flatTmpNode = (FlatShadowNode) tmpNode;
            if (flatTmpNode.mountsToView() && flatTmpNode.isBackingViewCreated() &&
              flatTmpNode.getParent() != null) {
              tag = flatTmpNode.getReactTag();
              break;
            }
          }
          tmpNode = tmpNode.getParent();
        }

        // this will recursively drop all subviews
        mStateBuilder.dropView(node, tag);
        return;
      }
    }

    for (int i = 0, childCount = child.getChildCount(); i != childCount; ++i) {
      dropNativeViews(child.getChildAt(i), child);
    }
  }

  /**
   * Prepares a given element to be moved to a new position.
   */
  private void moveChild(ReactShadowNode child, int moveFromIndex) {
    mMoveProxy.setChildMoveFrom(moveFromIndex, child);
  }

  /**
   * Adds all children from addChildTags and moveFrom/moveTo.
   */
  private void addChildren(
    ReactShadowNode parentNode,
    @Nullable ReadableArray addChildTags,
    @Nullable ReadableArray addAtIndices) {

    int prevIndex = -1;

    int moveToIndex;
    int moveToChildIndex;
    if (mMoveProxy.size() == 0) {
      moveToIndex = Integer.MAX_VALUE;
      moveToChildIndex = Integer.MAX_VALUE;
    } else {
      moveToIndex = 0;
      moveToChildIndex = mMoveProxy.getMoveTo(0);
    }

    int numNodesToAdd;
    int addToIndex;
    int addToChildIndex;
    if (addAtIndices == null) {
      numNodesToAdd = 0;
      addToIndex = Integer.MAX_VALUE;
      addToChildIndex = Integer.MAX_VALUE;
    } else {
      numNodesToAdd = addAtIndices.size();
      addToIndex = 0;
      addToChildIndex = addAtIndices.getInt(0);
    }

    // both mMoveProxy and addChildTags are already sorted, but combined order is not sorted. Use
    // a merge step from mergesort to walk over both arrays and extract elements in sorted order.

    while (true) {
      if (addToChildIndex < moveToChildIndex) {
        ReactShadowNode addToChild = resolveShadowNode(addChildTags.getInt(addToIndex));
        addChildAt(parentNode, addToChild, addToChildIndex, prevIndex);
        prevIndex = addToChildIndex;

        ++addToIndex;
        if (addToIndex == numNodesToAdd) {
          addToChildIndex = Integer.MAX_VALUE;
        } else {
          addToChildIndex = addAtIndices.getInt(addToIndex);
        }
      } else if (moveToChildIndex < addToChildIndex) {
        ReactShadowNode moveToChild = mMoveProxy.getChildMoveTo(moveToIndex);
        addChildAt(parentNode, moveToChild, moveToChildIndex, prevIndex);
        prevIndex = moveToChildIndex;

        ++moveToIndex;
        if (moveToIndex == mMoveProxy.size()) {
          moveToChildIndex = Integer.MAX_VALUE;
        } else {
          moveToChildIndex = mMoveProxy.getMoveTo(moveToIndex);
        }
      } else {
        // moveToChildIndex == addToChildIndex can only be if both are equal to Integer.MAX_VALUE
        // which means that we exhausted both arrays, and all children are added.
        break;
      }
    }
  }

  /**
   * Removes a child from parent, verifying that we are removing in descending order.
   */
  private static ReactShadowNode removeChildAt(
    ReactShadowNode parentNode,
    int index,
    int prevIndex) {
    if (index >= prevIndex) {
      throw new RuntimeException(
        "Invariant failure, needs sorting! " + index + " >= " + prevIndex);
    }

    return parentNode.removeChildAt(index);
  }

  /**
   * Adds a child to parent, verifying that we are adding in ascending order.
   */
  private static void addChildAt(
    ReactShadowNode parentNode,
    ReactShadowNode childNode,
    int index,
    int prevIndex) {
    if (index <= prevIndex) {
      throw new RuntimeException(
        "Invariant failure, needs sorting! " + index + " <= " + prevIndex);
    }

    parentNode.addChildAt(childNode, index);
  }

  @Override
  protected void updateViewHierarchy() {
    super.updateViewHierarchy();
    mStateBuilder.afterUpdateViewHierarchy(mEventDispatcher);
  }

  @Override
  protected void applyUpdatesRecursive(
    ReactShadowNode cssNode,
    float absoluteX,
    float absoluteY) {
    mStateBuilder.applyUpdates((FlatRootShadowNode) cssNode);
  }

  @Override
  public void removeRootView(int rootViewTag) {
    if (mMemoryImprovementEnabled) {
      removeRootShadowNode(rootViewTag);
    }
    mStateBuilder.removeRootView(rootViewTag);
  }

  @Override
  public void setJSResponder(int possiblyVirtualReactTag, boolean blockNativeResponder) {
    ReactShadowNode node = resolveShadowNode(possiblyVirtualReactTag);
    while (node.isVirtual()) {
      node = node.getParent();
    }
    int tag = node.getReactTag();

    // if the node in question doesn't mount to a View, find the first parent that does mount to
    // a View. without this, we'll crash when we try to set the JSResponder, since part of that
    // is to find the parent view and ask it to not intercept touch events.
    while (node instanceof FlatShadowNode && !((FlatShadowNode) node).mountsToView()) {
      node = node.getParent();
    }

    FlatUIViewOperationQueue operationsQueue = mStateBuilder.getOperationsQueue();
    operationsQueue.enqueueSetJSResponder(
      node == null ? tag : node.getReactTag(),
      possiblyVirtualReactTag,
      blockNativeResponder);
  }
}
