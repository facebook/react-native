package com.facebook.react.views.text;

import android.text.Spannable;
import android.text.SpannableStringBuilder;

class SetSpanOperation {
  protected int start, end;
  protected ReactSpan what;

  SetSpanOperation(int start, int end, ReactSpan what) {
    this.start = start;
    this.end = end;
    this.what = what;
  }

  public void execute(SpannableStringBuilder sb, int priority) {
    // All spans will automatically extend to the right of the text, but not the left - except
    // for spans that start at the beginning of the text.
    int spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
    if (start == 0) {
      spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;
    }

    spanFlags &= ~Spannable.SPAN_PRIORITY;
    spanFlags |= (priority << Spannable.SPAN_PRIORITY_SHIFT) & Spannable.SPAN_PRIORITY;

    sb.setSpan(what, start, end, spanFlags);
  }
}
