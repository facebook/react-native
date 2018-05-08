/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import com.facebook.react.ReactRootView;
import com.facebook.react.animation.Animation;
import com.facebook.react.animation.AnimationPropertyUpdater;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactRawTextShadowNode;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/**
 * Tests for {@link UIManagerModule}.
 */
@PrepareForTest({Arguments.class, ReactChoreographer.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class UIManagerModuleTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ReactApplicationContext mReactContext;
  private CatalystInstance mCatalystInstanceMock;
  private ArrayList<ChoreographerCompat.FrameCallback> mPendingFrameCallbacks;

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class, ReactChoreographer.class);

    ReactChoreographer choreographerMock = mock(ReactChoreographer.class);
    PowerMockito.when(Arguments.createArray()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyArray();
      }
    });
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });
    PowerMockito.when(ReactChoreographer.getInstance()).thenReturn(choreographerMock);

    mPendingFrameCallbacks = new ArrayList<>();
    doAnswer(new Answer() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        mPendingFrameCallbacks
            .add((ChoreographerCompat.FrameCallback) invocation.getArguments()[1]);
        return null;
      }
    }).when(choreographerMock).postFrameCallback(
        any(ReactChoreographer.CallbackType.class),
        any(ChoreographerCompat.FrameCallback.class));

    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mReactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mReactContext.initializeWithInstance(mCatalystInstanceMock);

    UIManagerModule uiManagerModuleMock = mock(UIManagerModule.class);
    when(mCatalystInstanceMock.getNativeModule(UIManagerModule.class))
        .thenReturn(uiManagerModuleMock);
  }

  @Test
  public void testCreateSimpleHierarchy() {
    UIManagerModule uiManager = getUIManagerModule();

    ViewGroup rootView = createSimpleTextHierarchy(uiManager, "Some text");

    assertThat(rootView.getChildCount()).isEqualTo(1);

    View firstChild = rootView.getChildAt(0);
    assertThat(firstChild).isInstanceOf(TextView.class);
    assertThat(((TextView) firstChild).getText().toString()).isEqualTo("Some text");
  }

  @Test
  public void testUpdateSimpleHierarchy() {
    UIManagerModule uiManager = getUIManagerModule();

    ViewGroup rootView = createSimpleTextHierarchy(uiManager, "Some text");
    TextView textView = (TextView) rootView.getChildAt(0);

    int rawTextTag = 3;
    uiManager.updateView(
        rawTextTag,
        ReactRawTextManager.REACT_CLASS,
        JavaOnlyMap.of(ReactRawTextShadowNode.PROP_TEXT, "New text"));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(textView.getText().toString()).isEqualTo("New text");
  }

  @Test
  public void testHierarchyWithView() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = uiManager.addRootView(rootView);
    int viewTag = rootTag + 1;
    int subViewTag = viewTag + 1;

    uiManager.createView(
        viewTag,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        subViewTag,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));

    uiManager.manageChildren(
        viewTag,
        null,
        null,
        JavaOnlyArray.of(subViewTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.manageChildren(
        rootTag,
        null,
        null,
        JavaOnlyArray.of(viewTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(rootView.getChildCount()).isEqualTo(1);

    ViewGroup child = (ViewGroup) rootView.getChildAt(0);
    assertThat(child.getChildCount()).isEqualTo(1);

    ViewGroup grandchild = (ViewGroup) child.getChildAt(0);
    assertThat(grandchild).isInstanceOf(ViewGroup.class);
    assertThat(grandchild.getChildCount()).isEqualTo(0);
  }

  @Test
  public void testMoveViews() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(1);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(2);
    View expectedViewAt2 = hierarchy.nativeRootView.getChildAt(0);
    View expectedViewAt3 = hierarchy.nativeRootView.getChildAt(3);

    uiManager.manageChildren(
        hierarchy.rootView,
        JavaOnlyArray.of(1, 0, 2),
        JavaOnlyArray.of(0, 2, 1),
        null,
        null,
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertChildrenAreExactly(
        hierarchy.nativeRootView,
        expectedViewAt0,
        expectedViewAt1,
        expectedViewAt2,
        expectedViewAt3);
  }

  @Test
  public void testDeleteViews() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(1);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(2);

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        null,
        null,
        JavaOnlyArray.of(0, 3));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertChildrenAreExactly(
        hierarchy.nativeRootView,
        expectedViewAt0,
        expectedViewAt1);
  }

  @Test
  public void testMoveAndDeleteViews() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(0);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(3);
    View expectedViewAt2 = hierarchy.nativeRootView.getChildAt(2);

    uiManager.manageChildren(
        hierarchy.rootView,
        JavaOnlyArray.of(3),
        JavaOnlyArray.of(1),
        null,
        null,
        JavaOnlyArray.of(1));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertChildrenAreExactly(
        hierarchy.nativeRootView,
        expectedViewAt0,
        expectedViewAt1,
        expectedViewAt2);
  }

  @Test(expected = IllegalViewOperationException.class)
  public void testMoveAndDeleteRemoveViewsDuplicateRemove() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    uiManager.manageChildren(
        hierarchy.rootView,
        JavaOnlyArray.of(3),
        JavaOnlyArray.of(1),
        null,
        null,
        JavaOnlyArray.of(3));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();
  }

  @Test(expected = IllegalViewOperationException.class)
  public void testDuplicateRemove() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        null,
        null,
        JavaOnlyArray.of(3, 3));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();
  }

  @Test
  public void testMoveAndAddViews() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    int textViewTag = 1000;
    uiManager.createView(
        textViewTag,
        ReactTextViewManager.REACT_CLASS,
        hierarchy.rootView,
        JavaOnlyMap.of("collapsable", false));

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(0);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(3);
    View expectedViewAt3 = hierarchy.nativeRootView.getChildAt(1);
    View expectedViewAt4 = hierarchy.nativeRootView.getChildAt(2);

    uiManager.manageChildren(
        hierarchy.rootView,
        JavaOnlyArray.of(1, 2, 3),
        JavaOnlyArray.of(3, 4, 1),
        JavaOnlyArray.of(textViewTag),
        JavaOnlyArray.of(2),
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(hierarchy.nativeRootView.getChildCount()).isEqualTo(5);
    assertThat(hierarchy.nativeRootView.getChildAt(0)).isEqualTo(expectedViewAt0);
    assertThat(hierarchy.nativeRootView.getChildAt(1)).isEqualTo(expectedViewAt1);
    assertThat(hierarchy.nativeRootView.getChildAt(3)).isEqualTo(expectedViewAt3);
    assertThat(hierarchy.nativeRootView.getChildAt(4)).isEqualTo(expectedViewAt4);
  }

  @Test
  public void testMoveViewsWithChildren() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(0);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(2);
    View expectedViewAt2 = hierarchy.nativeRootView.getChildAt(1);
    View expectedViewAt3 = hierarchy.nativeRootView.getChildAt(3);

    uiManager.manageChildren(
        hierarchy.rootView,
        JavaOnlyArray.of(1, 2),
        JavaOnlyArray.of(2, 1),
        null,
        null,
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertChildrenAreExactly(
        hierarchy.nativeRootView,
        expectedViewAt0,
        expectedViewAt1,
        expectedViewAt2,
        expectedViewAt3);
    assertThat(((ViewGroup) hierarchy.nativeRootView.getChildAt(2)).getChildCount()).isEqualTo(2);
  }

  @Test
  public void testDeleteViewsWithChildren() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View expectedViewAt0 = hierarchy.nativeRootView.getChildAt(0);
    View expectedViewAt1 = hierarchy.nativeRootView.getChildAt(2);
    View expectedViewAt2 = hierarchy.nativeRootView.getChildAt(3);

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        null,
        null,
        JavaOnlyArray.of(1));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertChildrenAreExactly(
        hierarchy.nativeRootView,
        expectedViewAt0,
        expectedViewAt1,
        expectedViewAt2);
  }

  @Test
  public void testLayoutAppliedToNodes() throws Exception {
    UIManagerModule uiManager = getUIManagerModule();

    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    int newViewTag = 10000;
    uiManager.createView(
        newViewTag,
        ReactViewManager.REACT_CLASS,
        hierarchy.rootView,
        JavaOnlyMap
            .of("left", 10.0, "top", 20.0, "width", 30.0, "height", 40.0, "collapsable", false));

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        JavaOnlyArray.of(newViewTag),
        JavaOnlyArray.of(4),
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    View newView = hierarchy.nativeRootView.getChildAt(4);
    assertThat(newView.getLeft()).isEqualTo(10);
    assertThat(newView.getTop()).isEqualTo(20);

    assertThat(newView.getWidth()).isEqualTo(30);
    assertThat(newView.getHeight()).isEqualTo(40);
  }

  /**
   * This is to make sure we execute enqueued operations in the order given by JS.
   */
  @Test
  public void testAddUpdateRemoveInSingleBatch() {
    UIManagerModule uiManager = getUIManagerModule();

    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    int newViewTag = 10000;
    uiManager.createView(
        newViewTag,
        ReactViewManager.REACT_CLASS,
        hierarchy.rootView,
        JavaOnlyMap.of("collapsable", false));

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        JavaOnlyArray.of(newViewTag),
        JavaOnlyArray.of(4),
        null);

    uiManager.updateView(
        newViewTag,
        ReactViewManager.REACT_CLASS,
        JavaOnlyMap.of("backgroundColor", Color.RED));

    uiManager.manageChildren(
        hierarchy.rootView,
        null,
        null,
        null,
        null,
        JavaOnlyArray.of(4));

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(hierarchy.nativeRootView.getChildCount()).isEqualTo(4);
  }

  @Test
  public void testTagsAssignment() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    View view0 = hierarchy.nativeRootView.getChildAt(0);
    assertThat(view0.getId()).isEqualTo(hierarchy.view0);

    View viewWithChildren1 = hierarchy.nativeRootView.getChildAt(1);
    assertThat(viewWithChildren1.getId()).isEqualTo(hierarchy.viewWithChildren1);

    View childView0 = ((ViewGroup) viewWithChildren1).getChildAt(0);
    assertThat(childView0.getId()).isEqualTo(hierarchy.childView0);

    View childView1 = ((ViewGroup) viewWithChildren1).getChildAt(1);
    assertThat(childView1.getId()).isEqualTo(hierarchy.childView1);

    View view2 = hierarchy.nativeRootView.getChildAt(2);
    assertThat(view2.getId()).isEqualTo(hierarchy.view2);

    View view3 = hierarchy.nativeRootView.getChildAt(3);
    assertThat(view3.getId()).isEqualTo(hierarchy.view3);
  }

  @Test
  public void testLayoutPropertyUpdatingOnlyOnLayoutChange() {
    UIManagerModule uiManager = getUIManagerModule();

    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    // Update layout to some values, this way we can verify it hasn't been updated, because the
    // update process would normally reset it back to some non-negative value
    View view0 = hierarchy.nativeRootView.getChildAt(0);
    view0.layout(1, 2, 3, 4);

    // verify that X get updated when we update layout properties
    uiManager.updateView(
        hierarchy.view0,
        ReactViewManager.REACT_CLASS,
        JavaOnlyMap.of("left", 10.0, "top", 20.0, "width", 30.0, "height", 40.0));
    uiManager.onBatchComplete();
    executePendingFrameCallbacks();
    assertThat(view0.getLeft()).isGreaterThan(2);

    // verify that the layout doesn't get updated when we update style property not affecting the
    // position (e.g., background-color)
    view0.layout(1, 2, 3, 4);
    uiManager.updateView(
        hierarchy.view0,
        ReactViewManager.REACT_CLASS,
        JavaOnlyMap.of("backgroundColor", Color.RED));
    uiManager.onBatchComplete();
    executePendingFrameCallbacks();
    assertThat(view0.getLeft()).isEqualTo(1);
  }

  private static class AnimationStub extends Animation {

    public AnimationStub(int animationID, AnimationPropertyUpdater propertyUpdater) {
      super(animationID, propertyUpdater);
    }

    @Override
    public void run() {
    }
  }

  @Test
  public void testAddAndRemoveAnimation() {
    UIManagerModule uiManagerModule = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManagerModule);

    AnimationPropertyUpdater mockPropertyUpdater = mock(AnimationPropertyUpdater.class);
    Animation mockAnimation = spy(new AnimationStub(1000, mockPropertyUpdater));
    Callback callbackMock = mock(Callback.class);

    int rootTag = hierarchy.rootView;
    uiManagerModule.createView(
        hierarchy.rootView,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));

    uiManagerModule.registerAnimation(mockAnimation);
    uiManagerModule.addAnimation(hierarchy.rootView, 1000, callbackMock);
    uiManagerModule.removeAnimation(hierarchy.rootView, 1000);

    uiManagerModule.onBatchComplete();
    executePendingFrameCallbacks();

    verify(callbackMock, times(1)).invoke(false);
    verify(mockAnimation).run();
    verify(mockAnimation).cancel();
  }

  /**
   * Makes sure replaceExistingNonRootView by replacing a view with a new view that has a background
   * color set.
   */
  @Test
  public void testReplaceExistingNonRootView() {
    UIManagerModule uiManager = getUIManagerModule();
    TestMoveDeleteHierarchy hierarchy = createMoveDeleteHierarchy(uiManager);

    int newViewTag = 1234;
    uiManager.createView(
        newViewTag,
        ReactViewManager.REACT_CLASS,
        hierarchy.rootView,
        JavaOnlyMap.of("backgroundColor", Color.RED));

    uiManager.replaceExistingNonRootView(hierarchy.view2, newViewTag);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(hierarchy.nativeRootView.getChildCount()).isEqualTo(4);
    assertThat(hierarchy.nativeRootView.getChildAt(2)).isInstanceOf(ReactViewGroup.class);
    ReactViewGroup view = (ReactViewGroup) hierarchy.nativeRootView.getChildAt(2);
    assertThat(view.getBackgroundColor()).isEqualTo(Color.RED);
  }

  /**
   * Verifies removeSubviewsFromContainerWithID works by adding subviews, removing them, and
   * checking that the final number of children is correct.
   */
  @Test
  public void testRemoveSubviewsFromContainerWithID() {
    UIManagerModule uiManager = getUIManagerModule();
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = uiManager.addRootView(rootView);

    final int containerTag = rootTag + 1;
    final int containerSiblingTag = containerTag + 1;

    uiManager.createView(
        containerTag,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        containerSiblingTag,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    addChild(uiManager, rootTag, containerTag, 0);
    addChild(uiManager, rootTag, containerSiblingTag, 1);

    uiManager.createView(
        containerTag + 2,
        ReactTextViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        containerTag + 3,
        ReactTextViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    addChild(uiManager, containerTag, containerTag + 2, 0);
    addChild(uiManager, containerTag, containerTag + 3, 1);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(rootView.getChildCount()).isEqualTo(2);
    assertThat(((ViewGroup) rootView.getChildAt(0)).getChildCount()).isEqualTo(2);

    uiManager.removeSubviewsFromContainerWithID(containerTag);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    assertThat(rootView.getChildCount()).isEqualTo(2);
    assertThat(((ViewGroup) rootView.getChildAt(0)).getChildCount()).isEqualTo(0);
  }

  /**
   * Assuming no other views have been created, the root view will have tag 1, Text tag 2, and
   * RawText tag 3.
   */
  private ViewGroup createSimpleTextHierarchy(UIManagerModule uiManager, String text) {
    ReactRootView rootView =
        new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    int rootTag = uiManager.addRootView(rootView);
    int textTag = rootTag + 1;
    int rawTextTag = textTag + 1;

    uiManager.createView(
        textTag,
        ReactTextViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        rawTextTag,
        ReactRawTextManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of(ReactRawTextShadowNode.PROP_TEXT, text, "collapsable", false));

    uiManager.manageChildren(
        textTag,
        null,
        null,
        JavaOnlyArray.of(rawTextTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.manageChildren(
        rootTag,
        null,
        null,
        JavaOnlyArray.of(textTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    return rootView;
  }

  private TestMoveDeleteHierarchy createMoveDeleteHierarchy(UIManagerModule uiManager) {
    ReactRootView rootView = new ReactRootView(mReactContext);
    int rootTag = uiManager.addRootView(rootView);

    TestMoveDeleteHierarchy hierarchy = new TestMoveDeleteHierarchy(rootView, rootTag);

    uiManager.createView(
        hierarchy.view0,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        hierarchy.viewWithChildren1,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        hierarchy.view2,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        hierarchy.view3,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        hierarchy.childView0,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));
    uiManager.createView(
        hierarchy.childView1,
        ReactViewManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of("collapsable", false));

    addChild(uiManager, rootTag, hierarchy.view0, 0);
    addChild(uiManager, rootTag, hierarchy.viewWithChildren1, 1);
    addChild(uiManager, rootTag, hierarchy.view2, 2);
    addChild(uiManager, rootTag, hierarchy.view3, 3);

    addChild(uiManager, hierarchy.viewWithChildren1, hierarchy.childView0, 0);
    addChild(uiManager, hierarchy.viewWithChildren1, hierarchy.childView1, 1);

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    return hierarchy;
  }

  private void addChild(UIManagerModule uiManager, int parentTag, int childTag, int index) {
    uiManager.manageChildren(
        parentTag,
        null,
        null,
        JavaOnlyArray.of(childTag),
        JavaOnlyArray.of(index),
        null);
  }

  private void assertChildrenAreExactly(ViewGroup parent, View... views) {
    assertThat(parent.getChildCount()).isEqualTo(views.length);
    for (int i = 0; i < views.length; i++) {
      assertThat(parent.getChildAt(i))
          .describedAs("View at " + i)
          .isEqualTo(views[i]);
    }
  }

  /**
   * Holder for the tags that represent that represent views in the following hierarchy:
   *  - View rootView
   *    - View view0
   *    - View viewWithChildren1
   *      - View childView0
   *      - View childView1
   *    - View view2
   *    - View view3
   *
   * This hierarchy is used to test move/delete functionality in manageChildren.
   */
  private static class TestMoveDeleteHierarchy {

    public ReactRootView nativeRootView;
    public int rootView;
    public int view0;
    public int viewWithChildren1;
    public int view2;
    public int view3;
    public int childView0;
    public int childView1;

    public TestMoveDeleteHierarchy(ReactRootView nativeRootView, int rootViewTag) {
      this.nativeRootView = nativeRootView;
      rootView = rootViewTag;
      view0 = rootView + 1;
      viewWithChildren1 = rootView + 2;
      view2 = rootView + 3;
      view3 = rootView + 4;
      childView0 = rootView + 5;
      childView1 = rootView + 6;
    }
  }

  private void executePendingFrameCallbacks() {
    ArrayList<ChoreographerCompat.FrameCallback> callbacks =
        new ArrayList<>(mPendingFrameCallbacks);
    mPendingFrameCallbacks.clear();
    for (ChoreographerCompat.FrameCallback frameCallback : callbacks) {
      frameCallback.doFrame(0);
    }
  }

  private UIManagerModule getUIManagerModule() {
    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager(),
        new ReactTextViewManager(),
        new ReactRawTextManager());
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, new UIImplementationProvider(), 0);
    uiManagerModule.onHostResume();
    return uiManagerModule;
  }
}
