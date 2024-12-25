/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.os.SystemClock;
import android.view.View;
import androidx.annotation.GuardedBy;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import com.facebook.yoga.YogaDirection;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * This class acts as a buffer for command executed on {@link NativeViewHierarchyManager}. It expose
 * similar methods as mentioned classes but instead of executing commands immediately it enqueues
 * those operations in a queue that is then flushed from {@link UIManagerModule} once JS batch of ui
 * operations is finished. This is to make sure that we execute all the JS operation coming from a
 * single batch a single loop of the main (UI) android looper.
 *
 * <p>TODO(7135923): Pooling of operation objects TODO(5694019): Consider a better data structure
 * for operations queue to save on allocations
 */
public class UIViewOperationQueue {

  public static final int DEFAULT_MIN_TIME_LEFT_IN_FRAME_FOR_NONBATCHED_OPERATION_MS = 8;
  private static final String TAG = UIViewOperationQueue.class.getSimpleName();

  private final int[] mMeasureBuffer = new int[4];

  /** A mutation or animation operation on the view hierarchy. */
  public interface UIOperation {

    void execute();
  }

  /** A spec for an operation on the native View hierarchy. */
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

  private final class UpdateInstanceHandleOperation extends ViewOperation {

    private final long mInstanceHandle;

    private UpdateInstanceHandleOperation(int tag, long instanceHandle) {
      super(tag);
      mInstanceHandle = instanceHandle;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateInstanceHandle(mTag, mInstanceHandle);
    }
  }

  /**
   * Operation for updating native view's position and size. The operation is not created directly
   * by a {@link UIManagerModule} call from JS. Instead it gets inflated using computed position and
   * size values by CSSNodeDEPRECATED hierarchy.
   */
  private final class UpdateLayoutOperation extends ViewOperation {

    private final int mParentTag, mX, mY, mWidth, mHeight;
    private final YogaDirection mLayoutDirection;

    public UpdateLayoutOperation(
        int parentTag,
        int tag,
        int x,
        int y,
        int width,
        int height,
        YogaDirection layoutDirection) {
      super(tag);
      mParentTag = parentTag;
      mX = x;
      mY = y;
      mWidth = width;
      mHeight = height;
      mLayoutDirection = layoutDirection;
      Systrace.startAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "updateLayout", mTag);
    }

    @Override
    public void execute() {
      Systrace.endAsyncFlow(Systrace.TRACE_TAG_REACT_VIEW, "updateLayout", mTag);
      mNativeViewHierarchyManager.updateLayout(
          mParentTag, mTag, mX, mY, mWidth, mHeight, mLayoutDirection);
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
      mNativeViewHierarchyManager.createView(mThemedContext, mTag, mClassName, mInitialProps);
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
          mTag, mIndicesToRemove, mViewsToAdd, mTagsToDelete);
    }
  }

  private final class SetChildrenOperation extends ViewOperation {

    private final ReadableArray mChildrenTags;

    public SetChildrenOperation(int tag, ReadableArray childrenTags) {
      super(tag);
      mChildrenTags = childrenTags;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.setChildren(mTag, mChildrenTags);
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
        int tag, int initialTag, boolean clearResponder, boolean blockNativeResponder) {
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

  /**
   * This is a common interface for View Command operations. Once we delete the deprecated {@link
   * DispatchCommandOperation}, we can delete this interface too. It provides a set of common
   * operations to simplify generic operations on all types of ViewCommands.
   */
  private interface DispatchCommandViewOperation {

    /**
     * Like the execute function, but throws real exceptions instead of logging soft errors and
     * returning silently.
     */
    void executeWithExceptions();

    /** Increment retry counter. */
    void incrementRetries();

    /** Get retry counter. */
    int getRetries();
  }

  @Deprecated
  private final class DispatchCommandOperation extends ViewOperation
      implements DispatchCommandViewOperation {

    private final int mCommand;
    private final @Nullable ReadableArray mArgs;

    private int numRetries = 0;

    public DispatchCommandOperation(int tag, int command, @Nullable ReadableArray args) {
      super(tag);
      mCommand = command;
      mArgs = args;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.dispatchCommand(mTag, mCommand, mArgs);
      } catch (Throwable e) {
        ReactSoftExceptionLogger.logSoftException(
            TAG, new RuntimeException("Error dispatching View Command", e));
      }
    }

    @Override
    public void executeWithExceptions() {
      mNativeViewHierarchyManager.dispatchCommand(mTag, mCommand, mArgs);
    }

    @Override
    @UiThread
    public void incrementRetries() {
      numRetries++;
    }

    @Override
    @UiThread
    public int getRetries() {
      return numRetries;
    }
  }

  private final class DispatchStringCommandOperation extends ViewOperation
      implements DispatchCommandViewOperation {

    private final String mCommand;
    private final @Nullable ReadableArray mArgs;
    private int numRetries = 0;

    public DispatchStringCommandOperation(int tag, String command, @Nullable ReadableArray args) {
      super(tag);
      mCommand = command;
      mArgs = args;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.dispatchCommand(mTag, mCommand, mArgs);
      } catch (Throwable e) {
        ReactSoftExceptionLogger.logSoftException(
            TAG, new RuntimeException("Error dispatching View Command", e));
      }
    }

    @Override
    @UiThread
    public void executeWithExceptions() {
      mNativeViewHierarchyManager.dispatchCommand(mTag, mCommand, mArgs);
    }

    @Override
    @UiThread
    public void incrementRetries() {
      numRetries++;
    }

    @Override
    public int getRetries() {
      return numRetries;
    }
  }

  /** A spec for animation operations (add/remove) */
  private abstract static class AnimationOperation implements UIViewOperationQueue.UIOperation {

    protected final int mAnimationID;

    public AnimationOperation(int animationID) {
      mAnimationID = animationID;
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
    private final Callback mAnimationComplete;

    private ConfigureLayoutAnimationOperation(
        final ReadableMap config, final Callback animationComplete) {
      mConfig = config;
      mAnimationComplete = animationComplete;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.configureLayoutAnimation(mConfig, mAnimationComplete);
    }
  }

  private final class MeasureOperation implements UIOperation {

    private final int mReactTag;
    private final Callback mCallback;

    private MeasureOperation(final int reactTag, final Callback callback) {
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

    private MeasureInWindowOperation(final int reactTag, final Callback callback) {
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
        final int reactTag, final float targetX, final float targetY, final Callback callback) {
      super();
      mReactTag = reactTag;
      mTargetX = targetX;
      mTargetY = targetY;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.measure(mReactTag, mMeasureBuffer);
      } catch (IllegalViewOperationException e) {
        mCallback.invoke();
        return;
      }

      // Because React coordinates are relative to root container, and measure() operates
      // on screen coordinates, we need to offset values using root container location.
      final float containerX = (float) mMeasureBuffer[0];
      final float containerY = (float) mMeasureBuffer[1];

      final int touchTargetReactTag =
          mNativeViewHierarchyManager.findTargetTagForTouch(mReactTag, mTargetX, mTargetY);

      try {
        mNativeViewHierarchyManager.measure(touchTargetReactTag, mMeasureBuffer);
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

  private final class LayoutUpdateFinishedOperation implements UIOperation {

    private final ReactShadowNode mNode;
    private final UIImplementation.LayoutUpdateListener mListener;

    private LayoutUpdateFinishedOperation(
        ReactShadowNode node, UIImplementation.LayoutUpdateListener listener) {
      mNode = node;
      mListener = listener;
    }

    @Override
    public void execute() {
      mListener.onLayoutUpdated(mNode);
    }
  }

  private class UIBlockOperation implements UIOperation {
    private final UIBlock mBlock;

    public UIBlockOperation(UIBlock block) {
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
      try {
        mNativeViewHierarchyManager.sendAccessibilityEvent(mTag, mEventType);
      } catch (RetryableMountingLayerException e) {
        // Accessibility events are similar to commands in that they're imperative
        // calls from JS, disconnected from the commit lifecycle, and therefore
        // inherently unpredictable and dangerous. If we encounter a "retryable"
        // error, that is, a known category of errors that this is likely to hit
        // due to race conditions (like the view disappearing after the event is
        // queued and before it executes), we log a soft exception and continue along.
        // Other categories of errors will still cause a hard crash.
        ReactSoftExceptionLogger.logSoftException(TAG, e);
      }
    }
  }

  private final NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final Object mDispatchRunnablesLock = new Object();
  private final Object mNonBatchedOperationsLock = new Object();
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;
  private final ReactApplicationContext mReactApplicationContext;

  private ArrayList<DispatchCommandViewOperation> mViewCommandOperations = new ArrayList<>();

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
  private long mProfiledBatchCommitEndTime;
  private long mProfiledBatchLayoutTime;
  private long mProfiledBatchDispatchViewUpdatesTime;
  private long mProfiledBatchRunStartTime;
  private long mProfiledBatchRunEndTime;
  private long mProfiledBatchBatchedExecutionTime;
  private long mProfiledBatchNonBatchedExecutionTime;
  private long mThreadCpuTime;
  private long mCreateViewCount;
  private long mUpdatePropertiesOperationCount;

  public UIViewOperationQueue(
      ReactApplicationContext reactContext,
      NativeViewHierarchyManager nativeViewHierarchyManager,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mNativeViewHierarchyManager = nativeViewHierarchyManager;
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

  // NOTE: When converted to Kotlin this method should be `internal` due to
  // visibility restriction for `NotThreadSafeViewHierarchyUpdateDebugListener`
  public void setViewHierarchyUpdateDebugListener(
      @Nullable NotThreadSafeViewHierarchyUpdateDebugListener listener) {
    mViewHierarchyUpdateDebugListener = listener;
  }

  public void profileNextBatch() {
    mIsProfilingNextBatch = true;
    mProfiledBatchCommitStartTime = 0;
    mCreateViewCount = 0;
    mUpdatePropertiesOperationCount = 0;
  }

  public Map<String, Long> getProfiledBatchPerfCounters() {
    Map<String, Long> perfMap = new HashMap<>();
    perfMap.put("CommitStartTime", mProfiledBatchCommitStartTime);
    perfMap.put("CommitEndTime", mProfiledBatchCommitEndTime);
    perfMap.put("LayoutTime", mProfiledBatchLayoutTime);
    perfMap.put("DispatchViewUpdatesTime", mProfiledBatchDispatchViewUpdatesTime);
    perfMap.put("RunStartTime", mProfiledBatchRunStartTime);
    perfMap.put("RunEndTime", mProfiledBatchRunEndTime);
    perfMap.put("BatchedExecutionTime", mProfiledBatchBatchedExecutionTime);
    perfMap.put("NonBatchedExecutionTime", mProfiledBatchNonBatchedExecutionTime);
    perfMap.put("NativeModulesThreadCpuTime", mThreadCpuTime);
    perfMap.put("CreateViewCount", mCreateViewCount);
    perfMap.put("UpdatePropsCount", mUpdatePropertiesOperationCount);
    return perfMap;
  }

  public boolean isEmpty() {
    return mOperations.isEmpty() && mViewCommandOperations.isEmpty();
  }

  public void addRootView(final int tag, final View rootView) {
    mNativeViewHierarchyManager.addRootView(tag, rootView);
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

  public void enqueueSetJSResponder(int tag, int initialTag, boolean blockNativeResponder) {
    mOperations.add(
        new ChangeJSResponderOperation(
            tag, initialTag, false /*clearResponder*/, blockNativeResponder));
  }

  public void enqueueClearJSResponder() {
    // Tag is 0 because JSResponderHandler doesn't need one in order to clear the responder.
    mOperations.add(new ChangeJSResponderOperation(0, 0, true /*clearResponder*/, false));
  }

  @Deprecated
  public void enqueueDispatchCommand(
      int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    final DispatchCommandOperation command =
        new DispatchCommandOperation(reactTag, commandId, commandArgs);
    mViewCommandOperations.add(command);
  }

  public void enqueueDispatchCommand(
      int reactTag, String commandId, @Nullable ReadableArray commandArgs) {
    final DispatchStringCommandOperation command =
        new DispatchStringCommandOperation(reactTag, commandId, commandArgs);
    mViewCommandOperations.add(command);
  }

  public void enqueueUpdateExtraData(int reactTag, Object extraData) {
    mOperations.add(new UpdateViewExtraData(reactTag, extraData));
  }

  public void enqueueCreateView(
      ThemedReactContext themedContext,
      int viewReactTag,
      String viewClassName,
      @Nullable ReactStylesDiffMap initialProps) {
    synchronized (mNonBatchedOperationsLock) {
      mCreateViewCount++;
      mNonBatchedOperations.addLast(
          new CreateViewOperation(themedContext, viewReactTag, viewClassName, initialProps));
    }
  }

  public void enqueueUpdateInstanceHandle(int reactTag, long instanceHandle) {
    mOperations.add(new UpdateInstanceHandleOperation(reactTag, instanceHandle));
  }

  public void enqueueUpdateProperties(int reactTag, String className, ReactStylesDiffMap props) {
    mUpdatePropertiesOperationCount++;
    mOperations.add(new UpdatePropertiesOperation(reactTag, props));
  }

  /**
   * @deprecated Use {@link #enqueueUpdateLayout(int, int, int, int, int, int, YogaDirection)}
   *     instead.
   */
  @Deprecated
  public void enqueueUpdateLayout(
      int parentTag, int reactTag, int x, int y, int width, int height) {
    enqueueUpdateLayout(parentTag, reactTag, x, y, width, height, YogaDirection.INHERIT);
  }

  public void enqueueUpdateLayout(
      int parentTag,
      int reactTag,
      int x,
      int y,
      int width,
      int height,
      YogaDirection layoutDirection) {
    mOperations.add(
        new UpdateLayoutOperation(parentTag, reactTag, x, y, width, height, layoutDirection));
  }

  public void enqueueManageChildren(
      int reactTag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    mOperations.add(
        new ManageChildrenOperation(reactTag, indicesToRemove, viewsToAdd, tagsToDelete));
  }

  public void enqueueSetChildren(int reactTag, ReadableArray childrenTags) {
    mOperations.add(new SetChildrenOperation(reactTag, childrenTags));
  }

  public void enqueueSetLayoutAnimationEnabled(final boolean enabled) {
    mOperations.add(new SetLayoutAnimationEnabledOperation(enabled));
  }

  public void enqueueConfigureLayoutAnimation(
      final ReadableMap config, final Callback onAnimationComplete) {
    mOperations.add(new ConfigureLayoutAnimationOperation(config, onAnimationComplete));
  }

  public void enqueueMeasure(final int reactTag, final Callback callback) {
    mOperations.add(new MeasureOperation(reactTag, callback));
  }

  public void enqueueMeasureInWindow(final int reactTag, final Callback callback) {
    mOperations.add(new MeasureInWindowOperation(reactTag, callback));
  }

  public void enqueueFindTargetForTouch(
      final int reactTag, final float targetX, final float targetY, final Callback callback) {
    mOperations.add(new FindTargetForTouchOperation(reactTag, targetX, targetY, callback));
  }

  public void enqueueSendAccessibilityEvent(int tag, int eventType) {
    mOperations.add(new SendAccessibilityEvent(tag, eventType));
  }

  public void enqueueLayoutUpdateFinished(
      ReactShadowNode node, UIImplementation.LayoutUpdateListener listener) {
    mOperations.add(new LayoutUpdateFinishedOperation(node, listener));
  }

  public void enqueueUIBlock(UIBlock block) {
    mOperations.add(new UIBlockOperation(block));
  }

  public void prependUIBlock(UIBlock block) {
    mOperations.add(0, new UIBlockOperation(block));
  }

  public void dispatchViewUpdates(
      final int batchId, final long commitStartTime, final long layoutTime) {
    SystraceMessage.beginSection(
            Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIViewOperationQueue.dispatchViewUpdates")
        .arg("batchId", batchId)
        .flush();
    try {
      final long dispatchViewUpdatesTime = SystemClock.uptimeMillis();
      final long nativeModulesThreadCpuTime = SystemClock.currentThreadTimeMillis();

      // Store the current operation queues to dispatch and create new empty ones to continue
      // receiving new operations
      final ArrayList<DispatchCommandViewOperation> viewCommandOperations;
      if (!mViewCommandOperations.isEmpty()) {
        viewCommandOperations = mViewCommandOperations;
        mViewCommandOperations = new ArrayList<>();
      } else {
        viewCommandOperations = null;
      }

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

                // All ViewCommands should be executed first as a perf optimization.
                // This entire block is only executed if there's at least one ViewCommand queued.
                if (viewCommandOperations != null) {
                  for (DispatchCommandViewOperation op : viewCommandOperations) {
                    try {
                      op.executeWithExceptions();
                    } catch (RetryableMountingLayerException e) {
                      // Catch errors in DispatchCommands. We allow all commands to be retried
                      // exactly once, after the current batch of other mountitems. If the second
                      // attempt fails, then  we log a soft error. This will still crash only in
                      // debug. We do this because it is a ~relatively common pattern to dispatch a
                      // command during render, for example, to scroll to the bottom of a ScrollView
                      // in render. This dispatches the command before that View is even mounted. By
                      // retrying once, we can still dispatch the vast majority of commands faster,
                      // avoid errors, and still operate correctly for most commands even when
                      // they're executed too soon.
                      if (op.getRetries() == 0) {
                        op.incrementRetries();
                        mViewCommandOperations.add(op);
                      } else {
                        // Retryable exceptions should be logged, but never crash in debug.
                        ReactSoftExceptionLogger.logSoftException(
                            TAG, new ReactNoCrashSoftException(e));
                      }
                    } catch (Throwable e) {
                      // Non-retryable exceptions should be logged in prod, and crash in Debug.
                      ReactSoftExceptionLogger.logSoftException(TAG, e);
                    }
                  }
                }

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
                  mProfiledBatchCommitEndTime = SystemClock.uptimeMillis();
                  mProfiledBatchLayoutTime = layoutTime;
                  mProfiledBatchDispatchViewUpdatesTime = dispatchViewUpdatesTime;
                  mProfiledBatchRunStartTime = runStartTime;
                  mProfiledBatchRunEndTime = mProfiledBatchCommitEndTime;
                  mThreadCpuTime = nativeModulesThreadCpuTime;

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
              Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "acquiring mDispatchRunnablesLock")
          .arg("batchId", batchId)
          .flush();
      synchronized (mDispatchRunnablesLock) {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        mDispatchUIRunnables.add(runOperations);
      }

      // In the case where the frame callback isn't enqueued, the UI isn't being displayed or is
      // being
      // destroyed. In this case it's no longer important to align to frames, but it is important to
      // make
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
   * <p>ViewRootImpl#scheduleTraversals (which is called from invalidate, requestLayout, etc) calls
   * Looper#postSyncBarrier which keeps any UI thread looper messages from being processed until
   * that barrier is removed during the next traversal. That means, depending on when we get updates
   * from JS and what else is happening on the UI thread, we can sometimes try to post this runnable
   * after ViewRootImpl has posted a barrier.
   *
   * <p>Using a Choreographer callback (which runs immediately before traversals), we guarantee we
   * run before the next traversal.
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

      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this);
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
