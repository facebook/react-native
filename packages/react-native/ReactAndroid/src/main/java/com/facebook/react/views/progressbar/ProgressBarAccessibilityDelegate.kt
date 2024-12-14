package com.facebook.react.views.progressbar

import android.view.View
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R

internal class ProgressBarAccessibilityDelegate : AccessibilityDelegateCompat() {
  override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
    super.onInitializeAccessibilityNodeInfo(host, info)

    val testId = host.getTag(R.id.react_test_id) as String?

    if (testId != null) {
      info.viewIdResourceName = testId
    }
  }
}
