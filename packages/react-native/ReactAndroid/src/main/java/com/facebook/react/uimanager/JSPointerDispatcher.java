/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.TouchTargetHelper.ViewTarget;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.PointerEvent;
import com.facebook.react.uimanager.events.PointerEventHelper;
import com.facebook.react.uimanager.events.PointerEventHelper.EVENT;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper;
import java.util.Collections;
import java.util.List;

/**
 * JSPointerDispatcher handles dispatching pointer events to JS from RootViews. If you implement
 * RootView you need to call handleMotionEvent from onTouchEvent, onInterceptTouchEvent,
 * onHoverEvent, onInterceptHoverEvent. It will correctly find the right view to handle the touch
 * and also dispatch the appropriate event to JS
 */
public class JSPointerDispatcher {

  private final float[] mTargetCoordinates = new float[2];
  private int mChildHandlingNativeGesture = -1;
  private long mDownStartTime = TouchEvent.UNSET;
  private final ViewGroup mRootViewGroup;
  private final TouchEventCoalescingKeyHelper mTouchEventCoalescingKeyHelper =
      new TouchEventCoalescingKeyHelper();

  private static final float ONMOVE_EPSILON = 0.1f;

  // Set globally for hover interactions, referenced for coalescing hover events
  private long mHoverInteractionKey = TouchEvent.UNSET;
  private List<ViewTarget> mLastHitPath = Collections.emptyList();
  private final float[] mLastEventCoordinates = new float[2];

  public JSPointerDispatcher(ViewGroup viewGroup) {
    mRootViewGroup = viewGroup;
  }

  public void onChildStartedNativeGesture(
      View childView, MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    if (mChildHandlingNativeGesture != -1 || childView == null) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return;
    }

    List<ViewTarget> hitPath =
        TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
            motionEvent.getX(), motionEvent.getY(), mRootViewGroup, mTargetCoordinates);
    dispatchCancelEvent(hitPath, motionEvent, eventDispatcher);
    mChildHandlingNativeGesture = childView.getId();
  }

  public void onChildEndedNativeGesture() {
    // There should be only one child gesture at any given time. We can safely turn off the flag.
    mChildHandlingNativeGesture = -1;
  }

  public void handleMotionEvent(MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    boolean supportsHover =
        PointerEventHelper.supportsHover(motionEvent.getToolType(motionEvent.getActionIndex()));

    int surfaceId = UIManagerHelper.getSurfaceId(mRootViewGroup);
    int action = motionEvent.getActionMasked();
    List<ViewTarget> hitPath =
        TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
            motionEvent.getX(), motionEvent.getY(), mRootViewGroup, mTargetCoordinates);

    if (hitPath.isEmpty()) {
      return;
    }

    TouchTargetHelper.ViewTarget activeViewTarget = hitPath.get(0);
    int activeTargetTag = activeViewTarget.getViewId();

    if (supportsHover) {
      if (action == MotionEvent.ACTION_HOVER_MOVE) {
        handleHoverEvent(motionEvent, eventDispatcher, surfaceId, hitPath);
        return;
      }

      // Ignore hover enter/exit because it's handled in `handleHoverEvent`
      if (action == MotionEvent.ACTION_HOVER_EXIT || action == MotionEvent.ACTION_HOVER_ENTER) {
        return;
      }
    }

    // First down pointer
    if (action == MotionEvent.ACTION_DOWN) {

      // Reset mChildHandlingNativeGesture like JSTouchDispatcher does
      mChildHandlingNativeGesture = -1;

      // Start a "down" coalescing key
      mDownStartTime = motionEvent.getEventTime();
      mTouchEventCoalescingKeyHelper.addCoalescingKey(mDownStartTime);

      if (!supportsHover) {
        dispatchNonBubblingEventForPathWhenListened(
            EVENT.ENTER,
            EVENT.ENTER_CAPTURE,
            hitPath,
            eventDispatcher,
            surfaceId,
            motionEvent,
            false);
      }

      boolean listeningForDown =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.DOWN, EVENT.DOWN_CAPTURE);
      if (listeningForDown) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_DOWN, surfaceId, activeTargetTag, motionEvent));
      }

      return;
    }

    // If the touch was intercepted by a child, we've already sent a cancel event to JS for this
    // gesture, so we shouldn't send any more pointer events related to it.
    if (mChildHandlingNativeGesture != -1) {
      return;
    }

    // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
    if (action == MotionEvent.ACTION_POINTER_DOWN) {
      mTouchEventCoalescingKeyHelper.incrementCoalescingKey(mDownStartTime);

      boolean listeningForDown =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.DOWN, EVENT.DOWN_CAPTURE);
      if (listeningForDown) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_DOWN, surfaceId, activeTargetTag, motionEvent));
      }

      return;
    }

    if (action == MotionEvent.ACTION_MOVE) {
      int coalescingKey = mTouchEventCoalescingKeyHelper.getCoalescingKey(mDownStartTime);

      boolean listeningForMove =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.MOVE, EVENT.MOVE_CAPTURE);
      if (listeningForMove) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_MOVE,
                surfaceId,
                activeTargetTag,
                motionEvent,
                coalescingKey));
      }

      return;
    }

    // Exactly one of the pointers goes up, not the last one
    if (action == MotionEvent.ACTION_POINTER_UP) {
      mTouchEventCoalescingKeyHelper.incrementCoalescingKey(mDownStartTime);

      boolean listeningForUp =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.UP, EVENT.UP_CAPTURE);
      if (listeningForUp) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_UP, surfaceId, activeTargetTag, motionEvent));
      }

      return;
    }

    // Last pointer comes up
    if (action == MotionEvent.ACTION_UP) {

      // End of a "down" coalescing key
      mTouchEventCoalescingKeyHelper.removeCoalescingKey(mDownStartTime);
      mDownStartTime = TouchEvent.UNSET;

      boolean listeningForUp =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.UP, EVENT.UP_CAPTURE);
      if (listeningForUp) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_UP, surfaceId, activeTargetTag, motionEvent));
      }

      if (!supportsHover) {
        dispatchNonBubblingEventForPathWhenListened(
            EVENT.LEAVE,
            EVENT.LEAVE_CAPTURE,
            hitPath,
            eventDispatcher,
            surfaceId,
            motionEvent,
            false);
      }
      return;
    }

    if (action == MotionEvent.ACTION_CANCEL) {
      dispatchCancelEvent(hitPath, motionEvent, eventDispatcher);
      return;
    }

    FLog.w(
        ReactConstants.TAG,
        "Warning : Motion Event was ignored. Action="
            + action
            + " Target="
            + activeTargetTag
            + " Supports Hover="
            + supportsHover);
  }

  private static boolean isAnyoneListeningForBubblingEvent(
      List<ViewTarget> hitPath, EVENT event, EVENT captureEvent) {
    for (ViewTarget viewTarget : hitPath) {
      if (PointerEventHelper.isListening(viewTarget.getView(), event)
          || PointerEventHelper.isListening(viewTarget.getView(), captureEvent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Dispatch event only if ancestor is listening to relevant capture event. This should only be
   * relevant for ENTER/LEAVE events that need to be dispatched along every relevant view in the hit
   * path.
   *
   * @param pointerEventType - Should only be ENTER/LEAVE events
   * @param hitPath - ViewTargets ordered from target -> root
   * @param dispatcher
   * @param surfaceId
   * @param motionEvent
   * @param forceDispatch - Ignore if ancestor is listening and force the event to be dispatched
   */
  private static void dispatchNonBubblingEventForPathWhenListened(
      EVENT event,
      EVENT captureEvent,
      List<ViewTarget> hitPath,
      EventDispatcher dispatcher,
      int surfaceId,
      MotionEvent motionEvent,
      boolean forceDispatch) {

    boolean ancestorListening = forceDispatch;
    String eventName = PointerEventHelper.getDispatchableEventName(event);
    if (eventName == null) {
      return;
    }

    // iterate through hitPath from ancestor -> target
    for (int i = hitPath.size() - 1; i >= 0; i--) {
      View view = hitPath.get(i).getView();
      int viewId = hitPath.get(i).getViewId();
      if (ancestorListening
          || (i == 0 && PointerEventHelper.isListening(view, event))
          || PointerEventHelper.isListening(view, captureEvent)) {
        dispatcher.dispatchEvent(PointerEvent.obtain(eventName, surfaceId, viewId, motionEvent));
        ancestorListening = true;
      }
    }
  }

  // called on hover_move motion events only
  private void handleHoverEvent(
      MotionEvent motionEvent,
      EventDispatcher eventDispatcher,
      int surfaceId,
      List<ViewTarget> hitPath) {

    int action = motionEvent.getActionMasked();
    if (action != MotionEvent.ACTION_HOVER_MOVE) {
      return;
    }

    float x = motionEvent.getX();
    float y = motionEvent.getY();

    boolean qualifiedMove =
        (Math.abs(mLastEventCoordinates[0] - x) > ONMOVE_EPSILON
            || Math.abs(mLastEventCoordinates[1] - y) > ONMOVE_EPSILON);

    // Early exit
    if (!qualifiedMove) {
      return;
    }

    // Set the interaction key if unset, to be used as a coalescing key for hover interactions
    if (mHoverInteractionKey < 0) {
      mHoverInteractionKey = motionEvent.getEventTime();
      mTouchEventCoalescingKeyHelper.addCoalescingKey(mHoverInteractionKey);
    }

    // If child is handling, eliminate target tags under handling child
    if (mChildHandlingNativeGesture > 0) {
      int index = 0;
      for (ViewTarget viewTarget : hitPath) {
        if (viewTarget.getViewId() == mChildHandlingNativeGesture) {
          hitPath.subList(0, index).clear();
          break;
        }
        index++;
      }
    }

    int targetTag = hitPath.isEmpty() ? -1 : hitPath.get(0).getViewId();
    // If targetTag is empty, we should bail?
    if (targetTag == -1) {
      return;
    }

    // hitState is list ordered from inner child -> parent tag
    // Traverse hitState back-to-front to find the first divergence with mLastHitState
    // FIXME: this may generate incorrect events when view collapsing changes the hierarchy
    boolean nonDivergentListeningToEnter = false;
    boolean nonDivergentListeningToLeave = false;
    int firstDivergentIndexFromBack = 0;
    while (firstDivergentIndexFromBack < Math.min(hitPath.size(), mLastHitPath.size())
        && hitPath
            .get(hitPath.size() - 1 - firstDivergentIndexFromBack)
            .equals(mLastHitPath.get(mLastHitPath.size() - 1 - firstDivergentIndexFromBack))) {

      // Track if any non-diverging views are listening to enter/leave
      View nonDivergentViewTargetView =
          hitPath.get(hitPath.size() - 1 - firstDivergentIndexFromBack).getView();
      if (!nonDivergentListeningToEnter
          && PointerEventHelper.isListening(nonDivergentViewTargetView, EVENT.ENTER_CAPTURE)) {
        nonDivergentListeningToEnter = true;
      }
      if (!nonDivergentListeningToLeave
          && PointerEventHelper.isListening(nonDivergentViewTargetView, EVENT.LEAVE_CAPTURE)) {
        nonDivergentListeningToLeave = true;
      }

      firstDivergentIndexFromBack++;
    }

    boolean hasDiverged =
        firstDivergentIndexFromBack < Math.max(hitPath.size(), mLastHitPath.size());

    if (hasDiverged) {
      // If something has changed in either enter/exit, let's start a new coalescing key
      mTouchEventCoalescingKeyHelper.incrementCoalescingKey(mHoverInteractionKey);

      List<ViewTarget> enterViewTargets =
          hitPath.subList(0, hitPath.size() - firstDivergentIndexFromBack);
      if (enterViewTargets.size() > 0) {
        dispatchNonBubblingEventForPathWhenListened(
            EVENT.ENTER,
            EVENT.ENTER_CAPTURE,
            enterViewTargets,
            eventDispatcher,
            surfaceId,
            motionEvent,
            nonDivergentListeningToEnter);
      }

      List<ViewTarget> exitViewTargets =
          mLastHitPath.subList(0, mLastHitPath.size() - firstDivergentIndexFromBack);
      if (exitViewTargets.size() > 0) {
        // child -> root
        dispatchNonBubblingEventForPathWhenListened(
            EVENT.LEAVE,
            EVENT.LEAVE_CAPTURE,
            enterViewTargets,
            eventDispatcher,
            surfaceId,
            motionEvent,
            nonDivergentListeningToLeave);
      }
    }

    int coalescingKey = mTouchEventCoalescingKeyHelper.getCoalescingKey(mHoverInteractionKey);
    boolean listeningToMove =
        isAnyoneListeningForBubblingEvent(hitPath, EVENT.MOVE, EVENT.MOVE_CAPTURE);
    if (listeningToMove) {
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_MOVE, surfaceId, targetTag, motionEvent, coalescingKey));
    }

    mLastHitPath = hitPath;
    mLastEventCoordinates[0] = x;
    mLastEventCoordinates[1] = y;
  }

  private void dispatchCancelEvent(
      List<ViewTarget> hitPath, MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.

    Assertions.assertCondition(
        mChildHandlingNativeGesture == -1,
        "Expected to not have already sent a cancel for this gesture");
    int surfaceId = UIManagerHelper.getSurfaceId(mRootViewGroup);

    if (!hitPath.isEmpty()) {
      boolean listeningForCancel =
          isAnyoneListeningForBubblingEvent(hitPath, EVENT.CANCEL, EVENT.CANCEL_CAPTURE);
      if (listeningForCancel) {
        int targetTag = hitPath.get(0).getViewId();
        Assertions.assertNotNull(eventDispatcher)
            .dispatchEvent(
                PointerEvent.obtain(
                    PointerEventHelper.POINTER_CANCEL, surfaceId, targetTag, motionEvent));
      }

      dispatchNonBubblingEventForPathWhenListened(
          EVENT.LEAVE,
          EVENT.LEAVE_CAPTURE,
          hitPath,
          eventDispatcher,
          surfaceId,
          motionEvent,
          false);

      mTouchEventCoalescingKeyHelper.removeCoalescingKey(mDownStartTime);
      mDownStartTime = TouchEvent.UNSET;
    }
  }
}
