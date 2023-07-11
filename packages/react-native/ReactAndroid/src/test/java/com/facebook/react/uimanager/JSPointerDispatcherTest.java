/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.graphics.Rect;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.PointerEventHelper;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatcher;
import org.mockito.Mockito;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
public class JSPointerDispatcherTest {

  private ViewGroup mRoot;
  private JSPointerDispatcher mPointerDispatcher;

  class EventWithName implements ArgumentMatcher<Event> {
    private String mEventName;

    public EventWithName(String eventName) {
      mEventName = eventName;
    }

    @Override
    public boolean matches(Event argument) {
      return argument.getEventName().equals(mEventName);
    }

    @Override
    public String toString() {
      return "[event with name: " + mEventName + "]";
    }
  }

  @Before
  public void setupViewHierarchy() {
    Context ctx = RuntimeEnvironment.getApplication();
    mRoot = new LinearLayout(ctx);
    TextView childView = new TextView(ctx);
    childView.append("Hello, world!");
    // need > 0 ID to consider it as a react view (see
    // TouchTargetHelper::findTargetPathAndCoordinatesForTouch)
    childView.setId(100);
    mRoot.addView(childView);
    // needed for test to ensure that child has dimensions
    mRoot.measure(500, 500);
    mRoot.layout(0, 0, 500, 500);
    mPointerDispatcher = new JSPointerDispatcher(mRoot);
  }

  private static MotionEvent createMotionEvent(int action, float x, float y) {
    long downTime = SystemClock.uptimeMillis();
    long eventTime = downTime;
    int metaState = 0; // no modifiers pressed

    return MotionEvent.obtain(downTime, eventTime, action, x, y, metaState);
  }

  private Rect getChildViewRectInRootCoordinates(int childIndex) {
    View child = mRoot.getChildAt(childIndex);
    Rect outRect = new Rect();
    child.getDrawingRect(outRect);

    mRoot.offsetDescendantRectToMyCoords(child, outRect);

    return outRect;
  }

  @Test
  public void testPointerEnter() {
    Rect childRect = getChildViewRectInRootCoordinates(0);
    MotionEvent ev =
        createMotionEvent(MotionEvent.ACTION_DOWN, childRect.centerX(), childRect.centerY());
    EventDispatcher mockDispatcher = Mockito.mock(EventDispatcher.class);
    mPointerDispatcher.handleMotionEvent(ev, mockDispatcher, false);
    Mockito.verify(mockDispatcher)
        .dispatchEvent(Mockito.argThat(new EventWithName(PointerEventHelper.POINTER_DOWN)));
  }
}
