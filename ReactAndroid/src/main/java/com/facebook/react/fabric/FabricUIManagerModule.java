// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ReactShadowNode;

/**
 * <p>Native module to allow JS to create and update native Views using Fabric API.</p>
 *
 */
@ReactModule(name = FabricUIManagerModule.NAME)
public class FabricUIManagerModule extends ReactContextBaseJavaModule {

  static final String NAME = "FabricUIManager";

  public FabricUIManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  /**
   * Creates a new {@link ReactShadowNode}
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int createNode(int reactTag,
      String viewName,
      int rootTag,
      ReadableMap props,
      int instanceHandle) {
    //TODO T25560658
    return -1;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, including
   * its children set (note that the children nodes will not be cloned).
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int cloneNode(int node) {
    //TODO T25560658
    return -1;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but
   * its children set will be empty.
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int cloneNodeWithNewChildren(int node) {
    //TODO T25560658
    return -1;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int cloneNodeWithNewProps(int node, ReadableMap newProps) {
    //TODO T25560658
    return -1;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter and its children
   * set will be empty.
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int cloneNodeWithNewChildrenAndProps(
      int node,
      ReadableMap newProps) {
    //TODO T25560658
    return -1;
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent
   * {@link ReactShadowNode}.
   */
  @ReactMethod
  public void appendChild(int parent, int child) {
    //TODO T25560658
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public int createChildSet() {
    //TODO T25560658
    return -1;
  }

  @ReactMethod
  public void appendChildToSet(int childSet, int child) {
    //TODO T25560658
  }

  @ReactMethod
  public void completeRoot(int rootTag, int childSet) {
    //TODO T25560658
  }

  @Override
  public String getName() {
    return NAME;
  }
}
