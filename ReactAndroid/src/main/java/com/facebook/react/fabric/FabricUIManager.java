// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import static android.view.View.MeasureSpec.AT_MOST;
import static android.view.View.MeasureSpec.EXACTLY;
import static android.view.View.MeasureSpec.UNSPECIFIED;

import android.util.Log;
import android.view.View;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewAtIndex;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * This class is responsible to create, clone and update {@link ReactShadowNode} using the
 * Fabric API.
 */
@SuppressWarnings("unused") // used from JNI
public class FabricUIManager implements UIManager {

  private static final String TAG = FabricUIManager.class.toString();
  private final RootShadowNodeRegistry mRootShadowNodeRegistry = new RootShadowNodeRegistry();
  private final ReactApplicationContext mReactApplicationContext;
  private final ViewManagerRegistry mViewManagerRegistry;
  private final UIViewOperationQueue mUIViewOperationQueue;

  public FabricUIManager(ReactApplicationContext reactContext,
    ViewManagerRegistry viewManagerRegistry) {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext);
    mReactApplicationContext = reactContext;
    mViewManagerRegistry = viewManagerRegistry;
    mUIViewOperationQueue = new UIViewOperationQueue(reactContext, new NativeViewHierarchyManager(viewManagerRegistry), 0);
  }

  /**
   * Creates a new {@link ReactShadowNode}
   */
  @Nullable
  public ReactShadowNode createNode(int reactTag,
    String viewName,
    int rootTag,
    ReadableNativeMap props) {
    try {
      ViewManager viewManager = mViewManagerRegistry.get(viewName);
      ReactShadowNode node = viewManager.createShadowNodeInstance(mReactApplicationContext);
      ReactShadowNode rootNode = getRootNode(rootTag);
      node.setRootNode(rootNode);
      node.setViewClassName(viewName);
      node.setReactTag(reactTag);
      node.setThemedContext(rootNode.getThemedContext());

      ReactStylesDiffMap styles = updateProps(node, props);

      if (!node.isVirtual()) {
        mUIViewOperationQueue
          .enqueueCreateView(rootNode.getThemedContext(), reactTag, viewName, styles);
      }
      return node;
    } catch (Throwable t) {
      handleException(getRootNode(rootTag), t);
      return null;
    }
  }

  private ReactShadowNode getRootNode(int rootTag) {
    return mRootShadowNodeRegistry.getNode(rootTag);
  }

  private ReactStylesDiffMap updateProps(ReactShadowNode node, @Nullable ReadableNativeMap props) {
    ReactStylesDiffMap styles = null;
    if (props != null) {
      styles = new ReactStylesDiffMap(props);
      node.updateProperties(styles);
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
    try {
      ReactShadowNode clone = node.mutableCopy();
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but
   * its children set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildren(ReactShadowNode node) {
    try {
      ReactShadowNode clone = node.mutableCopyWithNewChildren();
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   * ReactShadowNode will contain a copy of all the internal data of the original node, but its
   * props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewProps(
      ReactShadowNode node,
      @Nullable ReadableNativeMap newProps) {
    try {
      ReactShadowNode clone = node.mutableCopyWithNewProps(newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
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
      ReadableNativeMap newProps) {
    try {
      ReactShadowNode clone = node.mutableCopyWithNewChildrenAndProps(newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  private void assertReactShadowNodeCopy(ReactShadowNode source, ReactShadowNode target) {
    Assertions.assertCondition(source.getClass().equals(target.getClass()),
      "Found " + target.getClass() + " class when expecting: " +   source.getClass() +
        ". Check that " + source.getClass() + " implements the mutableCopy() method correctly.");
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent
   * {@link ReactShadowNode}.
   */
  @Nullable
  public void appendChild(ReactShadowNode parent, ReactShadowNode child) {
    try {
      int childIndex = parent.getChildCount();
      parent.addChildAt(child, childIndex);
      ViewAtIndex[] viewsToAdd =
        new ViewAtIndex[]{new ViewAtIndex(child.getReactTag(), childIndex)};
      if (!child.isVirtual()) {
        mUIViewOperationQueue.enqueueManageChildren(
          parent.getReactTag(),
          null,
          viewsToAdd,
          null
        );
      }
    } catch (Throwable t) {
      handleException(parent, t);
    }
  }

  /**
   * @return an empty {@link List<ReactShadowNode>} that will be used to append the
   * {@link ReactShadowNode} elements of the root. Typically this List will contain one element.
   */
  public List<ReactShadowNode> createChildSet(int rootTag) {
    return new ArrayList<>(1);
  }

  /**
   * Adds the {@link ReactShadowNode} to the {@link List<ReactShadowNode>} received by parameter.
   */
  public void appendChildToSet(List<ReactShadowNode> childList, ReactShadowNode child) {
    childList.add(child);
  }

  public void completeRoot(int rootTag, List<ReactShadowNode> childList) {
    try {
      ReactShadowNode rootNode = getRootNode(rootTag);
      Assertions.assertNotNull(
        rootNode,
        "Root view with tag " + rootTag + " must be added before completeRoot is called");
      for (int i = 0; i < childList.size(); i++) {
        ReactShadowNode child = childList.get(i);
        appendChild(rootNode, child);
      }

      notifyOnBeforeLayoutRecursive(rootNode);
      calculateRootLayout(rootNode);
      applyUpdatesRecursive(rootNode, 0, 0);
      mUIViewOperationQueue
        .dispatchViewUpdates(1, System.currentTimeMillis(), System.currentTimeMillis());
    } catch (Exception e) {
      handleException(getRootNode(rootTag), e);
    }
  }

  private void notifyOnBeforeLayoutRecursive(ReactShadowNode node) {
    if (!node.hasUpdates()) {
      return;
    }
    for (int i = 0; i < node.getChildCount(); i++) {
      notifyOnBeforeLayoutRecursive(node.getChildAt(i));
    }
    node.onBeforeLayout();
  }

  private void calculateRootLayout(ReactShadowNode cssRoot) {
    cssRoot.calculateLayout();
  }

  private void applyUpdatesRecursive(
    ReactShadowNode cssNode,
    float absoluteX,
    float absoluteY) {

    if (!cssNode.hasUpdates()) {
      return;
    }

    if (!cssNode.isVirtualAnchor()) {
      for (int i = 0; i < cssNode.getChildCount(); i++) {
        applyUpdatesRecursive(
          cssNode.getChildAt(i),
          absoluteX + cssNode.getLayoutX(),
          absoluteY + cssNode.getLayoutY());
      }
    }

    int tag = cssNode.getReactTag();
    if (mRootShadowNodeRegistry.getNode(tag) == null) {
      boolean frameDidChange = cssNode.dispatchUpdates(
        absoluteX,
        absoluteY,
        mUIViewOperationQueue,
        null);
    }
    cssNode.markUpdateSeen();
  }

  @Override
  public <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(
    final T rootView) {
    int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ThemedReactContext themedRootContext = new ThemedReactContext(
      mReactApplicationContext,
      rootView.getContext());

    ReactShadowNode rootShadowNode = createRootShadowNode(rootTag, themedRootContext);

    int widthMeasureSpec = rootView.getWidthMeasureSpec();
    int heightMeasureSpec = rootView.getHeightMeasureSpec();
    updateRootView(rootShadowNode, widthMeasureSpec, heightMeasureSpec);

    mRootShadowNodeRegistry.addNode(rootShadowNode);
    mUIViewOperationQueue.addRootView(rootTag, rootView, themedRootContext);
    return rootTag;
  }

  public void removeRootView(int rootTag) {
    mRootShadowNodeRegistry.removeNode(rootTag);
  }

  private ReactShadowNode createRootShadowNode(int rootTag, ThemedReactContext themedReactContext) {
    ReactShadowNode rootNode = new ReactShadowNodeImpl();
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    // TODO: setLayoutDirection for the rootNode
    rootNode.setViewClassName("Root");
    rootNode.setReactTag(rootTag);
    rootNode.setThemedContext(themedReactContext);
    return rootNode;
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(
    ReactShadowNode rootCSSNode, int widthMeasureSpec, int heightMeasureSpec) {
    int widthMode = View.MeasureSpec.getMode(widthMeasureSpec);
    int widthSize = View.MeasureSpec.getSize(widthMeasureSpec);
    switch (widthMode) {
      case EXACTLY:
        rootCSSNode.setStyleWidth(widthSize);
        break;
      case AT_MOST:
        rootCSSNode.setStyleMaxWidth(widthSize);
        break;
      case UNSPECIFIED:
        rootCSSNode.setStyleWidthAuto();
        break;
    }

    int heightMode = View.MeasureSpec.getMode(heightMeasureSpec);
    int heightSize = View.MeasureSpec.getSize(heightMeasureSpec);
    switch (heightMode) {
      case EXACTLY:
        rootCSSNode.setStyleHeight(heightSize);
        break;
      case AT_MOST:
        rootCSSNode.setStyleMaxHeight(heightSize);
        break;
      case UNSPECIFIED:
        rootCSSNode.setStyleHeightAuto();
        break;
    }
  }

  private void handleException(ReactShadowNode node, Throwable t) {
    try {
      ThemedReactContext context = node.getThemedContext();
      // TODO move exception management to JNI side, and refactor to avoid wrapping Throwable into
      // a RuntimeException
      context.handleException(new RuntimeException(t));
    } catch (Exception ex) {
      Log.e(TAG, "Exception while executing a Fabric method", t);
      throw new RuntimeException(ex.getMessage(), t);
    }
  }

}
