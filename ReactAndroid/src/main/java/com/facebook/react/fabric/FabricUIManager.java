/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static android.view.View.MeasureSpec.AT_MOST;
import static android.view.View.MeasureSpec.EXACTLY;
import static android.view.View.MeasureSpec.UNSPECIFIED;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import android.util.Log;
import android.view.View;
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.yoga.YogaDirection;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * This class is responsible to create, clone and update {@link ReactShadowNode} using the Fabric
 * API.
 */
@SuppressWarnings("unused") // used from JNI
@DoNotStrip
public class FabricUIManager implements UIManager, JSHandler {

  private static final String TAG = FabricUIManager.class.getSimpleName();
  private static final boolean DEBUG = true;

  private final RootShadowNodeRegistry mRootShadowNodeRegistry = new RootShadowNodeRegistry();
  private final ReactApplicationContext mReactApplicationContext;
  private final ViewManagerRegistry mViewManagerRegistry;
  private final UIViewOperationQueue mUIViewOperationQueue;
  private final NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final JavaScriptContextHolder mJSContext;
  private volatile int mCurrentBatch = 0;
  private final FabricReconciler mFabricReconciler;
  private final EventDispatcher mEventDispatcher;
  private FabricBinding mBinding;
  private final FabricEventEmitter mFabricEventEmitter;
  private long mEventHandlerPointer;

  public FabricUIManager(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      JavaScriptContextHolder jsContext,
      EventDispatcher eventDispatcher) {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext);
    mReactApplicationContext = reactContext;
    mViewManagerRegistry = viewManagerRegistry;
    mNativeViewHierarchyManager = new NativeViewHierarchyManager(viewManagerRegistry);
    mUIViewOperationQueue =
        new UIViewOperationQueue(
            reactContext, mNativeViewHierarchyManager, 0);
    mFabricReconciler = new FabricReconciler(mUIViewOperationQueue);
    mFabricEventEmitter =
      new FabricEventEmitter(mReactApplicationContext, this);
    mEventDispatcher = eventDispatcher;
    mJSContext = jsContext;
  }

  public void setBinding(FabricBinding binding) {
    mBinding = binding;
  }

  /** Creates a new {@link ReactShadowNode} */
  @Nullable
  @DoNotStrip
  public ReactShadowNode createNode(
      int reactTag, String viewName, int rootTag, ReadableNativeMap props, long instanceHandle) {
    if (DEBUG) {
      Log.d(TAG, "createNode \n\ttag: " + reactTag +
          "\n\tviewName: " + viewName +
          "\n\trootTag: " + rootTag +
          "\n\tprops: " + props);
    }
    try {
      ViewManager viewManager = mViewManagerRegistry.get(viewName);
      ReactShadowNode node = viewManager.createShadowNodeInstance(mReactApplicationContext);
      ReactShadowNode rootNode = getRootNode(rootTag);
      node.setRootTag(rootNode.getReactTag());
      node.setViewClassName(viewName);
      node.setInstanceHandle(instanceHandle);
      node.setReactTag(reactTag);
      node.setThemedContext(rootNode.getThemedContext());

      ReactStylesDiffMap styles = updateProps(node, props);

      if (!node.isVirtual()) {
        mUIViewOperationQueue.enqueueCreateView(
            rootNode.getThemedContext(), reactTag, viewName, styles);
      }
      return node;
    } catch (Throwable t) {
      handleException(getRootNode(rootTag), t);
      return null;
    }
  }

  @VisibleForTesting
  ReactShadowNode getRootNode(int rootTag) {
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
   *     ReactShadowNode will contain a copy of all the internal data of the original node,
   *     including its children set (note that the children nodes will not be cloned).
   */
  @Nullable
  @DoNotStrip
  public ReactShadowNode cloneNode(ReactShadowNode node, long instanceHandle) {
    if (DEBUG) {
      Log.d(TAG, "cloneNode \n\tnode: " + node);
    }
    try {
      ReactShadowNode clone = node.mutableCopy(instanceHandle);
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     children set will be empty.
   */
  @Nullable
  @DoNotStrip
  public ReactShadowNode cloneNodeWithNewChildren(ReactShadowNode node, long instanceHandle) {
    if (DEBUG) {
      Log.d(TAG, "cloneNodeWithNewChildren \n\tnode: " + node);
    }
    try {
      ReactShadowNode clone = node.mutableCopyWithNewChildren(instanceHandle);
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @Nullable
  @DoNotStrip
  public ReactShadowNode cloneNodeWithNewProps(
      ReactShadowNode node, @Nullable ReadableNativeMap newProps, long instanceHandle) {
    if (DEBUG) {
      Log.d(TAG, "cloneNodeWithNewProps \n\tnode: " + node + "\n\tprops: " + newProps);
    }
    try {
      ReactShadowNode clone = node.mutableCopyWithNewProps(instanceHandle,
            newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     props will be overridden with the {@link ReadableMap} received by parameter and its
   *     children set will be empty.
   */
  @Nullable
  @DoNotStrip
  public ReactShadowNode cloneNodeWithNewChildrenAndProps(
      ReactShadowNode node, ReadableNativeMap newProps, long instanceHandle) {
    if (DEBUG) {
      Log.d(TAG, "cloneNodeWithNewChildrenAndProps \n\tnode: " + node + "\n\tnewProps: " + newProps);
    }
    try {
      ReactShadowNode clone =
          node.mutableCopyWithNewChildrenAndProps(instanceHandle,
              newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  private void assertReactShadowNodeCopy(ReactShadowNode source, ReactShadowNode target) {
    Assertions.assertCondition(
        source.getClass().equals(target.getClass()),
        "Found "
            + target.getClass()
            + " class when expecting: "
            + source.getClass()
            + ". Check that "
            + source.getClass()
            + " implements the copy() method correctly.");
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent {@link
   * ReactShadowNode}.
   */
  @Nullable
  @DoNotStrip
  public void appendChild(ReactShadowNode parent, ReactShadowNode child) {
    if (DEBUG) {
      Log.d(TAG, "appendChild \n\tparent: " + parent + "\n\tchild: " + child);
    }
    try {
      // If the child to append is shared with another tree (child.getParent() != null),
      // then we add a mutation of it. In the future this will be performed by FabricJS / Fiber.
      //TODO: T27926878 avoid cloning shared child
      if (child.getParent() != null) {
        child = child.mutableCopy(child.getInstanceHandle());
      }
      parent.addChildAt(child, parent.getChildCount());
    } catch (Throwable t) {
      handleException(parent, t);
    }
  }

  /**
   * @return an empty {@link List<ReactShadowNode>} that will be used to append the {@link
   *     ReactShadowNode} elements of the root. Typically this List will contain one element.
   */
  @DoNotStrip
  public List<ReactShadowNode> createChildSet(int rootTag) {
    if (DEBUG) {
      Log.d(TAG, "createChildSet rootTag: " + rootTag);
    }
    return new ArrayList<>(1);
  }

  /**
   * Adds the {@link ReactShadowNode} to the {@link List<ReactShadowNode>} received by parameter.
   */
  @DoNotStrip
  public void appendChildToSet(List<ReactShadowNode> childList, ReactShadowNode child) {
    childList.add(child);
  }

  @DoNotStrip
  public synchronized void completeRoot(int rootTag, @Nullable List<ReactShadowNode> childList) {
    try {
      childList = childList == null ? new LinkedList<ReactShadowNode>() : childList;
      if (DEBUG) {
        Log.d(TAG, "completeRoot rootTag: " + rootTag + ", childList: " + childList);
      }
      ReactShadowNode currentRootShadowNode = getRootNode(rootTag);
      Assertions.assertNotNull(
          currentRootShadowNode,
          "Root view with tag " + rootTag + " must be added before completeRoot is called");

      currentRootShadowNode = calculateDiffingAndCreateNewRootNode(currentRootShadowNode, childList);

      if (DEBUG) {
        Log.d(
          TAG,
          "ReactShadowNodeHierarchy after diffing: " + currentRootShadowNode.getHierarchyInfo());
      }

      applyUpdatesRecursive(currentRootShadowNode, 0, 0);
      mUIViewOperationQueue.dispatchViewUpdates(
        mCurrentBatch++, System.currentTimeMillis(), System.currentTimeMillis());

      mRootShadowNodeRegistry.replaceNode(currentRootShadowNode);
    } catch (Exception e) {
      handleException(getRootNode(rootTag), e);
    }
  }

  public void dispatchCommand(int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    mUIViewOperationQueue.enqueueDispatchCommand(reactTag, commandId, commandArgs);
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

  private ReactShadowNode calculateDiffingAndCreateNewRootNode(
    ReactShadowNode currentRootShadowNode, List<ReactShadowNode> newChildList) {
    ReactShadowNode newRootShadowNode = currentRootShadowNode.mutableCopyWithNewChildren(currentRootShadowNode.getInstanceHandle());
    for (ReactShadowNode child : newChildList) {
      appendChild(newRootShadowNode, child);
    }

    if (DEBUG) {
      Log.d(
        TAG,
        "ReactShadowNodeHierarchy before calculateLayout: " + newRootShadowNode.getHierarchyInfo());
    }

    notifyOnBeforeLayoutRecursive(newRootShadowNode);
    newRootShadowNode.calculateLayout();

    if (DEBUG) {
      Log.d(
        TAG,
        "ReactShadowNodeHierarchy after calculateLayout: " + newRootShadowNode.getHierarchyInfo());
    }

    mFabricReconciler.manageChildren(currentRootShadowNode, newRootShadowNode);
    return newRootShadowNode;
  }

  private void applyUpdatesRecursive(ReactShadowNode node, float absoluteX, float absoluteY) {
    if (!node.hasUpdates()) {
      return;
    }

    if (!node.isVirtualAnchor()) {
      for (int i = 0; i < node.getChildCount(); i++) {
        applyUpdatesRecursive(
            node.getChildAt(i),
            absoluteX + node.getLayoutX(),
            absoluteY + node.getLayoutY());
      }
    }

    int tag = node.getReactTag();
    if (mRootShadowNodeRegistry.getNode(tag) == null) {
      boolean frameDidChange =
          node.dispatchUpdates(absoluteX, absoluteY, mUIViewOperationQueue, null);
      // Notify JS about layout event if requested
      // and if the position or dimensions actually changed
      // (consistent with iOS and Android Default implementation).
      if (frameDidChange && node.shouldNotifyOnLayout()) {
        mUIViewOperationQueue.enqueueOnLayoutEvent(tag,
          node.getScreenX(),
          node.getScreenY(),
          node.getScreenWidth(),
          node.getScreenHeight());
      }
    }

    // Set the reference to the OriginalReactShadowNode to NULL, as the tree is already committed
    // and we do not need to hold references to the previous tree anymore
    node.setOriginalReactShadowNode(null);
    node.markUpdateSeen();
  }

  @Override
  @DoNotStrip
  public <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(
      final T rootView) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ThemedReactContext themedRootContext =
        new ThemedReactContext(mReactApplicationContext, rootView.getContext());

    ReactShadowNode rootShadowNode = createRootShadowNode(rootTag, themedRootContext);

    int widthMeasureSpec = rootView.getWidthMeasureSpec();
    int heightMeasureSpec = rootView.getHeightMeasureSpec();
    updateRootView(rootShadowNode, widthMeasureSpec, heightMeasureSpec);

    rootView.setOnSizeChangedListener(
      new SizeMonitoringFrameLayout.OnSizeChangedListener() {
        @Override
        public void onSizeChanged(final int width, final int height, int oldW, int oldH) {
          updateRootSize(rootTag, width, height);
        }
      });

    mRootShadowNodeRegistry.registerNode(rootShadowNode);
    mUIViewOperationQueue.addRootView(rootTag, rootView, themedRootContext);
    return rootTag;
  }

  @Override
  @DoNotStrip
  public void updateRootLayoutSpecs(int rootViewTag, int widthMeasureSpec, int heightMeasureSpec) {
    ReactShadowNode rootNode = mRootShadowNodeRegistry.getNode(rootViewTag);
    if (rootNode == null) {
      Log.w(ReactConstants.TAG, "Tried to update non-existent root tag: " + rootViewTag);
      return;
    }
    updateRootView(rootNode, widthMeasureSpec, heightMeasureSpec);
  }

  /**
   * Updates the root view size and re-render the RN surface.
   *
   * //TODO: change synchronization to integrate with new #render loop.
   */
  private synchronized void updateRootSize(int rootTag, int newWidth, int newHeight) {
    ReactShadowNode rootNode = mRootShadowNodeRegistry.getNode(rootTag);
    if (rootNode == null) {
      Log.w(
        ReactConstants.TAG,
        "Tried to update size of non-existent tag: " + rootTag);
      return;
    }
    int newWidthSpec = View.MeasureSpec.makeMeasureSpec(newWidth, View.MeasureSpec.EXACTLY);
    int newHeightSpec = View.MeasureSpec.makeMeasureSpec(newHeight, View.MeasureSpec.EXACTLY);
    updateRootView(rootNode, newWidthSpec, newHeightSpec);

    completeRoot(rootTag, rootNode.getChildrenList());
  }

  public void removeRootView(int rootTag) {
    mRootShadowNodeRegistry.removeNode(rootTag);
  }

  private ReactShadowNode createRootShadowNode(int rootTag, ThemedReactContext themedReactContext) {
    ReactShadowNode rootNode = new ReactShadowNodeImpl();
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    if (sharedI18nUtilInstance.isRTL(themedReactContext)) {
      rootNode.setLayoutDirection(YogaDirection.RTL);
    }
    rootNode.setViewClassName("Root");
    rootNode.setReactTag(rootTag);
    rootNode.setThemedContext(themedReactContext);
    return rootNode;
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  private void updateRootView(
      ReactShadowNode node, int widthMeasureSpec, int heightMeasureSpec) {
    int widthMode = View.MeasureSpec.getMode(widthMeasureSpec);
    int widthSize = View.MeasureSpec.getSize(widthMeasureSpec);
    switch (widthMode) {
      case EXACTLY:
        node.setStyleWidth(widthSize);
        break;
      case AT_MOST:
        node.setStyleMaxWidth(widthSize);
        break;
      case UNSPECIFIED:
        node.setStyleWidthAuto();
        break;
    }

    int heightMode = View.MeasureSpec.getMode(heightMeasureSpec);
    int heightSize = View.MeasureSpec.getSize(heightMeasureSpec);
    switch (heightMode) {
      case EXACTLY:
        node.setStyleHeight(heightSize);
        break;
      case AT_MOST:
        node.setStyleMaxHeight(heightSize);
        break;
      case UNSPECIFIED:
        node.setStyleHeightAuto();
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

  @Nullable
  @DoNotStrip
  public long createEventTarget(int reactTag) {
    long instanceHandle = mNativeViewHierarchyManager.getInstanceHandle(reactTag);
    long context = mJSContext.get();
    long eventTarget = mBinding.createEventTarget(context, instanceHandle);
    if (DEBUG) {
      Log.d(
        TAG,
        "Created EventTarget: " + eventTarget + " for tag: " + reactTag + " with instanceHandle: " + instanceHandle);
    }
    return eventTarget;
  }

  @DoNotStrip
  public void registerEventHandler(long eventHandlerPointer) {
    mEventHandlerPointer = eventHandlerPointer;
  }

  @DoNotStrip
  public void releaseEventTarget(long eventTargetPointer) {
    mBinding.releaseEventTarget(mJSContext.get(), eventTargetPointer);
  }

  @DoNotStrip
  public void releaseEventHandler(long eventHandlerPointer) {
    mBinding.releaseEventHandler(mJSContext.get(), eventHandlerPointer);
  }

  @Override
  @DoNotStrip
  public void invoke(long eventTarget, String name, WritableMap params) {
    if (DEBUG) {
      Log.d(
        TAG,
        "Dispatching event for target: " + eventTarget);
    }
    mBinding.dispatchEventToTarget(mJSContext.get(), mEventHandlerPointer, eventTarget, name, (WritableNativeMap) params);
  }

  @Override
  public void initialize() {
    FabricEventEmitter eventEmitter =
      new FabricEventEmitter(mReactApplicationContext, this);
    mEventDispatcher.registerEventEmitter(FABRIC, mFabricEventEmitter);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mBinding.releaseEventHandler(mJSContext.get(), mEventHandlerPointer);
    mEventDispatcher.unregisterEventEmitter(FABRIC);
    mFabricEventEmitter.close();
  }

}
