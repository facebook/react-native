/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.ClickableSpan;
import android.view.View;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.view.ViewGroupClickEvent;

/**
 * This class is used in {@link TextLayoutManager} to linkify and style a span of text with
 * accessibilityRole="link". This is needed to make nested Text components accessible.
 *
 * <p>For example, if your React component looks like this:
 *
 * <pre>{@code
 * <Text>
 *   Some text with
 *   <Text onPress={onPress} accessible={true} accessibilityRole="link">a link</Text>
 *   in the middle.
 * </Text>
 * }</pre>
 *
 * then only one {@link ReactTextView} will be created, for the parent. The child Text component
 * does not exist as a native view, and therefore has no accessibility properties. Instead, we have
 * to use spans on the parent's {@link ReactTextView} to properly style the child, and to make it
 * accessible (TalkBack announces that the text has links available, and the links are exposed in
 * the context menu).
 */
class ReactClickableSpan extends ClickableSpan implements ReactSpan {

  private final int mReactTag;
  private final int mForegroundColor;

  ReactClickableSpan(int reactTag, int foregroundColor) {
    mReactTag = reactTag;
    mForegroundColor = foregroundColor;
  }

  @Override
  public void onClick(@NonNull View view) {
    ReactContext context = (ReactContext) view.getContext();
    EventDispatcher eventDispatcher =
        UIManagerHelper.getEventDispatcherForReactTag(context, mReactTag);
    if (eventDispatcher != null) {
      eventDispatcher.dispatchEvent(
          new ViewGroupClickEvent(UIManagerHelper.getSurfaceId(context), mReactTag));
    }
  }

  @Override
  public void updateDrawState(@NonNull TextPaint ds) {
    super.updateDrawState(ds);
    ds.setColor(mForegroundColor);
    ds.setUnderlineText(false);
  }

  public int getReactTag() {
    return mReactTag;
  }
}
