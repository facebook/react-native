// Copyright 2004-present Facebook. All Rights Reserved.
package com.facebook.react.fabric;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.powermock.api.mockito.PowerMockito.mockStatic;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.ClearableSynchronizedPool;
import com.facebook.react.fabric.FabricReconciler;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactYogaConfigProvider;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewAtIndex;
import com.facebook.react.uimanager.YogaNodePool;
import com.facebook.testing.robolectric.v3.WithTestDefaultsRunner;
import com.facebook.yoga.YogaConfig;
import com.facebook.yoga.YogaNode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RuntimeEnvironment;

/** Tests {@link FabricReconciler} */
@PrepareForTest({
  ReactChoreographer.class,
  ReactYogaConfigProvider.class,
  YogaNodePool.class,
})
@RunWith(WithTestDefaultsRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class FabricReconcilerTest {

  private FabricReconciler mFabricReconciler;
  private MockUIViewOperationQueue mMockUIViewOperationQueue;

  @Before
  public void setUp() {
    ReactApplicationContext reactContext =
        new ReactApplicationContext(RuntimeEnvironment.application);
    mMockUIViewOperationQueue = new MockUIViewOperationQueue(reactContext);
    mFabricReconciler = new FabricReconciler(mMockUIViewOperationQueue);

    setupHacks();
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
    return node;
  }

  private static class VirtualReactShadowNode extends ReactShadowNodeImpl {

    @Override
    public boolean isVirtual() {
      return true;
    }
  }

  private static void addChildren(ReactShadowNode parent, ReactShadowNode... children) {
    for (ReactShadowNode child : children) {
      parent.addChildAt(child, parent.getChildCount());
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

  /** Hacks to get tests to start working end to end */
  private void setupHacks() {
    // Hack around Yoga by mocking it out until the UnsatisfiedLinkErrors are fixed t14964130
    mockStatic(YogaNodePool.class, ReactYogaConfigProvider.class);
    PowerMockito.when(YogaNodePool.get())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Exception {
                ClearableSynchronizedPool<YogaNode> yogaPool =
                    mock(ClearableSynchronizedPool.class);
                YogaNode yogaNode = mock(YogaNode.class);
                when(yogaNode.clone()).thenReturn(mock(YogaNode.class));
                when(yogaNode.isMeasureDefined()).thenReturn(true);
                when(yogaPool.acquire()).thenReturn(yogaNode);
                return yogaPool;
              }
            });
    PowerMockito.when(ReactYogaConfigProvider.get())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return mock(YogaConfig.class);
              }
            });
  }
}
