/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Paint
import android.graphics.Rect
import android.os.Bundle
import android.text.Spanned
import android.text.style.AbsoluteSizeSpan
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat
import com.facebook.react.R
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import kotlin.math.ceil

internal class ReactTextViewAccessibilityDelegate : ReactAccessibilityDelegate {
  public constructor(
      view: View,
      originalFocus: Boolean,
      originalImportantForAccessibility: Int
  ) : super(view, originalFocus, originalImportantForAccessibility) {
    accessibilityLinks = hostView.getTag(R.id.accessibility_links) as AccessibilityLinks?
  }

  private var accessibilityLinks: AccessibilityLinks? = null

  public companion object {
    public fun setDelegate(
        view: View,
        originalFocus: Boolean,
        originalImportantForAccessibility: Int
    ) {
      // if a view already has an accessibility delegate, replacing it could cause
      // problems,so leave it alone.
      if (!ViewCompat.hasAccessibilityDelegate(view) &&
          (view.getTag(R.id.accessibility_role) != null ||
              view.getTag(R.id.accessibility_state) != null ||
              view.getTag(R.id.accessibility_actions) != null ||
              view.getTag(R.id.react_test_id) != null ||
              view.getTag(R.id.accessibility_collection_item) != null ||
              view.getTag(R.id.accessibility_links) != null ||
              view.getTag(R.id.role) != null)) {
        ViewCompat.setAccessibilityDelegate(
            view,
            ReactTextViewAccessibilityDelegate(
                view, originalFocus, originalImportantForAccessibility))
      }
    }

    public fun resetDelegate(
        view: View,
        originalFocus: Boolean,
        originalImportantForAccessibility: Int
    ) {
      ViewCompat.setAccessibilityDelegate(
          view,
          ReactTextViewAccessibilityDelegate(
              view, originalFocus, originalImportantForAccessibility))
    }
  }

  override fun onVirtualViewKeyboardFocusChanged(virtualViewId: Int, hasFocus: Boolean) {
    if (accessibilityLinks == null) {
      return
    }

    val link = accessibilityLinks?.getLinkById(virtualViewId) ?: return

    val span = getFirstSpan(link.start, link.end, ClickableSpan::class.java)
    if (span == null || span !is ReactClickableSpan || hostView !is ReactTextView) {
      return
    }

    // TODO: When we refactor ReactTextView, implement this using
    // https://developer.android.com/reference/android/text/Layout
    span.isKeyboardFocused = hasFocus
    span.focusBgColor = (hostView as TextView).highlightColor
    hostView.invalidate()
  }

  override fun onPerformActionForVirtualView(
      virtualViewId: Int,
      action: Int,
      arguments: Bundle?
  ): Boolean {
    if (accessibilityLinks == null) {
      return false
    }

    val link = accessibilityLinks?.getLinkById(virtualViewId) ?: return false

    val span = getFirstSpan(link.start, link.end, ClickableSpan::class.java)
    if (span == null || span !is ReactClickableSpan) {
      return false
    }

    if (action == AccessibilityNodeInfoCompat.ACTION_CLICK) {
      span.onClick(hostView)
      return true
    }

    return false
  }

  override fun getVisibleVirtualViews(virtualViewIds: MutableList<Int?>) {
    val accessibilityLinks = accessibilityLinks ?: return

    for (i in 0 until accessibilityLinks.size()) {
      virtualViewIds.add(i)
    }
  }

  override fun getVirtualViewAt(x: Float, y: Float): Int {
    val accessibilityLinks = accessibilityLinks ?: return INVALID_ID
    if (accessibilityLinks.size() == 0 || hostView !is TextView) {
      return INVALID_ID
    }

    var x = x
    var y = y

    val textView = hostView as TextView
    if (textView.text !is Spanned) {
      return INVALID_ID
    }

    val layout = textView.layout ?: return INVALID_ID

    x -= textView.totalPaddingLeft.toFloat()
    y -= textView.totalPaddingTop.toFloat()
    x += textView.scrollX.toFloat()
    y += textView.scrollY.toFloat()

    val line = layout.getLineForVertical(y.toInt())
    val charOffset = layout.getOffsetForHorizontal(line, x)

    val clickableSpan =
        getFirstSpan(charOffset, charOffset, ClickableSpan::class.java) ?: return INVALID_ID

    val spanned = textView.text as Spanned
    val start = spanned.getSpanStart(clickableSpan)
    val end = spanned.getSpanEnd(clickableSpan)

    val link: AccessibilityLinks.AccessibleLink? = accessibilityLinks.getLinkBySpanPos(start, end)
    return link?.id ?: INVALID_ID
  }

  protected fun <T> getFirstSpan(start: Int, end: Int, classType: Class<T>?): T? {
    if (hostView !is TextView || (hostView as TextView).text !is Spanned) {
      return null
    }

    val spanned = (hostView as TextView).text as Spanned
    val spans = spanned.getSpans(start, end, classType)
    return if (spans.isNotEmpty()) spans[0] else null
  }

  @Suppress("DEPRECATION")
  override fun onPopulateNodeForVirtualView(virtualViewId: Int, node: AccessibilityNodeInfoCompat) {
    // If we get an invalid virtualViewId for some reason (which is known to happen in API 19 and
    // below), return an "empty" node to prevent from crashing. This will never be presented to
    // the user, as Talkback filters out nodes with no content to announce.
    val accessibilityLinks = accessibilityLinks
    if (accessibilityLinks == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    val accessibleTextSpan: AccessibilityLinks.AccessibleLink? =
        accessibilityLinks.getLinkById(virtualViewId)
    if (accessibleTextSpan == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    // NOTE: The span may not actually have visible bounds within its parent,
    // due to line limits, etc.
    val bounds = getBoundsInParent(accessibleTextSpan)
    if (bounds == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    node.contentDescription = accessibleTextSpan.description
    node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK)
    node.setBoundsInParent(bounds)
    node.roleDescription = hostView.resources.getString(R.string.link_description)
    node.className = AccessibilityRole.getValue(AccessibilityRole.BUTTON)
  }

  private fun getBoundsInParent(accessibleLink: AccessibilityLinks.AccessibleLink): Rect? {
    // This view is not a text view, so return the entire views bounds.
    if (hostView !is TextView) {
      return Rect(0, 0, hostView.width, hostView.height)
    }

    val textView = hostView as TextView
    val textViewLayout = textView.layout ?: return Rect(0, 0, textView.width, textView.height)

    val startOffset = accessibleLink.start
    val endOffset = accessibleLink.end

    // Ensure the link hasn't been ellipsized away; in such cases,
    // getPrimaryHorizontal will crash (and the link isn't rendered anyway).
    val startOffsetLineNumber = textViewLayout.getLineForOffset(startOffset)
    val lineEndOffset = textViewLayout.getLineEnd(startOffsetLineNumber)
    if (startOffset > lineEndOffset) {
      return null
    }

    val rootRect = Rect()

    val startXCoordinates = textViewLayout.getPrimaryHorizontal(startOffset).toDouble()

    val paint = Paint()
    val sizeSpan =
        getFirstSpan(accessibleLink.start, accessibleLink.end, AbsoluteSizeSpan::class.java)
    val textSize = sizeSpan?.size?.toFloat() ?: textView.textSize
    paint.textSize = textSize
    val textWidth = ceil(paint.measureText(accessibleLink.description).toDouble()).toInt()

    val endOffsetLineNumber = textViewLayout.getLineForOffset(endOffset)
    val isMultiline = startOffsetLineNumber != endOffsetLineNumber
    textViewLayout.getLineBounds(startOffsetLineNumber, rootRect)

    val verticalOffset = textView.scrollY + textView.totalPaddingTop
    rootRect.top += verticalOffset
    rootRect.bottom += verticalOffset
    rootRect.left =
        (rootRect.left + (startXCoordinates + textView.totalPaddingLeft - textView.scrollX)).toInt()

    // The bounds for multi-line strings should *only* include the first line. This is because for
    // API 25 and below, Talkback's click is triggered at the center point of these bounds, and if
    // that center point is outside the spannable, it will click on something else. There is no
    // harm in not outlining the wrapped part of the string, as the text for the whole string will
    // be read regardless of the bounding box.
    if (isMultiline) {
      return Rect(rootRect.left, rootRect.top, rootRect.right, rootRect.bottom)
    }

    return Rect(rootRect.left, rootRect.top, rootRect.left + textWidth, rootRect.bottom)
  }

  override fun getAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? {
    // Only set a NodeProvider if we have virtual views, otherwise just return null here so that
    // we fall back to the View class's default behavior. If we don't do this, then Views with
    // no virtual children will fall back to using ExploreByTouchHelper's onPopulateNodeForHost
    // method to populate their AccessibilityNodeInfo, which defaults to doing nothing, so no
    // AccessibilityNodeInfo will be created. Alternatively, we could override
    // onPopulateNodeForHost instead, and have it create an AccessibilityNodeInfo for the host
    // but this is what the default View class does by itself, so we may as well defer to it.
    if (accessibilityLinks != null) {
      return superGetAccessibilityNodeProvider(host)
    }

    return null
  }

  public class AccessibilityLinks(text: Spanned) {
    private val links: List<AccessibleLink>

    init {
      val accessibleLinks = mutableListOf<AccessibleLink>()
      val spans = text.getSpans(0, text.length, ClickableSpan::class.java)
      spans.sortBy { text.getSpanStart(it) }
      for (i in spans.indices) {
        val span = spans[i]
        val start = text.getSpanStart(span)
        val end = text.getSpanEnd(span)
        // zero length spans, and out of range spans should not be included.
        if (start == end || start < 0 || end < 0 || start > text.length || end > text.length) {
          continue
        }

        val link = AccessibleLink()
        link.description = text.subSequence(start, end).toString()
        link.start = start
        link.end = end
        link.id = i
        accessibleLinks.add(link)
      }
      links = accessibleLinks
    }

    public fun getLinkById(id: Int): AccessibleLink? {
      for (link in links) {
        if (link.id == id) {
          return link
        }
      }

      return null
    }

    public fun getLinkBySpanPos(start: Int, end: Int): AccessibleLink? {
      for (link in links) {
        if (link.start == start && link.end == end) {
          return link
        }
      }

      return null
    }

    public fun size(): Int {
      return links.size
    }

    public class AccessibleLink {
      public var description: String? = null
      public var start: Int = 0
      public var end: Int = 0
      public var id: Int = 0
    }
  }
}
