/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.util.Log;
import android.util.SparseArray;
import com.facebook.react.common.ArrayUtils;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewAtIndex;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import javax.annotation.Nullable;

public class FabricReconciler {

  private static final String TAG = FabricReconciler.class.getSimpleName();
  private static final boolean DEBUG = true;

  private UIViewOperationQueue uiViewOperationQueue;

  public FabricReconciler(UIViewOperationQueue uiViewOperationQueue) {
    this.uiViewOperationQueue = uiViewOperationQueue;
  }

  public void manageChildren(ReactShadowNode previousRootShadowNode, ReactShadowNode newRootShadowNode) {
    List<ReactShadowNode> prevList =
      previousRootShadowNode == null ? null :  previousRootShadowNode.getChildrenList();
    manageChildren(newRootShadowNode, prevList, newRootShadowNode.getChildrenList());
  }

  private void manageChildren(
    ReactShadowNode parent,
    @Nullable List<ReactShadowNode> prevList,
    @Nullable List<ReactShadowNode> newList) {
    prevList = prevList == null ? Collections.<ReactShadowNode>emptyList() : prevList;
    newList = newList == null ? Collections.<ReactShadowNode>emptyList() : newList;

    // Iterate through each child list and compare each previous and next child. Same nodes
    // implies no change is needed. If the nodes are different but are referencing the same view,
    // the view needs to be updated with new props and children. Otherwise, there has been
    // a change in the children positions.
    int sameReactTagIndex = 0;
    for (; sameReactTagIndex < Math.min(prevList.size(), newList.size()); sameReactTagIndex++) {
      ReactShadowNode prevNode = prevList.get(sameReactTagIndex);
      ReactShadowNode newNode = newList.get(sameReactTagIndex);
      if (prevNode == newNode) {
        continue;
      }
      if (prevNode.getReactTag() != newNode.getReactTag()) {
        break;
      }
      enqueueUpdateProperties(newNode);
      manageChildren(prevNode, prevNode.getChildrenList(), newNode.getChildrenList());
      prevNode.setOriginalReactShadowNode(newNode);
    }
    int firstRemovedOrAddedViewIndex = sameReactTagIndex;

    // Every ReactShadowNode on the newList that is on the right side of
    // firstRemovedOrAddedViewIndex is defined as an added view.
    // It is more efficient to reorder removing and adding all the views in the right order, instead
    // of calculating the minimum amount of reorder operations.
    Set<Integer> addedTags = new HashSet<>();
    List<ViewAtIndex> viewsToAdd = new LinkedList<>();
    for (int k = firstRemovedOrAddedViewIndex; k < newList.size(); k++) {
      ReactShadowNode newNode = newList.get(k);
      if (newNode.isVirtual()) continue;
      enqueueUpdateProperties(newNode);
      viewsToAdd.add(new ViewAtIndex(newNode.getReactTag(), k));
      List previousChildrenList = newNode.getOriginalReactShadowNode() == null ? null : newNode.getOriginalReactShadowNode().getChildrenList();
      manageChildren(newNode, previousChildrenList, newNode.getChildrenList());
      newNode.setOriginalReactShadowNode(newNode);
      addedTags.add(newNode.getReactTag());
    }

    // Every ReactShadowNode on the prevList that is on the right side of
    // firstRemovedOrAddedViewIndex is defined as a removed view.
    // It is more efficient to reorder removing and adding all the views in the right order, instead
    // of calculating the minimum amount of reorder operations.
    // If a View is not re-ordered, then the ReactTag is deleted (ReactShadowNode and native View
    // are released from memory)
    List<Integer> tagsToDelete = new LinkedList<>();
    int[] indicesToRemove = new int[prevList.size() - firstRemovedOrAddedViewIndex];
    int indicesToRemoveIndex = 0;
    for (int j = firstRemovedOrAddedViewIndex; j < prevList.size(); j++) {
      ReactShadowNode nodeToRemove = prevList.get(j);
      if (nodeToRemove.isVirtual()) continue;
      indicesToRemove[indicesToRemoveIndex++] = j;
      if (!addedTags.contains(nodeToRemove.getReactTag())) {
        tagsToDelete.add(nodeToRemove.getReactTag());
        // TODO: T26729293 since we are not cloning ReactShadowNode's we need to "manually" remove
        // from the ReactShadowTree when one of the nodes is deleted in JS.
        nodeToRemove.getParent().removeChildAt(j);
      }
    }

    int[] tagsToDeleteArray = ArrayUtils.copyListToArray(tagsToDelete);
    ViewAtIndex[] viewsToAddArray = viewsToAdd.toArray(new ViewAtIndex[viewsToAdd.size()]);

    // TODO (t27180994): Mutate views synchronously on main thread
    if (indicesToRemove.length > 0 || viewsToAddArray.length > 0 || tagsToDeleteArray.length > 0) {
      if (DEBUG) {
        Log.d(
            TAG,
            "manageChildren.enqueueManageChildren parent: " + parent.getReactTag() +
                "\n\tIndices2Remove: " + Arrays.toString(indicesToRemove) +
                "\n\tViews2Add: " + Arrays.toString(viewsToAddArray) +
                "\n\tTags2Delete: " + Arrays.toString(tagsToDeleteArray));
      }
      uiViewOperationQueue.enqueueManageChildren(
        parent.getReactTag(), indicesToRemove, viewsToAddArray, tagsToDeleteArray);
    }
  }

  private void enqueueUpdateProperties(ReactShadowNode node) {
    if (node.getNewProps() == null) {
      return;
    }
    if (DEBUG) {
      Log.d(
          TAG,
          "manageChildren.enqueueUpdateProperties " +
              "\n\ttag: " + node.getReactTag() +
              "\n\tviewClass: " + node.getViewClass() +
              "\n\tnewProps: " + node.getNewProps());
    }
    uiViewOperationQueue.enqueueUpdateProperties(
        node.getReactTag(), node.getViewClass(), node.getNewProps());
  }

}
