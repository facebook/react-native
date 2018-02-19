// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ReactShadowNode;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * This class is responsible to create, clone and update {@link ReactShadowNode} using the
 * Fabric API.
 */
public class FabricUIManagerModule {

  private final ReactApplicationContext mReactApplicationContext;

  public FabricUIManagerModule(ReactApplicationContext reactContext) {
    mReactApplicationContext = reactContext;
  }

  /**
   * Creates a new {@link ReactShadowNode}
   */
  @Nullable
  public ReactShadowNode createNode(int reactTag,
      String viewName,
      int rootTag,
      ReadableMap props,
      int instanceHandle) {
    //TODO T25560658
    return null;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, including
   * its children set (note that the children nodes will not be cloned).
   */
  @Nullable
  public ReactShadowNode cloneNode(ReactShadowNode node) {
    //TODO T25560658
    return null;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but
   * its children set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildren(ReactShadowNode node) {
    //TODO T25560658
    return null;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewProps(ReactShadowNode node, ReadableMap newProps) {
    //TODO T25560658
    return null;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter and its children
   * set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildrenAndProps(
      ReactShadowNode node,
      ReadableMap newProps) {
    //TODO T25560658
    return null;
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent
   * {@link ReactShadowNode}.
   */
  @Nullable
  public void appendChild(ReactShadowNode parent, ReactShadowNode child) {
    //TODO T25560658
  }

  /**
   * @return an empty {@link List<ReactShadowNode>} that will be used to append the
   * {@link ReactShadowNode} elements of the root. Typically this List will contain one element.
   */
  public List<ReactShadowNode> createChildSet() {
    return new ArrayList<>(1);
  }

  /**
   * Adds the {@link ReactShadowNode} to the {@link List<ReactShadowNode>} received by parameter.
   */
  public void appendChildToSet(List<ReactShadowNode> childList, ReactShadowNode child) {
    childList.add(child);
  }

  public void completeRoot(int rootTag, List<ReactShadowNode> childList) {
    //TODO T25560658
  }

}
