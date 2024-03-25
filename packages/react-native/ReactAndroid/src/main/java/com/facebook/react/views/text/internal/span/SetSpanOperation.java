/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span;

import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import com.facebook.common.logging.FLog;

public class SetSpanOperation {
  private static final String TAG = "SetSpanOperation";
  static final int SPAN_MAX_PRIORITY = Spanned.SPAN_PRIORITY >> Spanned.SPAN_PRIORITY_SHIFT;

  protected int start, end;

  private final ReactSpan what;

  public SetSpanOperation(int start, int end, ReactSpan what) {
    this.start = start;
    this.end = end;
    this.what = what;
  }

  /**
   * @param sb builder
   * @param priorityIndex index of this operation in the topological sorting which puts operations
   *     with higher priority before operations with lower priority.
   */
  public void execute(SpannableStringBuilder sb, int priorityIndex) {
    assert priorityIndex >= 0;

    // All spans will automatically extend to the right of the text, but not the left - except
    // for spans that start at the beginning of the text.
    int spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
    if (start == 0) {
      spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;
    }

    // Calculate priority, assigning the highest values to operations with the highest priority
    final int priority = SPAN_MAX_PRIORITY - priorityIndex;

    if (priority < 0) {
      FLog.w(TAG, "Text tree size exceeded the limit, styling may become unpredictable");
    }

    // If the computed priority doesn't fit in the flags, clamp it. The effect might not be correct
    // in 100% of cases, but doing nothing (as we did in the past) leads to totally random results.
    final int effectivePriority = Math.max(priority, 0);

    spanFlags &= ~Spannable.SPAN_PRIORITY;
    spanFlags |= (effectivePriority << Spannable.SPAN_PRIORITY_SHIFT) & Spannable.SPAN_PRIORITY;

    sb.setSpan(what, start, end, spanFlags);
  }

  public ReactSpan getWhat() {
    return what;
  }
}
