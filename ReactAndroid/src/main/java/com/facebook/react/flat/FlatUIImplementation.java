/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.image.ReactImageManager;

/**
 * FlatUIImplementation builds on top of UIImplementation and allows pre-creating everything
 * required for drawing (DrawCommands) and touching (NodeRegions) views in background thread
 * for faster drawing and interactions.
 */
public class FlatUIImplementation extends UIImplementation {
  /**
   * This Comparator allows sorting FlatShadowNode by order in which they should be added.
   */
  private static final Comparator<FlatShadowNode> COMPARATOR = new Comparator<FlatShadowNode>() {
    public int compare(FlatShadowNode lhs, FlatShadowNode rhs) {
      return lhs.getMoveToIndexInParent() - rhs.getMoveToIndexInParent();
    }
  };

  public static FlatUIImplementation createInstance(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagers) {

    ReactImageManager reactImageManager = findReactImageManager(viewManagers);
    if (reactImageManager != null) {
      Object callerContext = reactImageManager.getCallerContext();
      if (callerContext != null) {
        RCTImageView.setCallerContext(callerContext);
      }
    }
    DraweeRequestHelper.setResources(reactContext.getResources());

    TypefaceCache.setAssetManager(reactContext.getAssets());

    viewManagers = new ArrayList<>(viewManagers);
    viewManagers.add(new RCTViewManager());
    viewManagers.add(new RCTTextManager());
    viewManagers.add(new RCTRawTextManager());
    viewManagers.add(new RCTVirtualTextManager());
    viewManagers.add(new RCTTextInlineImageManager());
    viewManagers.add(new RCTImageViewManager());
    viewManagers.add(new RCTTextInputManager());

    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagers);
    FlatNativeViewHierarchyManager nativeViewHierarchyManager = new FlatNativeViewHierarchyManager(
        viewManagerRegistry);
    FlatUIViewOperationQueue operationsQueue = new FlatUIViewOperationQueue(
        reactContext,
        nativeViewHierarchyManager);
    return new FlatUIImplementation(reactImageManager, viewManagerRegistry, operationsQueue);
  }

  /**
   * Temporary storage for elements that need to be moved within a parent.
   * Only used inside #manageChildren() and always empty outside of it.
   */ 
  private final ArrayList<FlatShadowNode> mNodesToMove = new ArrayList<>();
  private final StateBuilder mStateBuilder;
  private @Nullable ReactImageManager mReactImageManager;

  private FlatUIImplementation(
      @Nullable ReactImageManager reactImageManager,
      ViewManagerRegistry viewManagers,
      FlatUIViewOperationQueue operationsQueue) {
    super(viewManagers, operationsQueue);
    mStateBuilder = new StateBuilder(operationsQueue);
    mReactImageManager = reactImageManager;
  }

  @Override
  protected ReactShadowNode createRootShadowNode() {
    if (mReactImageManager != null) {
      // This is not the best place to initialize DraweeRequestHelper, but order of module
      // initialization is undefined, and this is pretty much the earliest when we are guarantied
      // that Fresco is initalized and DraweeControllerBuilder can be queried. This also happens
      // relatively rarely to have any performance considerations.
      DraweeRequestHelper.setDraweeControllerBuilder(
          mReactImageManager.getDraweeControllerBuilder());
      mReactImageManager = null;
    }

    return new FlatRootShadowNode();
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
        mStateBuilder.ensureBackingViewIsCreated(node, styles);
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
        mStateBuilder.ensureBackingViewIsCreated(node, styles);
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
  public void measure(int reactTag, Callback callback) {
    FlatShadowNode node = (FlatShadowNode) resolveShadowNode(reactTag);
    if (node.mountsToView()) {
      super.measure(reactTag, callback);
      return;
    }

    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();

    float xInParent = node.getLayoutX();
    float yInParent = node.getLayoutY();

    while (true) {
      node =  Assertions.assumeNotNull((FlatShadowNode) node.getParent());
      if (node.mountsToView()) {
        break;
      }

      xInParent += node.getLayoutX();
      yInParent += node.getLayoutY();
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
        callback);
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

    int moveFromIndex;
    int moveFromChildIndex;
    if (moveFrom == null) {
      moveFromIndex = -1;
      moveFromChildIndex = -1;
    } else {
      moveFromIndex = moveFrom.size() - 1;
      moveFromChildIndex = moveFrom.getInt(moveFromIndex);
    }

    int removeFromIndex;
    int removeFromChildIndex;
    if (removeFrom == null) {
      removeFromIndex = -1;
      removeFromChildIndex = -1;
    } else {
      removeFromIndex = removeFrom.size() - 1;
      removeFromChildIndex = removeFrom.getInt(removeFromIndex);
    }

    // both moveFrom and removeFrom are already sorted, but combined order is not sorted. Use
    // a merge step from mergesort to walk over both arrays and extract elements in sorted order.

    while (true) {
      if (moveFromChildIndex > removeFromChildIndex) {
        int indexInParent = moveTo.getInt(moveFromIndex);
        moveChild(removeChildAt(parentNode, moveFromChildIndex, prevIndex), indexInParent);
        prevIndex = moveFromChildIndex;

        --moveFromIndex;
        moveFromChildIndex = (moveFromIndex == -1) ? -1 : moveFrom.getInt(moveFromIndex);
      } else if (removeFromChildIndex > moveFromChildIndex) {
        removeChild(removeChildAt(parentNode, removeFromChildIndex, prevIndex));
        prevIndex = removeFromChildIndex;

        --removeFromIndex;
        removeFromChildIndex = (removeFromIndex == -1) ? -1 : removeFrom.getInt(removeFromIndex);
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
  private void removeChild(FlatShadowNode child) {
    if (child.mountsToView()) {
      // this will recursively drop all subviews
      mStateBuilder.dropView(child);
    }
    removeShadowNode(child);
  }

  /**
   * Prepares a given element to be moved to a new position.
   */
  private void moveChild(FlatShadowNode child, int indexInParent) {
    child.setMoveToIndexInParent(indexInParent);
    mNodesToMove.add(child);
  }

  /**
   * Adds all children from addChildTags and mNodesToMove, populated by removeChildren.
   */
  private void addChildren(
      ReactShadowNode parentNode,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices) {

    int prevIndex = -1;

    int numNodesToMove = mNodesToMove.size();
    int moveToIndex;
    int moveToChildIndex;
    FlatShadowNode moveToChild;
    if (numNodesToMove == 0) {
      moveToIndex = Integer.MAX_VALUE;
      moveToChild = null;
      moveToChildIndex = Integer.MAX_VALUE;
    } else {
      if (numNodesToMove > 1) {
        // mNodesToMove is not sorted, so do it now.
        Collections.sort(mNodesToMove, COMPARATOR);
      }
      moveToIndex = 0;
      moveToChild = mNodesToMove.get(0);
      moveToChildIndex = moveToChild.getMoveToIndexInParent();
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

    // both mNodesToMove and addChildTags are already sorted, but combined order is not sorted. Use
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
        addChildAt(parentNode, moveToChild, moveToChildIndex, prevIndex);
        prevIndex = moveToChildIndex;

        ++moveToIndex;
        if (moveToIndex == numNodesToMove) {
          moveToChildIndex = Integer.MAX_VALUE;
        } else {
          moveToChild = mNodesToMove.get(moveToIndex);
          moveToChildIndex = moveToChild.getMoveToIndexInParent();
        }
      } else {
        // moveToChildIndex == addToChildIndex can only be if both are equal to Integer.MAX_VALUE
        // which means that we exhausted both arrays, and all children are added.
        break;
      }
    }

    mNodesToMove.clear();
  }

  /**
   * Removes a child from parent, verifying that we are removing in descending order.
   */
  private static FlatShadowNode removeChildAt(
      ReactShadowNode parentNode,
      int index,
      int prevIndex) {
    if (index >= prevIndex) {
      throw new RuntimeException(
          "Invariant failure, needs sorting! " + index + " >= " + prevIndex);
    }

    return (FlatShadowNode) parentNode.removeChildAt(index);
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
  protected void calculateRootLayout(ReactShadowNode cssRoot) {
  }

  @Override
  protected void applyUpdatesRecursive(
      ReactShadowNode cssNode,
      float absoluteX,
      float absoluteY,
      EventDispatcher eventDispatcher) {
    FlatRootShadowNode rootNode = (FlatRootShadowNode) cssNode;
    if (!rootNode.needsLayout() && !rootNode.isUpdated()) {
      return;
    }

    super.calculateRootLayout(rootNode);
    rootNode.markUpdated(false);
    mStateBuilder.applyUpdates(eventDispatcher, rootNode);
  }

  @Override
  public void setJSResponder(int possiblyVirtualReactTag, boolean blockNativeResponder) {
    ReactShadowNode node = resolveShadowNode(possiblyVirtualReactTag);
    while (node.isVirtual()) {
      node = node.getParent();
    }

    FlatShadowNode nonVirtualNode = (FlatShadowNode) node;
    nonVirtualNode.forceMountToView();
    mStateBuilder.ensureBackingViewIsCreated(nonVirtualNode, null);

    FlatUIViewOperationQueue operationsQueue = mStateBuilder.getOperationsQueue();
    operationsQueue.enqueueSetJSResponder(
        nonVirtualNode.getReactTag(),
        possiblyVirtualReactTag,
        blockNativeResponder);
  }

  private static @Nullable ReactImageManager findReactImageManager(List<ViewManager> viewManagers) {
    for (int i = 0, size = viewManagers.size(); i != size; ++i) {
      if (viewManagers.get(i) instanceof ReactImageManager) {
        return (ReactImageManager) viewManagers.get(i);
      }
    }

    return null;
  }
}
