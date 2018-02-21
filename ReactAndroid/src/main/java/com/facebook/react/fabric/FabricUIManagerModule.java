// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.MeasureSpecProvider;
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.UIModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * This class is responsible to create, clone and update {@link ReactShadowNode} using the
 * Fabric API.
 */
@SuppressWarnings("unused") // used from JNI
public class FabricUIManagerModule implements UIModule {

  private final ReactApplicationContext mReactApplicationContext;
  private final ViewManagerRegistry mViewManagerRegistry;

  public FabricUIManagerModule(ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry) {
    mReactApplicationContext = reactContext;
    mViewManagerRegistry = viewManagerRegistry;
  }

  /**
   * Creates a new {@link ReactShadowNode}
   */
  @Nullable
  public ReactShadowNode createNode(int reactTag,
      String viewName,
      int rootTag,
      ReadableMap props) {

    ViewManager viewManager = mViewManagerRegistry.get(viewName);
    ReactShadowNode shadowNode = viewManager.createShadowNodeInstance(mReactApplicationContext);
    shadowNode.setRootTag(rootTag);
    shadowNode.setReactTag(reactTag);
    ReactStylesDiffMap styles = updateProps(props, shadowNode);

    return shadowNode;
  }

  private ReactStylesDiffMap updateProps(ReadableMap props, ReactShadowNode shadowNode) {
    ReactStylesDiffMap styles = null;
    if (props != null) {
      styles = new ReactStylesDiffMap(props);
      shadowNode.updateProperties(styles);
    }
    return styles;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, including
   * its children set (note that the children nodes will not be cloned).
   */
  @Nullable
  public ReactShadowNode cloneNode(ReactShadowNode node) {
    return node.mutableCopy();
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but
   * its children set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildren(ReactShadowNode node) {
    ReactShadowNode clone = cloneNode(node);
    clone.removeAllChildren();
    return clone;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewProps(ReactShadowNode node, ReadableMap newProps) {
    ReactShadowNode clone = cloneNode(node);
    updateProps(newProps, clone);
    return clone;
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
    ReactShadowNode clone = cloneNodeWithNewChildren(node);
    updateProps(newProps, clone);
    return clone;
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent
   * {@link ReactShadowNode}.
   */
  @Nullable
  public void appendChild(ReactShadowNode parent, ReactShadowNode child) {
    parent.addChildAt(child, parent.getChildCount());
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
    // TODO Diffing old Tree with new Tree?
    // Do we need to hold references to old and new tree?
  }

  @Override
  public <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(
    final T rootView) {
    // TODO: complete with actual implementation
    return ReactRootViewTagGenerator.getNextRootViewTag();
  }

}
