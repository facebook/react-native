// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
package com.facebook.react.fabric;

import static org.fest.assertions.api.Assertions.assertThat;
import static com.facebook.react.bridge.InstanceHandleHelper.randomInstanceHandle;
import static org.mockito.Mockito.mock;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.views.progressbar.ProgressBarShadowNode;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactRawTextShadowNode;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.view.ReactViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.fest.assertions.data.Offset;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;


/** Tests {@link FabricUIManager} */
@RunWith(RobolectricTestRunner.class)
public class FabricUIManagerTest {

  private FabricUIManager mFabricUIManager;
  private ThemedReactContext mThemedReactContext;
  private int mNextReactTag;

  @Before
  public void setUp() throws Exception {
    mNextReactTag = 2;
    ReactApplicationContext reactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance());
    mThemedReactContext = new ThemedReactContext(reactContext, reactContext);

    List<ViewManager> viewManagers =
        Arrays.<ViewManager>asList(
            new ReactViewManager(), new ReactTextViewManager(), new ReactRawTextManager());
    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagers);
    JavaScriptContextHolder jsContext = mock(JavaScriptContextHolder.class);
    mFabricUIManager = new FabricUIManager(reactContext, viewManagerRegistry, jsContext);
  }

  @Test
  public void testCreateNode() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    int reactTag = mNextReactTag++;
    String viewClass = ReactViewManager.REACT_CLASS;
    ReactShadowNode node =
        mFabricUIManager.createNode(reactTag, viewClass, rootTag, null, randomInstanceHandle());

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
    ReactShadowNode node =
        mFabricUIManager.createNode(reactTag, viewClass, rootTag, null, randomInstanceHandle());

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

    ReactShadowNode clonedNode = mFabricUIManager.cloneNode(node, 0);

    assertThat(clonedNode).isNotSameAs(node);
    assertThat(clonedNode.getOriginalReactShadowNode()).isSameAs(node);
    assertSameFields(clonedNode, node);
    assertSameChildren(clonedNode, node);
    assertThat(clonedNode.getChildAt(0)).isEqualTo(child);
  }


  @Test
  public void testCloneWithInstanceHandle() {
    ReactShadowNode node = createViewNode();

    long oldInstanceHandle = node.getInstanceHandle();
    long newInstanceHandle = oldInstanceHandle + 1;
    ReactShadowNode clonedNode = mFabricUIManager.cloneNode(node, newInstanceHandle);

    assertThat(clonedNode).isNotSameAs(node);
    assertThat(clonedNode.getInstanceHandle()).isSameAs(newInstanceHandle);
    assertThat(node.getInstanceHandle()).isSameAs(oldInstanceHandle);
  }


  @Test
  public void testDefaultSpacingCloning() {
    ReactShadowNode node = createViewNode();
    node.setDefaultPadding(Spacing.LEFT, 10);

    ReactShadowNode clonedNode = mFabricUIManager.cloneNode(node, 0);

    node.setDefaultPadding(Spacing.LEFT, 20);
    assertThat(clonedNode.getStylePadding(Spacing.LEFT).value).isEqualTo(10f, Offset.offset(0.01f));
    assertThat(node.getStylePadding(Spacing.LEFT).value).isEqualTo(20f, Offset.offset(0.01f));
  }

  @Test
  public void testCloneVirtualNode() {
    ReactRawTextShadowNode node = new ReactRawTextShadowNode();
    node.setText("test");
    assertThat(node.isVirtual()).isTrue();

    ReactRawTextShadowNode clonedNode = (ReactRawTextShadowNode) node.mutableCopy(randomInstanceHandle());

    assertThat(clonedNode.getText()).isEqualTo("test");
    assertThat(clonedNode).isNotEqualTo(node);
  }

  @Test
  public void testLayoutProgressBarAfterClonning() {
    ProgressBarShadowNode node = new ProgressBarShadowNode();
    node.setThemedContext(mThemedReactContext);
    ProgressBarShadowNode clone = (ProgressBarShadowNode) node.mutableCopy(randomInstanceHandle());
    clone.calculateLayout();
  }

  @Test
  public void testCloneNodeWithNewChildren() {
    ReactShadowNode node = createViewNode();
    ReactShadowNode child = createViewNode();
    node.addChildAt(child, 0);

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewChildren(node, randomInstanceHandle());

    assertThat(clonedNode.getChildCount()).isZero();
    assertSameFields(clonedNode, node);
  }

  @Test
  public void testCloneNodeWithNewProps() {
    ReactShadowNode node = createViewNode();
    ReadableNativeMap props = null; // TODO(ayc): Figure out how to create a Native map from tests.

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewProps(node, props, randomInstanceHandle());
  }

  @Test
  public void testCloneNodeWithNewChildrenAndProps() {
    ReactShadowNode node = createViewNode();
    ReadableNativeMap props = null;

    ReactShadowNode clonedNode = mFabricUIManager.cloneNodeWithNewChildrenAndProps(node, props, randomInstanceHandle());

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
   * Tests that cloned text nodes will not share measure functions
   */
  @Test
  public void testTextMutableClone() {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = mFabricUIManager.addRootView(rootView);
    ReactShadowNode text =
        mFabricUIManager.createNode(0, ReactTextViewManager.REACT_CLASS, rootTag, null, randomInstanceHandle());
    assertThat(text.isMeasureDefined()).isTrue();

    ReactShadowNode textCopy = text.mutableCopy(randomInstanceHandle());
    assertThat(textCopy.isMeasureDefined()).isTrue();

    textCopy.setStyleWidth(200);
    text.onBeforeLayout();
    text.calculateLayout();
    textCopy.onBeforeLayout();
    textCopy.calculateLayout();

    assertThat(text.getLayoutWidth()).isNotEqualTo(textCopy.getLayoutWidth());
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

    ReactShadowNode aa = mFabricUIManager.createNode(2, viewClass, rootTag, null, randomInstanceHandle());
    ReactShadowNode a = mFabricUIManager.createNode(3, viewClass, rootTag, null, randomInstanceHandle());
    mFabricUIManager.appendChild(a, aa);
    ReactShadowNode bb = mFabricUIManager.createNode(4, viewClass, rootTag, null, randomInstanceHandle());
    ReactShadowNode b = mFabricUIManager.createNode(5, viewClass, rootTag, null, randomInstanceHandle());
    mFabricUIManager.appendChild(b, bb);
    ReactShadowNode container = mFabricUIManager.createNode(6, viewClass, rootTag, null, randomInstanceHandle());
    mFabricUIManager.appendChild(container, a);
    mFabricUIManager.appendChild(container, b);
    List<ReactShadowNode> childSet = mFabricUIManager.createChildSet(rootTag);
    mFabricUIManager.appendChildToSet(childSet, container);
    mFabricUIManager.completeRoot(rootTag, childSet);

    ReactShadowNode aaClone = mFabricUIManager.cloneNodeWithNewProps(aa, null, 0);
    ReactShadowNode aClone = mFabricUIManager.cloneNodeWithNewChildren(a, 0);
    mFabricUIManager.appendChild(aClone, aaClone);
    ReactShadowNode containerClone = mFabricUIManager.cloneNodeWithNewChildren(container, 0);
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
}
