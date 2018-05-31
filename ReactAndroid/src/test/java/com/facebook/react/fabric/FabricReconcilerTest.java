// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
package com.facebook.react.fabric;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewAtIndex;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/** Tests {@link FabricReconciler} */
@RunWith(RobolectricTestRunner.class)
public class FabricReconcilerTest {

  private FabricReconciler mFabricReconciler;
  private FabricUIManager mFabricUIManager;
  private MockUIViewOperationQueue mMockUIViewOperationQueue;

  @Before
  public void setUp() {
    CatalystInstance catalystInstance = ReactTestHelper.createMockCatalystInstance();
    ReactApplicationContext reactContext =
        new ReactApplicationContext(RuntimeEnvironment.application);
    reactContext.initializeWithInstance(catalystInstance);
    List<ViewManager> viewManagers = new ArrayList<>();
    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagers);
    JavaScriptContextHolder jsContext = mock(JavaScriptContextHolder.class);
    mFabricUIManager = new FabricUIManager(reactContext, viewManagerRegistry, jsContext);
    mMockUIViewOperationQueue = new MockUIViewOperationQueue(reactContext);
    mFabricReconciler = new FabricReconciler(mMockUIViewOperationQueue);
  }

  @Test
  public void testSimpleHierarchy() {
    ReactShadowNode parent = createNode(0);
    ReactShadowNode child1 = createNode(1);
    ReactShadowNode child2 = createNode(2);
    addChildren(parent, child1, child2);

    ReactShadowNode parentCloned = createNode(0);
    ReactShadowNode child3 = createNode(3);
    addChildren(parentCloned, child3, child2);

    mFabricReconciler.manageChildren(parent, parentCloned);

    List<ManageChildrenOperation> expectedOperations = new ArrayList<>();
    expectedOperations.add(
        new ManageChildrenOperation(
            0,
            new int[] {0, 1},
            new ViewAtIndex[] {new ViewAtIndex(3, 0), new ViewAtIndex(2, 1)},
            new int[] {1}));
    assertThat(mMockUIViewOperationQueue.getOperations()).isEqualTo(expectedOperations);
  }

  @Test
  public void testVirtualNodes() {
    ReactShadowNode parent = createNode(0);
    ReactShadowNode child1 = createVirtualNode(1);
    ReactShadowNode child2 = createVirtualNode(2);
    ReactShadowNode child3 = createVirtualNode(3);
    addChildren(parent, child1, child2, child3);

    ReactShadowNode parentCloned = createNode(0);
    ReactShadowNode child4 = createVirtualNode(4);
    addChildren(parentCloned, child1, child4, child3);

    mFabricReconciler.manageChildren(parent, parentCloned);

    List<ManageChildrenOperation> expectedOperations = new ArrayList<>();
    assertThat(mMockUIViewOperationQueue.getOperations()).isEqualTo(expectedOperations);
  }

  private void addChildren(ReactShadowNode parent, ReactShadowNode... children) {
    for (ReactShadowNode child : children) {
      mFabricUIManager.appendChild(parent, child);
    }
  }

  private static ReactShadowNode createNode(int tag) {
    return createNode(tag, false);
  }

  private static ReactShadowNode createVirtualNode(int tag) {
    return createNode(tag, true);
  }

  private static ReactShadowNode createNode(int tag, boolean virtual) {
    ReactShadowNode node;
    if (virtual) {
      node = new VirtualReactShadowNode();
    } else {
      node = new ReactShadowNodeImpl();
    }
    node.setReactTag(tag);
    node.setViewClassName("View");
    node.setThemedContext(mock(ThemedReactContext.class));
    return node;
  }

  private static class VirtualReactShadowNode extends ReactShadowNodeImpl {

    VirtualReactShadowNode() {}

    VirtualReactShadowNode(VirtualReactShadowNode original) {
      super(original);
    }

    @Override
    public boolean isVirtual() {
      return true;
    }

    @Override
    public ReactShadowNodeImpl copy() {
      return new VirtualReactShadowNode(this);
    }
  }

  private static class ManageChildrenOperation {
    private int mTag;
    private int[] mIndicesToRemove;
    private ViewAtIndex[] mViewsToAdd;
    private int[] mTagsToRemove;

    private ManageChildrenOperation(
        int tag, int[] indicesToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToRemove) {
      mTag = tag;
      mIndicesToRemove = indicesToRemove;
      mViewsToAdd = viewsToAdd;
      mTagsToRemove = tagsToRemove;
    }

    @Override
    public boolean equals(Object obj) {
      if (obj == null || obj.getClass() != getClass()) {
        return false;
      }
      ManageChildrenOperation op = (ManageChildrenOperation) obj;
      return mTag == op.mTag
          && Arrays.equals(mIndicesToRemove, op.mIndicesToRemove)
          && Arrays.equals(mViewsToAdd, op.mViewsToAdd)
          && Arrays.equals(mTagsToRemove, op.mTagsToRemove);
    }

    @Override
    public int hashCode() {
      return Arrays.deepHashCode(new Object[] {mTag, mIndicesToRemove, mViewsToAdd, mTagsToRemove});
    }

    @Override
    public String toString() {
      return "ManageChildrenOperation \n\tindicesToRemove: "
          + Arrays.toString(mIndicesToRemove)
          + "\n\tviewsToAdd: "
          + Arrays.toString(mViewsToAdd)
          + "\n\ttagsToRemove: "
          + Arrays.toString(mTagsToRemove);
    }
  }

  private static class MockUIViewOperationQueue extends UIViewOperationQueue {

    private List<ManageChildrenOperation> mOperations;

    private MockUIViewOperationQueue(ReactApplicationContext context) {
      super(context, mock(NativeViewHierarchyManager.class), 0);
      mOperations = new ArrayList<>();
    }

    @Override
    public void enqueueManageChildren(
        int reactTag, int[] indicesToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToDelete) {
      mOperations.add(
          new ManageChildrenOperation(reactTag, indicesToRemove, viewsToAdd, tagsToDelete));
    }

    public List<ManageChildrenOperation> getOperations() {
      return Collections.unmodifiableList(mOperations);
    }
  }
}
