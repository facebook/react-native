/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import android.util.SparseArray;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIImplementation;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Queue;

import javax.annotation.Nullable;

/**
 * This is the main class that coordinates how native animated JS implementation drives UI changes.
 *
 * It implements a management interface for animated nodes graph as well as implements a graph
 * traversal algorithm that is run for each animation frame.
 *
 * For each animation frame we visit animated nodes that might've been updated as well as their
 * children that may use parent's values to update themselves. At the end of the traversal algorithm
 * we expect to reach a special type of the node: PropsAnimatedNode that is then responsible for
 * calculating property map which can be sent to native view hierarchy to update the view.
 *
 * IMPORTANT: This class should be accessed only from the UI Thread
 */
/*package*/ class NativeAnimatedNodesManager {

  private final SparseArray<AnimatedNode> mAnimatedNodes = new SparseArray<>();
  private final ArrayList<AnimationDriver> mActiveAnimations = new ArrayList<>();
  private final ArrayList<AnimatedNode> mUpdatedNodes = new ArrayList<>();
  private final UIImplementation mUIImplementation;
  private int mAnimatedGraphBFSColor = 0;

  public NativeAnimatedNodesManager(UIImplementation uiImplementation) {
    mUIImplementation = uiImplementation;
  }

  /*package*/ @Nullable AnimatedNode getNodeById(int id) {
    return mAnimatedNodes.get(id);
  }

  public boolean hasActiveAnimations() {
    return !mActiveAnimations.isEmpty() || !mUpdatedNodes.isEmpty();
  }

  public void createAnimatedNode(int tag, ReadableMap config) {
    if (mAnimatedNodes.get(tag) != null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + tag +
        " already exists");
    }
    String type = config.getString("type");
    final AnimatedNode node;
    if ("style".equals(type)) {
      node = new StyleAnimatedNode(config, this);
    } else if ("value".equals(type)) {
      node = new ValueAnimatedNode(config);
      mUpdatedNodes.add(node);
    } else if ("props".equals(type)) {
      node = new PropsAnimatedNode(config, this);
    } else if ("interpolation".equals(type)) {
      node = new InterpolationAnimatedNode(config);
    } else if ("addition".equals(type)) {
      node = new AdditionAnimatedNode(config, this);
    } else if ("multiplication".equals(type)) {
      node = new MultiplicationAnimatedNode(config, this);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported node type: " + type);
    }
    node.mTag = tag;
    mAnimatedNodes.put(tag, node);
  }

  public void dropAnimatedNode(int tag) {
    mAnimatedNodes.remove(tag);
  }

  public void setAnimatedNodeValue(int tag, double value) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + tag +
        " does not exists or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).mValue = value;
    mUpdatedNodes.add(node);
  }

  public void startAnimatingNode(
    int animationId,
    int animatedNodeTag,
    ReadableMap animationConfig,
    Callback endCallback) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
        " does not exists");
    }
    if (!(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node should be of type " +
        ValueAnimatedNode.class.getName());
    }
    String type = animationConfig.getString("type");
    final AnimationDriver animation;
    if ("frames".equals(type)) {
      animation = new FrameBasedAnimationDriver(animationConfig);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported animation type: " + type);
    }
    animation.mId = animationId;
    animation.mEndCallback = endCallback;
    animation.mAnimatedValue = (ValueAnimatedNode) node;
    mActiveAnimations.add(animation);
  }

  public void stopAnimation(int animationId) {
    // in most of the cases there should never be more than a few active animations running at the
    // same time. Therefore it does not make much sense to create an animationId -> animation
    // object map that would require additional memory just to support the use-case of stopping
    // an animation
    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.get(i);
      if (animation.mId == animationId) {
        // Invoke animation end callback with {finished: false}
        WritableMap endCallbackResponse = Arguments.createMap();
        endCallbackResponse.putBoolean("finished", false);
        animation.mEndCallback.invoke(endCallbackResponse);
        mActiveAnimations.remove(i);
        return;
      }
    }
    // Do not throw an error in the case animation could not be found. We only keep "active"
    // animations in the registry and there is a chance that Animated.js will enqueue a
    // stopAnimation call after the animation has ended or the call will reach native thread only
    // when the animation is already over.
  }

  public void connectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + parentNodeTag +
        " does not exists");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + childNodeTag +
        " does not exists");
    }
    parentNode.addChild(childNode);
  }

  public void disconnectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + parentNodeTag +
        " does not exists");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + childNodeTag +
        " does not exists");
    }
    parentNode.removeChild(childNode);
  }

  public void connectAnimatedNodeToView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
        " does not exists");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
        "of type " + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    if (propsAnimatedNode.mConnectedViewTag != -1) {
      throw new JSApplicationIllegalArgumentException("Animated node " + animatedNodeTag + " is " +
        "already attached to a view");
    }
    propsAnimatedNode.mConnectedViewTag = viewTag;
  }

  public void disconnectAnimatedNodeFromView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
        " does not exists");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
        "of type " + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    if (propsAnimatedNode.mConnectedViewTag != viewTag) {
      throw new JSApplicationIllegalArgumentException("Attempting to disconnect view that has " +
        "not been connected with the given animated node");
    }
    propsAnimatedNode.mConnectedViewTag = -1;
  }

  /**
   * Animation loop performs two BFSes over the graph of animated nodes. We use incremented
   * {@code mAnimatedGraphBFSColor} to mark nodes as visited in each of the BFSes which saves
   * additional loops for clearing "visited" states.
   *
   * First BFS starts with nodes that are in {@code mUpdatedNodes} (that is, their value have been
   * modified from JS in the last batch of JS operations) or directly attached to an active
   * animation (hence linked to objects from {@code mActiveAnimations}). In that step we calculate
   * an attribute {@code mActiveIncomingNodes}. The second BFS runs in topological order over the
   * sub-graph of *active* nodes. This is done by adding node to the BFS queue only if all its
   * "predecessors" have already been visited.
   */
  public void runUpdates(long frameTimeNanos) {
    UiThreadUtil.assertOnUiThread();
    int activeNodesCount = 0;
    int updatedNodesCount = 0;
    boolean hasFinishedAnimations = false;

    // STEP 1.
    // BFS over graph of nodes starting from ones from `mUpdatedNodes` and ones that are attached to
    // active animations (from `mActiveAnimations)`. Update `mIncomingNodes` attribute for each node
    // during that BFS. Store number of visited nodes in `activeNodesCount`. We "execute" active
    // animations as a part of this step.

    mAnimatedGraphBFSColor++; /* use new color */
    if (mAnimatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // value "0" is used as an initial color for a new node, using it in BFS may cause some nodes
      // to be skipped.
      mAnimatedGraphBFSColor++;
    }

    Queue<AnimatedNode> nodesQueue = new ArrayDeque<>();
    for (int i = 0; i < mUpdatedNodes.size(); i++) {
      AnimatedNode node = mUpdatedNodes.get(i);
      if (node.mBFSColor != mAnimatedGraphBFSColor) {
        node.mBFSColor = mAnimatedGraphBFSColor;
        activeNodesCount++;
        nodesQueue.add(node);
      }
    }

    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.get(i);
      animation.runAnimationStep(frameTimeNanos);
      AnimatedNode valueNode = animation.mAnimatedValue;
      if (valueNode.mBFSColor != mAnimatedGraphBFSColor) {
        valueNode.mBFSColor = mAnimatedGraphBFSColor;
        activeNodesCount++;
        nodesQueue.add(valueNode);
      }
      if (animation.mHasFinished) {
        hasFinishedAnimations = true;
      }
    }

    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      if (nextNode.mChildren != null) {
        for (int i = 0; i < nextNode.mChildren.size(); i++) {
          AnimatedNode child = nextNode.mChildren.get(i);
          child.mActiveIncomingNodes++;
          if (child.mBFSColor != mAnimatedGraphBFSColor) {
            child.mBFSColor = mAnimatedGraphBFSColor;
            activeNodesCount++;
            nodesQueue.add(child);
          }
        }
      }
    }

    // STEP 2
    // BFS over the graph of active nodes in topological order -> visit node only when all its
    // "predecessors" in the graph have already been visited. It is important to visit nodes in that
    // order as they may often use values of their predecessors in order to calculate "next state"
    // of their own. We start by determining the starting set of nodes by looking for nodes with
    // `mActiveIncomingNodes = 0` (those can only be the ones that we start BFS in the previous
    // step). We store number of visited nodes in this step in `updatedNodesCount`

    mAnimatedGraphBFSColor++;
    if (mAnimatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // see reasoning for this check a few lines above
      mAnimatedGraphBFSColor++;
    }

    // find nodes with zero "incoming nodes", those can be either nodes from `mUpdatedNodes` or
    // ones connected to active animations
    for (int i = 0; i < mUpdatedNodes.size(); i++) {
      AnimatedNode node = mUpdatedNodes.get(i);
      if (node.mActiveIncomingNodes == 0 && node.mBFSColor != mAnimatedGraphBFSColor) {
        node.mBFSColor = mAnimatedGraphBFSColor;
        updatedNodesCount++;
        nodesQueue.add(node);
      }
    }
    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.get(i);
      AnimatedNode valueNode = animation.mAnimatedValue;
      if (valueNode.mActiveIncomingNodes == 0 && valueNode.mBFSColor != mAnimatedGraphBFSColor) {
        valueNode.mBFSColor = mAnimatedGraphBFSColor;
        updatedNodesCount++;
        nodesQueue.add(valueNode);
      }
    }

    // Run main "update" loop
    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      nextNode.update();
      if (nextNode instanceof PropsAnimatedNode) {
        // Send property updates to native view manager
        ((PropsAnimatedNode) nextNode).updateView(mUIImplementation);
      }
      if (nextNode.mChildren != null) {
        for (int i = 0; i < nextNode.mChildren.size(); i++) {
          AnimatedNode child = nextNode.mChildren.get(i);
          child.mActiveIncomingNodes--;
          if (child.mBFSColor != mAnimatedGraphBFSColor && child.mActiveIncomingNodes == 0) {
            child.mBFSColor = mAnimatedGraphBFSColor;
            updatedNodesCount++;
            nodesQueue.add(child);
          }
        }
      }
    }

    // Verify that we've visited *all* active nodes. Throw otherwise as this would mean there is a
    // cycle in animated node graph. We also take advantage of the fact that all active nodes are
    // visited in the step above so that all the nodes properties `mActiveIncomingNodes` are set to
    // zero
    if (activeNodesCount != updatedNodesCount) {
      throw new IllegalStateException("Looks like animated nodes graph has cycles, there are "
        + activeNodesCount + " but toposort visited only " + updatedNodesCount);
    }

    // Clean mUpdatedNodes queue
    mUpdatedNodes.clear();

    // Cleanup finished animations. Iterate over the array of animations and override ones that has
    // finished, then resize `mActiveAnimations`.
    if (hasFinishedAnimations) {
      int dest = 0;
      for (int i = 0; i < mActiveAnimations.size(); i++) {
        AnimationDriver animation = mActiveAnimations.get(i);
        if (!animation.mHasFinished) {
          mActiveAnimations.set(dest++, animation);
        } else {
          WritableMap endCallbackResponse = Arguments.createMap();
          endCallbackResponse.putBoolean("finished", true);
          animation.mEndCallback.invoke(endCallbackResponse);
        }
      }
      for (int i = mActiveAnimations.size() - 1; i >= dest; i--) {
        mActiveAnimations.remove(i);
      }
    }
  }
}
