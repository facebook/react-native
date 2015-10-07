/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;
import javax.annotation.concurrent.GuardedBy;

import java.util.ArrayList;

import com.facebook.react.animation.Animation;
import com.facebook.react.animation.AnimationRegistry;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

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

  private final int[] mMeasureBuffer = new int[4];

  /**
   * A mutation or animation operation on the view hierarchy.
   */
  private interface UIOperation {

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

    private final CatalystStylesDiffMap mProps;

    private UpdatePropertiesOperation(int tag, CatalystStylesDiffMap props) {
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
   * and size values by CSSNode hierarchy.
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
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateLayout(mParentTag, mTag, mX, mY, mWidth, mHeight);
    }
  }

  private final class CreateViewOperation extends ViewOperation {

    private final int mRootViewTagForContext;
    private final String mClassName;
    private final @Nullable CatalystStylesDiffMap mInitialProps;

    public CreateViewOperation(
        int rootViewTagForContext,
        int tag,
        String className,
        @Nullable CatalystStylesDiffMap initialProps) {
      super(tag);
      mRootViewTagForContext = rootViewTagForContext;
      mClassName = className;
      mInitialProps = initialProps;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.createView(
          mRootViewTagForContext,
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

    private final boolean mBlockNativeResponder;
    private final boolean mClearResponder;

    public ChangeJSResponderOperation(
        int tag,
        boolean clearResponder,
        boolean blockNativeResponder) {
      super(tag);
      mClearResponder = clearResponder;
      mBlockNativeResponder = blockNativeResponder;
    }

    @Override
    public void execute() {
      if (!mClearResponder) {
        mNativeViewHierarchyManager.setJSResponder(mTag, mBlockNativeResponder);
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
    private final Callback mSuccess;

    public ShowPopupMenuOperation(
        int tag,
        ReadableArray items,
        Callback success) {
      super(tag);
      mItems = items;
      mSuccess = success;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.showPopupMenu(mTag, mItems, mSuccess);
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

  private ArrayList<UIOperation> mOperations = new ArrayList<>();

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

  private final UIManagerModule mUIManagerModule;
  private final NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final AnimationRegistry mAnimationRegistry;

  private final Object mDispatchRunnablesLock = new Object();
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;

  @GuardedBy("mDispatchRunnablesLock")
  private final ArrayList<Runnable> mDispatchUIRunnables = new ArrayList<>();

  /* package */ UIViewOperationQueue(
      ReactApplicationContext reactContext,
      UIManagerModule uiManagerModule,
      NativeViewHierarchyManager nativeViewHierarchyManager,
      AnimationRegistry animationRegistry) {
    mUIManagerModule = uiManagerModule;
    mNativeViewHierarchyManager = nativeViewHierarchyManager;
    mAnimationRegistry = animationRegistry;
    mDispatchUIFrameCallback = new DispatchUIFrameCallback(reactContext);
  }

  public boolean isEmpty() {
    return mOperations.isEmpty();
  }

  public void enqueueRemoveRootView(int rootViewTag) {
    mOperations.add(new RemoveRootViewOperation(rootViewTag));
  }

  public void enqueueSetJSResponder(int reactTag, boolean blockNativeResponder) {
    mOperations.add(
        new ChangeJSResponderOperation(reactTag, false /*clearResponder*/, blockNativeResponder));
  }

  public void enqueueClearJSResponder() {
    // Tag is 0 because JSResponderHandler doesn't need one in order to clear the responder.
    mOperations.add(new ChangeJSResponderOperation(0, true /*clearResponder*/, false));
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
    mOperations.add(new ShowPopupMenuOperation(reactTag, items, success));
  }

  public void enqueueCreateView(
      int rootViewTagForContext,
      int viewReactTag,
      String viewClassName,
      @Nullable CatalystStylesDiffMap initialProps) {
    mOperations.add(
        new CreateViewOperation(
            rootViewTagForContext,
            viewReactTag,
            viewClassName,
            initialProps));
  }

  public void enqueueUpdateProperties(int reactTag, String className, CatalystStylesDiffMap props) {
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

  public void enqueueMeasure(
      final int reactTag,
      final Callback callback) {
    mOperations.add(
        new MeasureOperation(reactTag, callback));
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

  /* package */ void dispatchViewUpdates(final int batchId) {
    // Store the current operation queues to dispatch and create new empty ones to continue
    // receiving new operations
    final ArrayList<UIOperation> operations = mOperations.isEmpty() ? null : mOperations;
    if (operations != null) {
      mOperations = new ArrayList<>();
    }

    mUIManagerModule.notifyOnViewHierarchyUpdateEnqueued();

    synchronized (mDispatchRunnablesLock) {
      mDispatchUIRunnables.add(
          new Runnable() {
             @Override
             public void run() {
               SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "DispatchUI")
                   .arg("BatchId", batchId)
                   .flush();
               try {
                 if (operations != null) {
                   for (int i = 0; i < operations.size(); i++) {
                     operations.get(i).execute();
                   }
                 }
                 mUIManagerModule.notifyOnViewHierarchyUpdateFinished();
               } finally {
                 Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
               }
             }
           });
    }
  }

  /* package */ void resumeFrameCallback() {
    ReactChoreographer.getInstance()
        .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
  }

  /* package */ void pauseFrameCallback() {

    ReactChoreographer.getInstance()
        .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
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
  private class DispatchUIFrameCallback extends GuardedChoreographerFrameCallback {

    private DispatchUIFrameCallback(ReactContext reactContext) {
      super(reactContext);
    }

    @Override
    public void doFrameGuarded(long frameTimeNanos) {
      synchronized (mDispatchRunnablesLock) {
        for (int i = 0; i < mDispatchUIRunnables.size(); i++) {
          mDispatchUIRunnables.get(i).run();
        }
        mDispatchUIRunnables.clear();
      }

      ReactChoreographer.getInstance().postFrameCallback(
          ReactChoreographer.CallbackType.DISPATCH_UI, this);
    }
  }
}
