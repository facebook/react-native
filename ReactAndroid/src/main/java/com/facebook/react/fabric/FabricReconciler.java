/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.react.common.ArrayUtils;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewAtIndex;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import javax.annotation.Nullable;

public class FabricReconciler {

  private static final String TAG = FabricReconciler.class.getSimpleName();
    private static final boolean DEBUG = ReactBuildConfig.DEBUG || PrinterHolder
    .getPrinter().shouldDisplayLogMessage(ReactDebugOverlayTags.FABRIC_RECONCILER);

  private UIViewOperationQueue uiViewOperationQueue;

  public FabricReconciler(UIViewOperationQueue uiViewOperationQueue) {
    this.uiViewOperationQueue = uiViewOperationQueue;
  }

  public void manageChildren(ReactShadowNode previousRootShadowNode, ReactShadowNode newRootShadowNode) {
    SystraceMessage.beginSection(
      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
      "FabricReconciler.manageChildren")
      .flush();

    try {
      List<ReactShadowNode> prevList =
        previousRootShadowNode == null ? null :  previousRootShadowNode.getChildrenList();
      manageChildren(newRootShadowNode, prevList, newRootShadowNode.getChildrenList());
    } finally{
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
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
      enqueueUpdateProperties(newNode, prevNode);
      manageChildren(prevNode, prevNode.getChildrenList(), newNode.getChildrenList());
      newNode.setOriginalReactShadowNode(null);
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
      enqueueUpdateProperties(newNode, newNode.getOriginalReactShadowNode());
      viewsToAdd.add(new ViewAtIndex(newNode.getReactTag(), k));
      List previousChildrenList = newNode.getOriginalReactShadowNode() == null ? null : newNode.getOriginalReactShadowNode().getChildrenList();
      manageChildren(newNode, previousChildrenList, newNode.getChildrenList());
      newNode.setOriginalReactShadowNode(null);
      addedTags.add(newNode.getReactTag());
    }

    // Every ReactShadowNode on the prevList that is on the right side of
    // firstRemovedOrAddedViewIndex is defined as a removed view.
    // It is more efficient to reorder removing and adding all the views in the right order, instead
    // of calculating the minimum amount of reorder operations.
    // If a View is not re-ordered, then the ReactTag is deleted (ReactShadowNode and native View
    // are released from memory)
    List<Integer> tagsToDelete = new LinkedList<>();
    List<Integer> indicesToRemove = new LinkedList<>();
    for (int j = prevList.size() - 1; j >= firstRemovedOrAddedViewIndex; j--) {
      ReactShadowNode nodeToRemove = prevList.get(j);
      if (nodeToRemove.isVirtual()) continue;
      indicesToRemove.add(0, j);
      if (!addedTags.contains(nodeToRemove.getReactTag())) {
        tagsToDelete.add(nodeToRemove.getReactTag());
      }
    }

    // TODO (t27180994): Mutate views synchronously on main thread
    if (!(indicesToRemove.isEmpty() && viewsToAdd.isEmpty() && tagsToDelete.isEmpty())) {
      int[] indicesToRemoveArray = ArrayUtils.copyListToArray(indicesToRemove);
      ViewAtIndex[] viewsToAddArray = viewsToAdd.toArray(new ViewAtIndex[viewsToAdd.size()]);
      int[] tagsToDeleteArray = ArrayUtils.copyListToArray(tagsToDelete);
      if (DEBUG) {
        FLog.d(
            TAG,
            "manageChildren.enqueueManageChildren parent: " + parent.getReactTag() +
                "\n\tIndices2Remove: " + Arrays.toString(indicesToRemoveArray) +
                "\n\tViews2Add: " + Arrays.toString(viewsToAddArray) +
                "\n\tTags2Delete: " + Arrays.toString(tagsToDeleteArray));
      }
      uiViewOperationQueue.enqueueManageChildren(
        parent.getReactTag(), indicesToRemoveArray, viewsToAddArray, tagsToDeleteArray);
    }
  }

  private void enqueueUpdateProperties(ReactShadowNode newNode, ReactShadowNode prevNode) {
    int reactTag = newNode.getReactTag();
    if (DEBUG) {
      FLog.d(
        TAG,
        "manageChildren.enqueueUpdateProperties " +
          "\n\ttag: " + reactTag +
          "\n\tviewClass: " + newNode.getViewClass() +
          "\n\tinstanceHandle: " + newNode.getInstanceHandle() +
          "\n\tnewProps: " + newNode.getNewProps());
    }

    if (prevNode != null) {
      newNode.updateScreenLayout(prevNode);
    }

    if (newNode.getNewProps() != null) {
      uiViewOperationQueue.enqueueUpdateProperties(
        reactTag, newNode.getViewClass(), newNode.getNewProps());
    }

    uiViewOperationQueue.enqueueUpdateInstanceHandle(
      reactTag, newNode.getInstanceHandle());
  }
}
