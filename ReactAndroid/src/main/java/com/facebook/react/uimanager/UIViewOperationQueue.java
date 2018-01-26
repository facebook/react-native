/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.os.SystemClock;
import com.facebook.common.logging.FLog;
import com.facebook.react.animation.Animation;
import com.facebook.react.animation.AnimationRegistry;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;
import javax.annotation.concurrent.GuardedBy;

/**
 * This class acts as a buffer for command executed on {@link NativeViewHierarchyManager} or on
 * {@link AnimationRegistry}. It expose similar methods as mentioned classes but instead of
 * executing commands immediately it enqueues those operations in a queue that is then flushed from
 * {@link UIManagerModule} once JS batch of ui operations is finished. This is to make sure that we
 * execute all the JS operation coming from a single batch a single loop of the main (UI) android
 * looper.
 *
 * TODO(7135923): Pooling of operation objects
 * TODO(5694019): Consider a better data structure for operations queue to save on allocations
 */
public class UIViewOperationQueue {

  public static final int DEFAULT_MIN_TIME_LEFT_IN_FRAME_FOR_NONBATCHED_OPERATION_MS = 8;

  private final int[] mMeasureBuffer = new int[4];

  /**
   * A mutation or animation operation on the view hierarchy.
   */
  public interface UIOperation {

    void execute();
  }

  /**
   * A spec for an operation on the native View hierarchy.
   */
  private abstract class ViewOperation implements UIOperation {

    public int mTag;

    public ViewOperation(int tag) {
      mTag = tag;
    }
  }

  private final class RemoveRootViewOperation extends ViewOperation {

    public RemoveRootViewOperation(int tag) {
      super(tag);
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.removeRootView(mTag);
    }
  }

  private final class UpdatePropertiesOperation extends ViewOperation {

    private final ReactStylesDiffMap mProps;

    private UpdatePropertiesOperation(int tag, ReactStylesDiffMap props) {
      super(tag);
      mProps = props;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateProperties(mTag, mProps);
    }
  }

  /**
   * Operation for updating native view's position and size. The operation is not created directly
   * by a {@link UIManagerModule} call from JS. Instead it gets inflated using computed position
   * and size values by CSSNodeDEPRECATED hierarchy.
   */
  private final class UpdateLayoutOperation extends ViewOperation {

    private final int mParentTag, mX, mY, mWidth, mHeight;

    public UpdateLayoutOperation(
        int parentTag,
        int tag,
        int x,
        int y,
        int width,
        int height) {
      super(tag);
      mParentTag = parentTag;
      mX = x;
      mY = y;
      mWidth = width;
      mHeight = height;
      Systrace.startAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "updateLayout", mTag);
    }

    @Override
    public void execute() {
      Systrace.endAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "updateLayout", mTag);
      mNativeViewHierarchyManager.updateLayout(mParentTag, mTag, mX, mY, mWidth, mHeight);
    }
  }

  private final class CreateViewOperation extends ViewOperation {

    private final ThemedReactContext mThemedContext;
    private final String mClassName;
    private final @Nullable ReactStylesDiffMap mInitialProps;

    public CreateViewOperation(
        ThemedReactContext themedContext,
        int tag,
        String className,
        @Nullable ReactStylesDiffMap initialProps) {
      super(tag);
      mThemedContext = themedContext;
      mClassName = className;
      mInitialProps = initialProps;
      Systrace.startAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "createView", mTag);
    }

    @Override
    public void execute() {
      Systrace.endAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "createView", mTag);
      mNativeViewHierarchyManager.createView(
          mThemedContext,
          mTag,
          mClassName,
          mInitialProps);
    }
  }

  private final class ManageChildrenOperation extends ViewOperation {

    private final @Nullable int[] mIndicesToRemove;
    private final @Nullable ViewAtIndex[] mViewsToAdd;
    private final @Nullable int[] mTagsToDelete;

    public ManageChildrenOperation(
        int tag,
        @Nullable int[] indicesToRemove,
        @Nullable ViewAtIndex[] viewsToAdd,
        @Nullable int[] tagsToDelete) {
      super(tag);
      mIndicesToRemove = indicesToRemove;
      mViewsToAdd = viewsToAdd;
      mTagsToDelete = tagsToDelete;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.manageChildren(
          mTag,
          mIndicesToRemove,
          mViewsToAdd,
          mTagsToDelete);
    }
  }

  private final class SetChildrenOperation extends ViewOperation {

    private final ReadableArray mChildrenTags;

    public SetChildrenOperation(
      int tag,
      ReadableArray childrenTags) {
      super(tag);
      mChildrenTags = childrenTags;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.setChildren(
        mTag,
        mChildrenTags);
    }
  }

  private final class UpdateViewExtraData extends ViewOperation {

    private final Object mExtraData;

    public UpdateViewExtraData(int tag, Object extraData) {
      super(tag);
      mExtraData = extraData;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateViewExtraData(mTag, mExtraData);
    }
  }

  private final class ChangeJSResponderOperation extends ViewOperation {

    private final int mInitialTag;
    private final boolean mBlockNativeResponder;
    private final boolean mClearResponder;

    public ChangeJSResponderOperation(
        int tag,
        int initialTag,
        boolean clearResponder,
        boolean blockNativeResponder) {
      super(tag);
      mInitialTag = initialTag;
      mClearResponder = clearResponder;
      mBlockNativeResponder = blockNativeResponder;
    }

    @Override
    public void execute() {
      if (!mClearResponder) {
        mNativeViewHierarchyManager.setJSResponder(mTag, mInitialTag, mBlockNativeResponder);
      } else {
        mNativeViewHierarchyManager.clearJSResponder();
      }
    }
  }

  private final class DispatchCommandOperation extends ViewOperation {

    private final int mCommand;
    private final @Nullable ReadableArray mArgs;

    public DispatchCommandOperation(int tag, int command, @Nullable ReadableArray args) {
      super(tag);
      mCommand = command;
      mArgs = args;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.dispatchCommand(mTag, mCommand, mArgs);
    }
  }

  private final class ShowPopupMenuOperation extends ViewOperation {

    private final ReadableArray mItems;
    private final Callback mError;
    private final Callback mSuccess;

    public ShowPopupMenuOperation(
        int tag,
        ReadableArray items,
        Callback error,
        Callback success) {
      super(tag);
      mItems = items;
      mError = error;
      mSuccess = success;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.showPopupMenu(mTag, mItems, mSuccess, mError);
    }
  }

  /**
   * A spec for animation operations (add/remove)
   */
  private static abstract class AnimationOperation implements UIViewOperationQueue.UIOperation {

    protected final int mAnimationID;

    public AnimationOperation(int animationID) {
      mAnimationID = animationID;
    }
  }

  private class RegisterAnimationOperation extends AnimationOperation {

    private final Animation mAnimation;

    private RegisterAnimationOperation(Animation animation) {
      super(animation.getAnimationID());
      mAnimation = animation;
    }

    @Override
    public void execute() {
      mAnimationRegistry.registerAnimation(mAnimation);
    }
  }

  private class AddAnimationOperation extends AnimationOperation {
    private final int mReactTag;
    private final Callback mSuccessCallback;

    private AddAnimationOperation(int reactTag, int animationID, Callback successCallback) {
      super(animationID);
      mReactTag = reactTag;
      mSuccessCallback = successCallback;
    }

    @Override
    public void execute() {
      Animation animation = mAnimationRegistry.getAnimation(mAnimationID);
      if (animation != null) {
        mNativeViewHierarchyManager.startAnimationForNativeView(
            mReactTag,
            animation,
            mSuccessCallback);
      } else {
        // node or animation not found
        // TODO(5712813): cleanup callback in JS callbacks table in case of an error
        throw new IllegalViewOperationException("Animation with id " + mAnimationID
            + " was not found");
      }
    }
  }

  private final class RemoveAnimationOperation extends AnimationOperation {

    private RemoveAnimationOperation(int animationID) {
      super(animationID);
    }

    @Override
    public void execute() {
      Animation animation = mAnimationRegistry.getAnimation(mAnimationID);
      if (animation != null) {
        animation.cancel();
      }
    }
  }

  private class SetLayoutAnimationEnabledOperation implements UIOperation {
    private final boolean mEnabled;

    private SetLayoutAnimationEnabledOperation(final boolean enabled) {
      mEnabled = enabled;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.setLayoutAnimationEnabled(mEnabled);
    }
  }

  private class ConfigureLayoutAnimationOperation implements UIOperation {
    private final ReadableMap mConfig;

    private ConfigureLayoutAnimationOperation(final ReadableMap config) {
      mConfig = config;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.configureLayoutAnimation(mConfig);
    }
  }

  private final class MeasureOperation implements UIOperation {

    private final int mReactTag;
    private final Callback mCallback;

    private MeasureOperation(
        final int reactTag,
        final Callback callback) {
      super();
      mReactTag = reactTag;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.measure(mReactTag, mMeasureBuffer);
      } catch (NoSuchNativeViewException e) {
        // Invoke with no args to signal failure and to allow JS to clean up the callback
        // handle.
        mCallback.invoke();
        return;
      }

      float x = PixelUtil.toDIPFromPixel(mMeasureBuffer[0]);
      float y = PixelUtil.toDIPFromPixel(mMeasureBuffer[1]);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      mCallback.invoke(0, 0, width, height, x, y);
    }
  }

  private final class MeasureInWindowOperation implements UIOperation {

    private final int mReactTag;
    private final Callback mCallback;

    private MeasureInWindowOperation(
        final int reactTag,
        final Callback callback) {
      super();
      mReactTag = reactTag;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.measureInWindow(mReactTag, mMeasureBuffer);
      } catch (NoSuchNativeViewException e) {
        // Invoke with no args to signal failure and to allow JS to clean up the callback
        // handle.
        mCallback.invoke();
        return;
      }

      float x = PixelUtil.toDIPFromPixel(mMeasureBuffer[0]);
      float y = PixelUtil.toDIPFromPixel(mMeasureBuffer[1]);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      mCallback.invoke(x, y, width, height);
    }
  }

  private final class FindTargetForTouchOperation implements UIOperation {

    private final int mReactTag;
    private final float mTargetX;
    private final float mTargetY;
    private final Callback mCallback;

    private FindTargetForTouchOperation(
        final int reactTag,
        final float targetX,
        final float targetY,
        final Callback callback) {
      super();
      mReactTag = reactTag;
      mTargetX = targetX;
      mTargetY = targetY;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.measure(
            mReactTag,
            mMeasureBuffer);
      } catch (IllegalViewOperationException e) {
        mCallback.invoke();
        return;
      }

      // Because React coordinates are relative to root container, and measure() operates
      // on screen coordinates, we need to offset values using root container location.
      final float containerX = (float) mMeasureBuffer[0];
      final float containerY = (float) mMeasureBuffer[1];

      final int touchTargetReactTag = mNativeViewHierarchyManager.findTargetTagForTouch(
          mReactTag,
          mTargetX,
          mTargetY);

      try {
        mNativeViewHierarchyManager.measure(
            touchTargetReactTag,
            mMeasureBuffer);
      } catch (IllegalViewOperationException e) {
        mCallback.invoke();
        return;
      }

      float x = PixelUtil.toDIPFromPixel(mMeasureBuffer[0] - containerX);
      float y = PixelUtil.toDIPFromPixel(mMeasureBuffer[1] - containerY);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      mCallback.invoke(touchTargetReactTag, x, y, width, height);
    }
  }

  private class UIBlockOperation implements UIOperation {
    private final UIBlock mBlock;
    public UIBlockOperation (UIBlock block) {
      mBlock = block;
    }

    @Override
    public void execute() {
      mBlock.execute(mNativeViewHierarchyManager);
    }
  }

  private final class SendAccessibilityEvent extends ViewOperation {

    private final int mEventType;

    private SendAccessibilityEvent(int tag, int eventType) {
      super(tag);
      mEventType = eventType;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.sendAccessibilityEvent(mTag, mEventType);
    }
  }

  private final NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final AnimationRegistry mAnimationRegistry;
  private final Object mDispatchRunnablesLock = new Object();
  private final Object mNonBatchedOperationsLock = new Object();
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;
  private final ReactApplicationContext mReactApplicationContext;

  // Only called from the UIManager queue?
  private ArrayList<UIOperation> mOperations = new ArrayList<>();

  @GuardedBy("mDispatchRunnablesLock")
  private ArrayList<Runnable> mDispatchUIRunnables = new ArrayList<>();

  @GuardedBy("mNonBatchedOperationsLock")
  private ArrayDeque<UIOperation> mNonBatchedOperations = new ArrayDeque<>();

  private @Nullable NotThreadSafeViewHierarchyUpdateDebugListener mViewHierarchyUpdateDebugListener;
  private boolean mIsDispatchUIFrameCallbackEnqueued = false;
  private boolean mIsInIllegalUIState = false;
  private boolean mIsProfilingNextBatch = false;
  private long mNonBatchedExecutionTotalTime;
  private long mProfiledBatchCommitStartTime;
  private long mProfiledBatchLayoutTime;
  private long mProfiledBatchDispatchViewUpdatesTime;
  private long mProfiledBatchRunStartTime;
  private long mProfiledBatchBatchedExecutionTime;
  private long mProfiledBatchNonBatchedExecutionTime;

  public UIViewOperationQueue(
      ReactApplicationContext reactContext,
      NativeViewHierarchyManager nativeViewHierarchyManager,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mNativeViewHierarchyManager = nativeViewHierarchyManager;
    mAnimationRegistry = nativeViewHierarchyManager.getAnimationRegistry();
    mDispatchUIFrameCallback =
        new DispatchUIFrameCallback(
            reactContext,
            minTimeLeftInFrameForNonBatchedOperationMs == -1
                ? DEFAULT_MIN_TIME_LEFT_IN_FRAME_FOR_NONBATCHED_OPERATION_MS
                : minTimeLeftInFrameForNonBatchedOperationMs);
    mReactApplicationContext = reactContext;
  }

  /*package*/ NativeViewHierarchyManager getNativeViewHierarchyManager() {
    return mNativeViewHierarchyManager;
  }

  public void setViewHierarchyUpdateDebugListener(
      @Nullable NotThreadSafeViewHierarchyUpdateDebugListener listener) {
    mViewHierarchyUpdateDebugListener = listener;
  }

  public void profileNextBatch() {
    mIsProfilingNextBatch = true;
    mProfiledBatchCommitStartTime = 0;
  }

  public Map<String, Long> getProfiledBatchPerfCounters() {
    Map<String, Long> perfMap = new HashMap<>();
    perfMap.put("CommitStartTime", mProfiledBatchCommitStartTime);
    perfMap.put("LayoutTime", mProfiledBatchLayoutTime);
    perfMap.put("DispatchViewUpdatesTime", mProfiledBatchDispatchViewUpdatesTime);
    perfMap.put("RunStartTime", mProfiledBatchRunStartTime);
    perfMap.put("BatchedExecutionTime", mProfiledBatchBatchedExecutionTime);
    perfMap.put("NonBatchedExecutionTime", mProfiledBatchNonBatchedExecutionTime);
    return perfMap;
  }

  public boolean isEmpty() {
    return mOperations.isEmpty();
  }

  public void addRootView(
    final int tag,
    final SizeMonitoringFrameLayout rootView,
    final ThemedReactContext themedRootContext) {
    mNativeViewHierarchyManager.addRootView(tag, rootView, themedRootContext);
  }

  /**
   * Enqueues a UIOperation to be executed in UI thread. This method should only be used by a
   * subclass to support UIOperations not provided by UIViewOperationQueue.
   */
  protected void enqueueUIOperation(UIOperation operation) {
    SoftAssertions.assertNotNull(operation);
    mOperations.add(operation);
  }

  public void enqueueRemoveRootView(int rootViewTag) {
    mOperations.add(new RemoveRootViewOperation(rootViewTag));
  }

  public void enqueueSetJSResponder(
      int tag,
      int initialTag,
      boolean blockNativeResponder) {
    mOperations.add(
        new ChangeJSResponderOperation(
            tag,
            initialTag,
            false /*clearResponder*/,
            blockNativeResponder));
  }

  public void enqueueClearJSResponder() {
    // Tag is 0 because JSResponderHandler doesn't need one in order to clear the responder.
    mOperations.add(new ChangeJSResponderOperation(0, 0, true /*clearResponder*/, false));
  }

  public void enqueueDispatchCommand(
      int reactTag,
      int commandId,
      ReadableArray commandArgs) {
    mOperations.add(new DispatchCommandOperation(reactTag, commandId, commandArgs));
  }

  public void enqueueUpdateExtraData(int reactTag, Object extraData) {
    mOperations.add(new UpdateViewExtraData(reactTag, extraData));
  }

  public void enqueueShowPopupMenu(
      int reactTag,
      ReadableArray items,
      Callback error,
      Callback success) {
    mOperations.add(new ShowPopupMenuOperation(reactTag, items, error, success));
  }

  public void enqueueCreateView(
      ThemedReactContext themedContext,
      int viewReactTag,
      String viewClassName,
      @Nullable ReactStylesDiffMap initialProps) {
    synchronized (mNonBatchedOperationsLock) {
      mNonBatchedOperations.addLast(
        new CreateViewOperation(
          themedContext,
          viewReactTag,
          viewClassName,
          initialProps));
    }
  }

  public void enqueueUpdateProperties(int reactTag, String className, ReactStylesDiffMap props) {
    mOperations.add(new UpdatePropertiesOperation(reactTag, props));
  }

  public void enqueueUpdateLayout(
      int parentTag,
      int reactTag,
      int x,
      int y,
      int width,
      int height) {
    mOperations.add(
        new UpdateLayoutOperation(parentTag, reactTag, x, y, width, height));
  }

  public void enqueueManageChildren(
      int reactTag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    mOperations.add(
        new ManageChildrenOperation(reactTag, indicesToRemove, viewsToAdd, tagsToDelete));
  }

  public void enqueueSetChildren(
    int reactTag,
    ReadableArray childrenTags) {
    mOperations.add(
      new SetChildrenOperation(reactTag, childrenTags));
  }

  public void enqueueRegisterAnimation(Animation animation) {
    mOperations.add(new RegisterAnimationOperation(animation));
  }

  public void enqueueAddAnimation(
      final int reactTag,
      final int animationID,
      final Callback onSuccess) {
    mOperations.add(new AddAnimationOperation(reactTag, animationID, onSuccess));
  }

  public void enqueueRemoveAnimation(int animationID) {
    mOperations.add(new RemoveAnimationOperation(animationID));
  }

  public void enqueueSetLayoutAnimationEnabled(
      final boolean enabled) {
    mOperations.add(new SetLayoutAnimationEnabledOperation(enabled));
  }

  public void enqueueConfigureLayoutAnimation(
      final ReadableMap config,
      final Callback onSuccess,
      final Callback onError) {
    mOperations.add(new ConfigureLayoutAnimationOperation(config));
  }

  public void enqueueMeasure(
      final int reactTag,
      final Callback callback) {
    mOperations.add(
        new MeasureOperation(reactTag, callback));
  }

  public void enqueueMeasureInWindow(
      final int reactTag,
      final Callback callback) {
    mOperations.add(
        new MeasureInWindowOperation(reactTag, callback));
  }

  public void enqueueFindTargetForTouch(
      final int reactTag,
      final float targetX,
      final float targetY,
      final Callback callback) {
    mOperations.add(
        new FindTargetForTouchOperation(reactTag, targetX, targetY, callback));
  }

  public void enqueueSendAccessibilityEvent(int tag, int eventType) {
    mOperations.add(new SendAccessibilityEvent(tag, eventType));
  }

  public void enqueueUIBlock(UIBlock block) {
    mOperations.add(new UIBlockOperation(block));
  }

  public void prependUIBlock(UIBlock block) {
    mOperations.add(0, new UIBlockOperation(block));
  }

  /* package */ void dispatchViewUpdates(
      final int batchId, final long commitStartTime, final long layoutTime) {
    SystraceMessage.beginSection(
      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
      "UIViewOperationQueue.dispatchViewUpdates")
      .arg("batchId", batchId)
      .flush();
    try {
      final long dispatchViewUpdatesTime = SystemClock.uptimeMillis();

      // Store the current operation queues to dispatch and create new empty ones to continue
      // receiving new operations
      final ArrayList<UIOperation> batchedOperations;
      if (!mOperations.isEmpty()) {
        batchedOperations = mOperations;
        mOperations = new ArrayList<>();
      } else {
        batchedOperations = null;
      }

      final ArrayDeque<UIOperation> nonBatchedOperations;
      synchronized (mNonBatchedOperationsLock) {
        if (!mNonBatchedOperations.isEmpty()) {
          nonBatchedOperations = mNonBatchedOperations;
          mNonBatchedOperations = new ArrayDeque<>();
        } else {
          nonBatchedOperations = null;
        }
      }

      if (mViewHierarchyUpdateDebugListener != null) {
        mViewHierarchyUpdateDebugListener.onViewHierarchyUpdateEnqueued();
      }

      Runnable runOperations =
          new Runnable() {
            @Override
            public void run() {
              SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "DispatchUI")
                  .arg("BatchId", batchId)
                  .flush();
              try {
                long runStartTime = SystemClock.uptimeMillis();

                // All nonBatchedOperations should be executed before regular operations as
                // regular operations may depend on them
                if (nonBatchedOperations != null) {
                  for (UIOperation op : nonBatchedOperations) {
                    op.execute();
                  }
                }

                if (batchedOperations != null) {
                  for (UIOperation op : batchedOperations) {
                    op.execute();
                  }
                }

                if (mIsProfilingNextBatch && mProfiledBatchCommitStartTime == 0) {
                  mProfiledBatchCommitStartTime = commitStartTime;
                  mProfiledBatchLayoutTime = layoutTime;
                  mProfiledBatchDispatchViewUpdatesTime = dispatchViewUpdatesTime;
                  mProfiledBatchRunStartTime = runStartTime;

                  Systrace.beginAsyncSection(
                      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
                      "delayBeforeDispatchViewUpdates",
                      0,
                      mProfiledBatchCommitStartTime * 1000000);
                  Systrace.endAsyncSection(
                      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
                      "delayBeforeDispatchViewUpdates",
                      0,
                      mProfiledBatchDispatchViewUpdatesTime * 1000000);
                  Systrace.beginAsyncSection(
                      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
                      "delayBeforeBatchRunStart",
                      0,
                      mProfiledBatchDispatchViewUpdatesTime * 1000000);
                  Systrace.endAsyncSection(
                      Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
                      "delayBeforeBatchRunStart",
                      0,
                      mProfiledBatchRunStartTime * 1000000);
                }

                // Clear layout animation, as animation only apply to current UI operations batch.
                mNativeViewHierarchyManager.clearLayoutAnimation();

                if (mViewHierarchyUpdateDebugListener != null) {
                  mViewHierarchyUpdateDebugListener.onViewHierarchyUpdateFinished();
                }
              } catch (Exception e) {
                mIsInIllegalUIState = true;
                throw e;
              } finally {
                Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
              }
            }
          };

      SystraceMessage.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "acquiring mDispatchRunnablesLock")
        .arg("batchId", batchId)
        .flush();
      synchronized (mDispatchRunnablesLock) {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        mDispatchUIRunnables.add(runOperations);
      }

      // In the case where the frame callback isn't enqueued, the UI isn't being displayed or is being
      // destroyed. In this case it's no longer important to align to frames, but it is important to make
      // sure any late-arriving UI commands are executed.
      if (!mIsDispatchUIFrameCallbackEnqueued) {
        UiThreadUtil.runOnUiThread(
          new GuardedRunnable(mReactApplicationContext) {
            @Override
            public void runGuarded() {
              flushPendingBatches();
            }
          });
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /* package */ void resumeFrameCallback() {
    mIsDispatchUIFrameCallbackEnqueued = true;
    ReactChoreographer.getInstance()
        .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
  }

  /* package */ void pauseFrameCallback() {
    mIsDispatchUIFrameCallbackEnqueued = false;
    ReactChoreographer.getInstance()
        .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
    flushPendingBatches();
  }

  private void flushPendingBatches() {
    if (mIsInIllegalUIState) {
      FLog.w(
        ReactConstants.TAG,
        "Not flushing pending UI operations because of previously thrown Exception");
      return;
    }

    final ArrayList<Runnable> runnables;
    synchronized (mDispatchRunnablesLock) {
      if (!mDispatchUIRunnables.isEmpty()) {
        runnables = mDispatchUIRunnables;
        mDispatchUIRunnables = new ArrayList<>();
      } else {
        return;
      }
    }

    final long batchedExecutionStartTime = SystemClock.uptimeMillis();
    for (Runnable runnable : runnables) {
      runnable.run();
    }

    if (mIsProfilingNextBatch) {
      mProfiledBatchBatchedExecutionTime = SystemClock.uptimeMillis() - batchedExecutionStartTime;
      mProfiledBatchNonBatchedExecutionTime = mNonBatchedExecutionTotalTime;
      mIsProfilingNextBatch = false;

      Systrace.beginAsyncSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "batchedExecutionTime",
          0,
          batchedExecutionStartTime * 1000000);
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "batchedExecutionTime", 0);
    }
    mNonBatchedExecutionTotalTime = 0;
  }

  /**
   * Choreographer FrameCallback responsible for actually dispatching view updates on the UI thread
   * that were enqueued via {@link #dispatchViewUpdates(int)}. The reason we don't just enqueue
   * directly to the UI thread from that method is to make sure our Runnables actually run before
   * the next traversals happen:
   *
   * ViewRootImpl#scheduleTraversals (which is called from invalidate, requestLayout, etc) calls
   * Looper#postSyncBarrier which keeps any UI thread looper messages from being processed until
   * that barrier is removed during the next traversal. That means, depending on when we get updates
   * from JS and what else is happening on the UI thread, we can sometimes try to post this runnable
   * after ViewRootImpl has posted a barrier.
   *
   * Using a Choreographer callback (which runs immediately before traversals), we guarantee we run
   * before the next traversal.
   */
  private class DispatchUIFrameCallback extends GuardedFrameCallback {

    private static final int FRAME_TIME_MS = 16;
    private final int mMinTimeLeftInFrameForNonBatchedOperationMs;

    private DispatchUIFrameCallback(
        ReactContext reactContext, int minTimeLeftInFrameForNonBatchedOperationMs) {
      super(reactContext);
      mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
    }

    @Override
    public void doFrameGuarded(long frameTimeNanos) {
      if (mIsInIllegalUIState) {
        FLog.w(
          ReactConstants.TAG,
          "Not flushing pending UI operations because of previously thrown Exception");
        return;
      }

      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "dispatchNonBatchedUIOperations");
      try {
        dispatchPendingNonBatchedOperations(frameTimeNanos);
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      }

      flushPendingBatches();

      ReactChoreographer.getInstance().postFrameCallback(
        ReactChoreographer.CallbackType.DISPATCH_UI, this);
    }

    private void dispatchPendingNonBatchedOperations(long frameTimeNanos) {
      while (true) {
        long timeLeftInFrame = FRAME_TIME_MS - ((System.nanoTime() - frameTimeNanos) / 1000000);
        if (timeLeftInFrame < mMinTimeLeftInFrameForNonBatchedOperationMs) {
          break;
        }

        UIOperation nextOperation;
        synchronized (mNonBatchedOperationsLock) {
          if (mNonBatchedOperations.isEmpty()) {
            break;
          }

          nextOperation = mNonBatchedOperations.pollFirst();
        }

        try {
          long nonBatchedExecutionStartTime = SystemClock.uptimeMillis();
          nextOperation.execute();
          mNonBatchedExecutionTotalTime +=
              SystemClock.uptimeMillis() - nonBatchedExecutionStartTime;
        } catch (Exception e) {
          mIsInIllegalUIState = true;
          throw e;
        }
      }
    }
  }
}
