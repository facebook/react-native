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
import com.facebook.react.uimanager.events.PointerEvent.PointerEventState;
import com.facebook.react.uimanager.events.PointerEventHelper;
import com.facebook.react.uimanager.events.PointerEventHelper.EVENT;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * JSPointerDispatcher handles dispatching pointer events to JS from RootViews. If you implement
 * RootView you need to call handleMotionEvent from onTouchEvent, onInterceptTouchEvent,
 * onHoverEvent, onInterceptHoverEvent. It will correctly find the right view to handle the touch
 * and also dispatch the appropriate event to JS
 */
public class JSPointerDispatcher {
  private static final int UNSET_POINTER_ID = -1;
  private static final float ONMOVE_EPSILON = 0.1f;
  private static final String TAG = "POINTER EVENTS";

  private Map<Integer, List<ViewTarget>> mLastHitPathByPointerId;
  private Map<Integer, float[]> mLastEventCoordinatesByPointerId;

  private int mChildHandlingNativeGesture = -1;
  private int mPrimaryPointerId = UNSET_POINTER_ID;
  private int mCoalescingKey = 0;
  private int mLastButtonState = 0;
  private final ViewGroup mRootViewGroup;

  // Set globally for hover interactions, referenced for coalescing hover events

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

    dispatchCancelEvent(motionEvent, eventDispatcher);
    mChildHandlingNativeGesture = childView.getId();
  }

  public void onChildEndedNativeGesture() {
    // There should be only one child gesture at any given time. We can safely turn off the flag.
    mChildHandlingNativeGesture = -1;
  }

  private void onUp(
      int activeTargetTag,
      PointerEventState eventState,
      MotionEvent motionEvent,
      EventDispatcher eventDispatcher) {

    List<ViewTarget> activeHitPath =
        eventState.getHitPathByPointerId().get(eventState.getActivePointerId());

    boolean supportsHover = PointerEventHelper.supportsHover(motionEvent);
    boolean listeningForUp =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.UP, EVENT.UP_CAPTURE);
    if (listeningForUp) {
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_UP, activeTargetTag, eventState, motionEvent));
    }

    if (!supportsHover) {
      boolean listeningForOut =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OUT, EVENT.OUT_CAPTURE);
      if (listeningForOut) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_OUT, activeTargetTag, eventState, motionEvent));
      }

      List<ViewTarget> leaveViewTargets =
          filterByShouldDispatch(activeHitPath, EVENT.LEAVE, EVENT.LEAVE_CAPTURE, false);

      // target -> root
      dispatchEventForViewTargets(
          PointerEventHelper.POINTER_LEAVE,
          eventState,
          motionEvent,
          leaveViewTargets,
          eventDispatcher);
    }

    if (motionEvent.getActionMasked() == MotionEvent.ACTION_UP) {
      mPrimaryPointerId = UNSET_POINTER_ID;
    }
  }

  private void incrementCoalescingKey() {
    mCoalescingKey = (mCoalescingKey + 1) % Integer.MAX_VALUE;
  }

  private short getCoalescingKey() {
    return ((short) (0xffff & mCoalescingKey));
  }

  private void onDown(
      int activeTargetTag,
      PointerEventState eventState,
      MotionEvent motionEvent,
      EventDispatcher eventDispatcher) {

    List<ViewTarget> activeHitPath =
        eventState.getHitPathByPointerId().get(eventState.getActivePointerId());

    incrementCoalescingKey();
    boolean supportsHover = PointerEventHelper.supportsHover(motionEvent);
    if (!supportsHover) {
      // Indirect OVER event dispatches before ENTER
      boolean listeningForOver =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OVER, EVENT.OVER_CAPTURE);
      if (listeningForOver) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_OVER, activeTargetTag, eventState, motionEvent));
      }

      List<ViewTarget> enterViewTargets =
          filterByShouldDispatch(activeHitPath, EVENT.ENTER, EVENT.ENTER_CAPTURE, false);

      // Dispatch root -> target, we need to reverse order of enterViewTargets
      Collections.reverse(enterViewTargets);
      dispatchEventForViewTargets(
          PointerEventHelper.POINTER_ENTER,
          eventState,
          motionEvent,
          enterViewTargets,
          eventDispatcher);
    }

    boolean listeningForDown =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.DOWN, EVENT.DOWN_CAPTURE);
    if (listeningForDown) {
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_DOWN, activeTargetTag, eventState, motionEvent));
    }
  }

  private PointerEventState createEventState(MotionEvent motionEvent) {
    int activeIndex = motionEvent.getActionIndex();

    Map<Integer, float[]> offsetByPointerId = new HashMap<Integer, float[]>();
    Map<Integer, List<ViewTarget>> hitPathByPointerId = new HashMap<Integer, List<ViewTarget>>();
    Map<Integer, float[]> eventCoordinatesByPointerId = new HashMap<Integer, float[]>();
    for (int index = 0; index < motionEvent.getPointerCount(); index++) {
      float[] offsetCoordinates = new float[2];
      float[] eventCoordinates = new float[] {motionEvent.getX(index), motionEvent.getY(index)};
      List<ViewTarget> hitPath =
          TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
              eventCoordinates[0], eventCoordinates[1], mRootViewGroup, offsetCoordinates);

      int pointerId = motionEvent.getPointerId(index);
      offsetByPointerId.put(pointerId, offsetCoordinates);
      hitPathByPointerId.put(pointerId, hitPath);
      eventCoordinatesByPointerId.put(pointerId, eventCoordinates);
    }

    int activePointerId = motionEvent.getPointerId(activeIndex);
    int surfaceId = UIManagerHelper.getSurfaceId(mRootViewGroup);

    return new PointerEventState(
        mPrimaryPointerId,
        activePointerId,
        mLastButtonState,
        surfaceId,
        offsetByPointerId,
        hitPathByPointerId,
        eventCoordinatesByPointerId);
  }

  public void handleMotionEvent(MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    // Don't fire any pointer events if child view is handling native gesture
    if (mChildHandlingNativeGesture != -1) {
      return;
    }

    int action = motionEvent.getActionMasked();
    if (action == MotionEvent.ACTION_DOWN) {
      mPrimaryPointerId = motionEvent.getPointerId(0);
    }

    PointerEventState eventState = createEventState(motionEvent);
    List<ViewTarget> activeHitPath =
        eventState.getHitPathByPointerId().get(eventState.getActivePointerId());

    if (activeHitPath == null || activeHitPath.isEmpty()) {
      return;
    }

    TouchTargetHelper.ViewTarget activeViewTarget = activeHitPath.get(0);
    int activeTargetTag = activeViewTarget.getViewId();

    switch (action) {
      case MotionEvent.ACTION_DOWN:
      case MotionEvent.ACTION_POINTER_DOWN:
        onDown(activeTargetTag, eventState, motionEvent, eventDispatcher);
        break;
      case MotionEvent.ACTION_HOVER_MOVE:
        // TODO(luwe) - converge this with ACTION_MOVE
        // HOVER_MOVE may occur before DOWN. Add its downTime as a coalescing key
        onMove(activeTargetTag, eventState, motionEvent, eventDispatcher);
        break;
      case MotionEvent.ACTION_MOVE:
        // TODO(luwe) - converge this with ACTION_HOVER_MOVE
        boolean listeningForMove =
            isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.MOVE, EVENT.MOVE_CAPTURE);
        if (listeningForMove) {
          eventDispatcher.dispatchEvent(
              PointerEvent.obtain(
                  PointerEventHelper.POINTER_MOVE,
                  activeTargetTag,
                  eventState,
                  motionEvent,
                  getCoalescingKey()));
        }
        break;
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_POINTER_UP:
        incrementCoalescingKey();
        onUp(activeTargetTag, eventState, motionEvent, eventDispatcher);
        break;
      case MotionEvent.ACTION_CANCEL:
        dispatchCancelEvent(eventState, motionEvent, eventDispatcher);
        break;
      case MotionEvent.ACTION_HOVER_ENTER:
      case MotionEvent.ACTION_HOVER_EXIT:
        // These are handled by HOVER_MOVE
        break;
      default:
        FLog.w(
            ReactConstants.TAG,
            "Motion Event was ignored. Action=" + action + " Target=" + activeTargetTag);
        return;
    }

    mLastHitPathByPointerId = eventState.getHitPathByPointerId();
    mLastEventCoordinatesByPointerId = eventState.getEventCoordinatesByPointerId();
    mLastButtonState = motionEvent.getButtonState();
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
   * Returns list of view targets that we should be dispatching events from
   *
   * @param viewTargets, ordered from target -> root
   * @param bubble, name of event that bubbles. Should only ever be enter or leave
   * @param capture, name of event that captures. Should only ever be enter or leave
   * @param forceDispatch, if true, all viewTargets should dispatch
   * @return list of viewTargets filtered from target -> root
   */
  private static List<ViewTarget> filterByShouldDispatch(
      List<ViewTarget> viewTargets, EVENT bubble, EVENT capture, boolean forceDispatch) {

    List<ViewTarget> dispatchableViewTargets = new ArrayList<>(viewTargets);
    if (forceDispatch) {
      return dispatchableViewTargets;
    }

    boolean ancestorListening = false;

    // Start to filter which viewTargets may not need to dispatch an event
    for (int i = viewTargets.size() - 1; i >= 0; i--) {
      ViewTarget viewTarget = viewTargets.get(i);
      View view = viewTarget.getView();

      if (!ancestorListening
          && !PointerEventHelper.isListening(view, capture)
          && !PointerEventHelper.isListening(view, bubble)) {
        dispatchableViewTargets.remove(i);
      } else if (!ancestorListening && PointerEventHelper.isListening(view, capture)) {
        ancestorListening = true;
      }
    }
    return dispatchableViewTargets;
  }

  private void dispatchEventForViewTargets(
      String eventName,
      PointerEventState eventState,
      MotionEvent motionEvent,
      List<ViewTarget> viewTargets,
      EventDispatcher dispatcher) {

    for (ViewTarget viewTarget : viewTargets) {
      int viewId = viewTarget.getViewId();
      dispatcher.dispatchEvent(PointerEvent.obtain(eventName, viewId, eventState, motionEvent));
    }
  }

  // called on hover_move motion events only
  private void onMove(
      int targetTag,
      PointerEventState eventState,
      MotionEvent motionEvent,
      EventDispatcher eventDispatcher) {

    int activePointerId = eventState.getActivePointerId();
    float[] eventCoordinates = eventState.getEventCoordinatesByPointerId().get(activePointerId);
    List<ViewTarget> activeHitPath = eventState.getHitPathByPointerId().get(activePointerId);

    List<ViewTarget> lastHitPath =
        mLastHitPathByPointerId != null && mLastHitPathByPointerId.containsKey(activePointerId)
            ? mLastHitPathByPointerId.get(activePointerId)
            : new ArrayList<ViewTarget>();

    float[] lastEventCoordinates =
        mLastEventCoordinatesByPointerId != null
                && mLastEventCoordinatesByPointerId.containsKey(activePointerId)
            ? mLastEventCoordinatesByPointerId.get(activePointerId)
            : new float[] {0, 0};

    boolean qualifiedMove =
        (Math.abs(lastEventCoordinates[0] - eventCoordinates[0]) > ONMOVE_EPSILON
            || Math.abs(lastEventCoordinates[1] - eventCoordinates[1]) > ONMOVE_EPSILON);

    // Early exit if active pointer has not moved enough
    if (!qualifiedMove) {
      return;
    }

    // hitState is list ordered from inner child -> parent tag
    // Traverse hitState back-to-front to find the first divergence with lastHitPath
    // FIXME: this may generate incorrect events when view collapsing changes the hierarchy
    boolean nonDivergentListeningToEnter = false;
    boolean nonDivergentListeningToLeave = false;
    int firstDivergentIndexFromBack = 0;
    while (firstDivergentIndexFromBack < Math.min(activeHitPath.size(), lastHitPath.size())
        && activeHitPath
            .get(activeHitPath.size() - 1 - firstDivergentIndexFromBack)
            .equals(lastHitPath.get(lastHitPath.size() - 1 - firstDivergentIndexFromBack))) {

      // Track if any non-diverging views are listening to enter/leave
      View nonDivergentViewTargetView =
          activeHitPath.get(activeHitPath.size() - 1 - firstDivergentIndexFromBack).getView();
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
        firstDivergentIndexFromBack < Math.max(activeHitPath.size(), lastHitPath.size());

    if (hasDiverged) {
      // If something has changed in either enter/exit, let's start a new coalescing key
      incrementCoalescingKey();

      // Out, Leave events
      if (lastHitPath.size() > 0) {
        int lastTargetTag = lastHitPath.get(0).getViewId();
        boolean listeningForOut =
            isAnyoneListeningForBubblingEvent(lastHitPath, EVENT.OUT, EVENT.OUT_CAPTURE);
        if (listeningForOut) {
          eventDispatcher.dispatchEvent(
              PointerEvent.obtain(
                  PointerEventHelper.POINTER_OUT, lastTargetTag, eventState, motionEvent));
        }

        // target -> root
        List<ViewTarget> leaveViewTargets =
            filterByShouldDispatch(
                lastHitPath.subList(0, lastHitPath.size() - firstDivergentIndexFromBack),
                EVENT.LEAVE,
                EVENT.LEAVE_CAPTURE,
                nonDivergentListeningToLeave);
        if (leaveViewTargets.size() > 0) {
          // We want to dispatch from target -> root, so no need to reverse
          dispatchEventForViewTargets(
              PointerEventHelper.POINTER_LEAVE,
              eventState,
              motionEvent,
              leaveViewTargets,
              eventDispatcher);
        }
      }

      boolean listeningForOver =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OVER, EVENT.OVER_CAPTURE);
      if (listeningForOver) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_OVER, targetTag, eventState, motionEvent));
      }

      // target -> root
      List<ViewTarget> enterViewTargets =
          filterByShouldDispatch(
              activeHitPath.subList(0, activeHitPath.size() - firstDivergentIndexFromBack),
              EVENT.ENTER,
              EVENT.ENTER_CAPTURE,
              nonDivergentListeningToEnter);

      if (enterViewTargets.size() > 0) {
        // We want to iterate these from root -> target so we need to reverse
        Collections.reverse(enterViewTargets);
        dispatchEventForViewTargets(
            PointerEventHelper.POINTER_ENTER,
            eventState,
            motionEvent,
            enterViewTargets,
            eventDispatcher);
      }
    }

    boolean listeningToMove =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.MOVE, EVENT.MOVE_CAPTURE);
    if (listeningToMove) {
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_MOVE,
              targetTag,
              eventState,
              motionEvent,
              getCoalescingKey()));
    }
  }

  private void dispatchCancelEvent(MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    Assertions.assertCondition(
        mChildHandlingNativeGesture == -1,
        "Expected to not have already sent a cancel for this gesture");

    PointerEventState eventState = createEventState(motionEvent);
    dispatchCancelEvent(eventState, motionEvent, eventDispatcher);
  }

  private void dispatchCancelEvent(
      PointerEventState eventState, MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
    Assertions.assertCondition(
        mChildHandlingNativeGesture == -1,
        "Expected to not have already sent a cancel for this gesture");

    List<ViewTarget> activeHitPath =
        eventState.getHitPathByPointerId().get(eventState.getActivePointerId());

    if (!activeHitPath.isEmpty()) {
      boolean listeningForCancel =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.CANCEL, EVENT.CANCEL_CAPTURE);
      if (listeningForCancel) {
        int targetTag = activeHitPath.get(0).getViewId();
        Assertions.assertNotNull(eventDispatcher)
            .dispatchEvent(
                PointerEvent.obtain(
                    PointerEventHelper.POINTER_CANCEL, targetTag, eventState, motionEvent));
      }

      // TODO(luwe) - Need to fire pointer out here as well:
      // https://w3c.github.io/pointerevents/#dfn-suppress-a-pointer-event-stream
      List<ViewTarget> leaveViewTargets =
          filterByShouldDispatch(activeHitPath, EVENT.LEAVE, EVENT.LEAVE_CAPTURE, false);

      // dispatch from target -> root
      dispatchEventForViewTargets(
          PointerEventHelper.POINTER_LEAVE,
          eventState,
          motionEvent,
          leaveViewTargets,
          eventDispatcher);

      incrementCoalescingKey();
      mPrimaryPointerId = UNSET_POINTER_ID;
    }
  }

  private void debugPrintHitPath(List<ViewTarget> hitPath) {
    StringBuilder builder = new StringBuilder("hitPath: ");
    for (ViewTarget viewTarget : hitPath) {
      builder.append(String.format("%d, ", viewTarget.getViewId()));
    }

    FLog.d(TAG, builder.toString());
  }
}
