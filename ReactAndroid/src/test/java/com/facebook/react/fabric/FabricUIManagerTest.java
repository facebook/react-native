// Copyright 2004-present Facebook. All Rights Reserved.
package com.facebook.react.fabric;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.common.ClearableSynchronizedPool;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactYogaConfigProvider;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.YogaNodePool;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactRawTextShadowNode;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.testing.robolectric.v3.WithTestDefaultsRunner;
import com.facebook.yoga.YogaConfig;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RuntimeEnvironment;

/** Tests {@link FabricUIManager} */
@PrepareForTest({YogaNodePool.class, ReactYogaConfigProvider.class})
@RunWith(WithTestDefaultsRunner.class)
public class FabricUIManagerTest {

  private FabricUIManager mFabricUIManager;
  private ThemedReactContext mThemedReactContext;
  private int mNextReactTag;
  private MockYogaNodePool mMockYogaNodePool;

  private YogaMeasureFunction mLastYogaMeasureFunction;

  @Before
  public void setUp() throws Exception {
    mNextReactTag = 2;
    mThemedReactContext = mock(ThemedReactContext.class);
    CatalystInstance catalystInstance = ReactTestHelper.createMockCatalystInstance();
    ReactApplicationContext reactContext =
        new ReactApplicationContext(RuntimeEnvironment.application);
    reactContext.initializeWithInstance(catalystInstance);
    List<ViewManager> viewManagers =
        Arrays.<ViewManager>asList(
            new ReactViewManager(), new ReactTextViewManager(), new ReactRawTextManager());
    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagers);

    mFabricUIManager = new FabricUIManager(reactContext, viewManagerRegistry);

    // Hack around Yoga until the UnsatisfiedLinkErrors are fixed t14964130
    PowerMockito.mockStatic(YogaNodePool.class, ReactYogaConfigProvider.class);
    mMockYogaNodePool = new MockYogaNodePool();
    PowerMockito.when(YogaNodePool.get()).thenReturn(mMockYogaNodePool);
    PowerMockito.when(ReactYogaConfigProvider.get())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return mock(YogaConfig.class);
              }
            });
  }

  @Test
  public void testCreateNode() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    int reactTag = mNextReactTag++;
    String viewClass = ReactViewManager.REACT_CLASS;
    ReactShadowNode node = mFabricUIManager.createNode(reactTag, viewClass, rootTag, null);

    assertThat(reactTag).isEqualTo(node.getReactTag());
    assertThat(viewClass).isEqualTo(node.getViewClass());
    assertThat(rootTag).isEqualTo(rootTag);
  }

  @Test
  public void testCreateMultpleRootViews() {
    createAndRenderRootView();
    createAndRenderRootView();
  }

  private int createAndRenderRootView() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    int reactTag = mNextReactTag++;
    String viewClass = ReactViewManager.REACT_CLASS;
    ReactShadowNode node = mFabricUIManager.createNode(reactTag, viewClass, rootTag, null);

    List<ReactShadowNode> childSet = mFabricUIManager.createChildSet(rootTag);
    mFabricUIManager.appendChildToSet(childSet, node);
    mFabricUIManager.completeRoot(rootTag, childSet);

    return rootTag;
  }

  @Test
  public void testCloneNode() {
    ReactShadowNode node = createViewNode();
    ReactShadowNode child = createViewNode();
    node.addChildAt(child, 0);

    ReactShadowNode clonedNode = mFabricUIManager.cloneNode(node);

    assertThat(clonedNode).isNotSameAs(node);
    assertThat(clonedNode.getOriginalReactShadowNode()).isSameAs(node);
    assertSameFields(clonedNode, node);
    assertSameChildren(clonedNode, node);
    assertThat(clonedNode.getChildAt(0)).isEqualTo(child);
  }

  @Test
  public void testCloneVirtualNode() {
    ReactRawTextShadowNode node = new ReactRawTextShadowNode();
    node.setText("test");
    assertThat(node.isVirtual()).isTrue();

    ReactRawTextShadowNode clonedNode = (ReactRawTextShadowNode) node.mutableCopy();

    assertThat(clonedNode.getText()).isEqualTo("test");
    assertThat(clonedNode).isNotEqualTo(node);
  }

  @Test
  public void testCloneNodeWithNewChildren() {
    ReactShadowNode node = createViewNode();
    ReactShadowNode child = createViewNode();
    node.addChildAt(child, 0);

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewChildren(node);

    assertThat(clonedNode.getChildCount()).isZero();
    assertSameFields(clonedNode, node);
  }

  @Test
  public void testCloneNodeWithNewProps() {
    ReactShadowNode node = createViewNode();
    ReadableNativeMap props = null; // TODO(ayc): Figure out how to create a Native map from tests.

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewProps(node, props);
  }

  @Test
  public void testCloneNodeWithNewChildrenAndProps() {
    ReactShadowNode node = createViewNode();
    ReadableNativeMap props = null;

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewChildrenAndProps(node, props);

    assertThat(clonedNode.getChildCount()).isZero();
  }

  @Test
  public void testAppendChild() {
    ReactShadowNode node = createViewNode();
    ReactShadowNode child = createViewNode();

    mFabricUIManager.appendChild(node, child);

    assertThat(node.getChildCount()).isEqualTo(1);
    assertThat(node.getChildAt(0)).isEqualTo(child);
  }

  @Test
  public void testCreateChildSet() {
    List<ReactShadowNode> childSet = mFabricUIManager.createChildSet(0);

    assertThat(childSet).isEmpty();
  }

  @Test
  public void testAppendChildToSet() {
    ReactShadowNode node = createViewNode();
    List<ReactShadowNode> childSet = mFabricUIManager.createChildSet(0);

    mFabricUIManager.appendChildToSet(childSet, node);

    assertThat(childSet).hasSize(1);
    assertThat(childSet).contains(node);
  }

  @Test(expected = AssertionError.class)
  public void testCompleteRootBeforeAddRoot() {
    mFabricUIManager.completeRoot(0, new ArrayList<ReactShadowNode>());
  }

  @Test
  public void testCompleteRoot() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    List<ReactShadowNode> children = mFabricUIManager.createChildSet(rootTag);

    mFabricUIManager.completeRoot(rootTag, children);
  }

  /**
   * Tests that cloned text nodes will reassign their yoga nodes' measure functions.
   *
   * <p>TODO(T26729515): Currently this tests the wrong implementation. It assumes that yoga nodes
   * are reused across clones and simply checks the most recently assigned measure functions of the
   * shared yoga node. When yoga node cloning is implemented, this needs to be changed to mock each
   * cloned shadow nodes' yoga nodes and make the same assertions on each of their measure
   * functions.
   */
  @Test
  public void testTextMutableClone() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);

    final YogaNode yogaNode = mock(YogaNode.class);

    doAnswer(
            new Answer() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                when(yogaNode.isMeasureDefined()).thenReturn(true);
                when(yogaNode.clone()).thenReturn(yogaNode);
                when(yogaNode.cloneWithNewChildren()).thenReturn(yogaNode);
                mLastYogaMeasureFunction = (YogaMeasureFunction) invocation.getArguments()[0];
                return null;
              }
            })
        .when(yogaNode)
        .setMeasureFunction(any(YogaMeasureFunction.class));

    mMockYogaNodePool.add(yogaNode);

    ReactShadowNode text =
        mFabricUIManager.createNode(0, ReactTextViewManager.REACT_CLASS, rootTag, null);
    YogaMeasureFunction textMeasureFunction = mLastYogaMeasureFunction;
    assertThat(text.isMeasureDefined()).isTrue();

    ReactShadowNode textCopy = text.mutableCopy();
    YogaMeasureFunction textCopyMeasureFunction = mLastYogaMeasureFunction;
    assertThat(textCopy.isMeasureDefined()).isTrue();
    assertThat(textCopyMeasureFunction).isNotSameAs(textMeasureFunction);

    ReactShadowNode textCopyWithNewChildren = text.mutableCopyWithNewChildren();
    YogaMeasureFunction textCopyWithNewChildrenMeasureFunction = mLastYogaMeasureFunction;
    assertThat(textCopyWithNewChildren.isMeasureDefined()).isTrue();
    assertThat(textCopyWithNewChildrenMeasureFunction).isNotSameAs(textMeasureFunction);
    assertThat(textCopyWithNewChildrenMeasureFunction).isNotSameAs(textCopyMeasureFunction);
  }

  /**
   * Verifies that the reconciliation phase will always set the originalNode field of every node in
   * the tree to null once completeRoot has finished to prevent memory leaks.
   */
  @Test
  public void testRemoveOriginalNodeReferences() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    String viewClass = ReactViewManager.REACT_CLASS;

    ReactShadowNode aa = mFabricUIManager.createNode(2, viewClass, rootTag, null);
    ReactShadowNode a = mFabricUIManager.createNode(3, viewClass, rootTag, null);
    mFabricUIManager.appendChild(a, aa);
    ReactShadowNode bb = mFabricUIManager.createNode(4, viewClass, rootTag, null);
    ReactShadowNode b = mFabricUIManager.createNode(5, viewClass, rootTag, null);
    mFabricUIManager.appendChild(b, bb);
    ReactShadowNode container = mFabricUIManager.createNode(6, viewClass, rootTag, null);
    mFabricUIManager.appendChild(container, a);
    mFabricUIManager.appendChild(container, b);
    List<ReactShadowNode> childSet = mFabricUIManager.createChildSet(rootTag);
    mFabricUIManager.appendChildToSet(childSet, container);
    mFabricUIManager.completeRoot(rootTag, childSet);

    ReactShadowNode aaClone = mFabricUIManager.cloneNodeWithNewProps(aa, null);
    ReactShadowNode aClone = mFabricUIManager.cloneNodeWithNewChildren(a);
    mFabricUIManager.appendChild(aClone, aaClone);
    ReactShadowNode containerClone = mFabricUIManager.cloneNodeWithNewChildren(container);
    mFabricUIManager.appendChild(containerClone, b);
    mFabricUIManager.appendChild(containerClone, aClone);
    List<ReactShadowNode> childSet2 = mFabricUIManager.createChildSet(rootTag);
    mFabricUIManager.appendChildToSet(childSet2, containerClone);
    mFabricUIManager.completeRoot(rootTag, childSet2);

    ReactShadowNode[] nodes =
        new ReactShadowNode[] {aa, a, bb, b, container, aaClone, aClone, containerClone};

    for (ReactShadowNode node : nodes) {
      assertThat(node.getOriginalReactShadowNode()).isNull();
    }
  }

  private void assertSameChildren(ReactShadowNode node1, ReactShadowNode node2) {
    assertThat(node1.getChildCount()).isEqualTo(node2.getChildCount());
    for (int i = 0; i < node1.getChildCount(); i++) {
      assertThat(node1.getChildAt(i)).isEqualTo(node2.getChildAt(i));
    }
  }

  private void assertSameFields(ReactShadowNode node1, ReactShadowNode node2) {
    assertThat(node1.getReactTag()).isEqualTo(node2.getReactTag());
    assertThat(node1.getViewClass()).isEqualTo(node2.getViewClass());
    assertThat(node2.getParent()).isNull();
    assertThat(node1.getThemedContext()).isEqualTo(node2.getThemedContext());
    assertThat(node1.isVirtual()).isEqualTo(node2.isVirtual());
    assertThat(node1.getLayoutDirection()).isEqualTo(node2.getLayoutDirection());
    assertThat(node1.getLayoutHeight()).isEqualTo(node2.getLayoutHeight());
    assertThat(node1.getLayoutWidth()).isEqualTo(node2.getLayoutWidth());
    assertThat(node1.getLayoutX()).isEqualTo(node2.getLayoutX());
    assertThat(node1.getLayoutY()).isEqualTo(node2.getLayoutY());
    for (int spacingType = Spacing.LEFT; spacingType <= Spacing.ALL; spacingType++) {
      assertThat(node1.getPadding(spacingType)).isEqualTo(node2.getPadding(spacingType));
      assertThat(node1.getStylePadding(spacingType)).isEqualTo(node2.getStylePadding(spacingType));
    }
    assertThat(node1.getStyleWidth()).isEqualTo(node2.getStyleWidth());
    assertThat(node1.getStyleHeight()).isEqualTo(node2.getStyleHeight());
  }

  private ReactShadowNode createViewNode() {
    ReactShadowNode node = new ReactShadowNodeImpl();
    node.setViewClassName(ReactViewManager.REACT_CLASS);
    node.setThemedContext(mThemedReactContext);
    return node;
  }

  private static class MockYogaNodePool extends ClearableSynchronizedPool<YogaNode> {

    private List<YogaNode> mMockYogaNodes;

    public MockYogaNodePool() {
      super(1024);
      mMockYogaNodes = new LinkedList<>();
    }

    public void add(YogaNode... nodes) {
      Collections.addAll(mMockYogaNodes, nodes);
    }

    @Override
    public synchronized YogaNode acquire() {
      if (!mMockYogaNodes.isEmpty()) {
        return mMockYogaNodes.remove(0);
      }
      return createMockYogaNode();
    }

    private static YogaNode createMockYogaNode() {
      final YogaNode yogaNode = mock(YogaNode.class);
      when(yogaNode.clone()).thenReturn(yogaNode);
      when(yogaNode.cloneWithNewChildren()).thenReturn(yogaNode);
      doAnswer(
              new Answer() {
                @Override
                public Object answer(InvocationOnMock invocation) {
                  when(yogaNode.isMeasureDefined()).thenReturn(true);
                  return null;
                }
              })
          .when(yogaNode)
          .setMeasureFunction(any(YogaMeasureFunction.class));
      return yogaNode;
    }
  }
}
