/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.text.Layout
import android.text.Spanned
import android.text.style.ClickableSpan
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ViewGroup
import androidx.annotation.ColorInt
import androidx.annotation.DoNotInline
import androidx.annotation.RequiresApi
import androidx.core.view.ViewCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.ReactCompoundView
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.text.internal.span.ReactTagSpan
import kotlin.collections.ArrayList
import kotlin.math.roundToInt

/**
 * A custom version of Android's TextView, providing React Native with lower-level hooks for text
 * drawing, such as fine-grained control over clipping. PreparedLayoutTextView directly draws an
 * existing layout, previously generated for measurement by Fabric, to ensure consistency of
 * measurements, and avoid duplicate work.
 */
@DoNotStrip
internal class PreparedLayoutTextView(context: Context) : ViewGroup(context), ReactCompoundView {

  private var clickableSpans: List<ClickableSpan> = emptyList()
  private var selection: TextSelection? = null

  var preparedLayout: PreparedLayout? = null
    set(value) {
      if (field != value) {
        val lastSelection = selection
        if (lastSelection != null) {
          if (value != null && field?.layout?.text.toString() == value.layout.text.toString()) {
            value.layout.getSelectionPath(
                lastSelection.start, lastSelection.end, lastSelection.path)
          } else {
            clearSelection()
          }
        }

        clickableSpans = value?.layout?.text?.let { filterClickableSpans(it) } ?: emptyList()

        field = value
        invalidate()
      }
    }

  // T221698007: This is closest to existing behavior, but does not align with web. We may want to
  // change in the future if not too breaking.
  var overflow: Overflow = Overflow.HIDDEN
    set(value) {
      if (field != value) {
        field = value
        invalidate()
      }
    }

  @ColorInt var selectionColor: Int? = null

  val text: CharSequence?
    // Avoid mangling the getter name, to allow black box E2E tests to read text content via
    // reflection
    @DoNotStrip get() = preparedLayout?.layout?.text

  init {
    initView()
    // ViewGroup by default says only its children will draw
    setWillNotDraw(false)
  }

  private fun initView() {
    clickableSpans = emptyList()
    selection = null
    preparedLayout = null
  }

  fun recycleView(): Unit {
    initView()
    BackgroundStyleApplicator.reset(this)
    overflow = Overflow.HIDDEN
  }

  override fun onDraw(canvas: Canvas) {
    if (overflow != Overflow.VISIBLE) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    }

    super.onDraw(canvas)
    canvas.translate(
        paddingLeft.toFloat(), paddingTop.toFloat() + (preparedLayout?.verticalOffset ?: 0f))

    val layout = preparedLayout?.layout
    if (layout != null) {
      if (selection != null) {
        selectionPaint.setColor(
            selectionColor ?: DefaultStyleValuesUtil.getDefaultTextColorHighlight(context))
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        Api34Utils.draw(layout, canvas, selection?.path, selectionPaint)
      } else {
        layout.draw(canvas, selection?.path, selectionPaint, 0)
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // No-op
  }

  fun setSelection(start: Int, end: Int) {
    val layout = checkNotNull(preparedLayout).layout
    if (start < 0 || end > layout.text.length || start >= end) {
      throw IllegalArgumentException(
          "setSelection start and end are not in valid range. start: $start, end: $end, text length: ${layout.text.length}")
    }

    val textSelection = selection
    if (textSelection == null) {
      val selectionPath = Path()
      layout.getSelectionPath(start, end, selectionPath)
      selection = TextSelection(start, end, selectionPath)
    } else {
      textSelection.start = start
      textSelection.end = end
      layout.getSelectionPath(start, end, textSelection.path)
    }

    invalidate()
  }

  fun clearSelection() {
    selection = null
    invalidate()
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!isEnabled || clickableSpans.isEmpty()) {
      return super.onTouchEvent(event)
    }

    val action = event.actionMasked
    if (action == MotionEvent.ACTION_CANCEL) {
      clearSelection()
      return false
    }

    val x = event.x.toInt()
    val y = event.y.toInt()

    val clickableSpan = getSpanInCoords(x, y, ClickableSpan::class.java)

    if (clickableSpan == null) {
      clearSelection()
      return super.onTouchEvent(event)
    }

    if (action == MotionEvent.ACTION_UP) {
      clearSelection()
      clickableSpan.onClick(this)
    } else if (action == MotionEvent.ACTION_DOWN) {
      val layout = checkNotNull(preparedLayout).layout
      val start = (layout.text as Spanned).getSpanStart(clickableSpan)
      val end = (layout.text as Spanned).getSpanEnd(clickableSpan)
      setSelection(start, end)
    }

    return true
  }

  private fun <T> getSpanInCoords(x: Int, y: Int, clazz: Class<T>): T? {
    val offset = getTextOffsetAt(x, y)
    if (offset < 0) {
      return null
    }

    val spanned = text as? Spanned ?: return null

    val spans = spanned.getSpans(offset, offset, clazz)
    if (spans.isEmpty()) {
      return null
    }

    // When we have multiple spans marked with SPAN_EXCLUSIVE_INCLUSIVE next to each other, both
    // spans are returned by getSpans
    check(spans.size <= 2)
    for (span in spans) {
      val spanFlags = spanned.getSpanFlags(span)
      val inclusiveStart =
          if ((spanFlags and Spanned.SPAN_INCLUSIVE_INCLUSIVE) != 0 ||
              (spanFlags and Spanned.SPAN_INCLUSIVE_EXCLUSIVE) != 0) {
            spanned.getSpanStart(span)
          } else {
            spanned.getSpanStart(span) + 1
          }
      val inclusiveEnd =
          if ((spanFlags and Spanned.SPAN_INCLUSIVE_INCLUSIVE) != 0 ||
              (spanFlags and Spanned.SPAN_EXCLUSIVE_INCLUSIVE) != 0) {
            spanned.getSpanEnd(span)
          } else {
            spanned.getSpanEnd(span) - 1
          }

      if (offset >= inclusiveStart && offset <= inclusiveEnd) {
        return span
      }
    }

    return null
  }

  private fun getTextOffsetAt(x: Int, y: Int): Int {
    val layoutX = x - paddingLeft
    val layoutY = y - (paddingTop + (preparedLayout?.verticalOffset?.roundToInt() ?: 0))

    val layout = preparedLayout?.layout ?: return -1
    val line = layout.getLineForVertical(layoutY)

    val left: Float
    val right: Float

    if (layout.alignment == Layout.Alignment.ALIGN_CENTER) {
      /**
       * [Layout#getLineLeft] and [Layout#getLineRight] properly account for paragraph margins on
       * centered text.
       */
      left = layout.getLineLeft(line)
      right = layout.getLineRight(line)
    } else {
      /**
       * [Layout#getLineLeft] and [Layout#getLineRight] do NOT properly account for paragraph
       * margins on non-centered text, so we need an alternative.
       *
       * To determine the actual bounds of the line, we need the line's direction, leading margin,
       * and extent, but only the first is available directly. The margin is given by either
       * [Layout#getParagraphLeft] or [Layout#getParagraphRight] depending on line direction, and
       * [Layout#getLineMax] gives the extent *plus* the leading margin, so we can figure out the
       * rest from there.
       */
      val rtl = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT
      left =
          if (rtl) (layout.width - layout.getLineMax(line))
          else layout.getParagraphLeft(line).toFloat()
      right = if (rtl) layout.getParagraphRight(line).toFloat() else layout.getLineMax(line)
    }

    if (layoutX < left || layoutX > right) {
      return -1
    }

    return try {
      layout.getOffsetForHorizontal(line, layoutX.toFloat())
    } catch (e: ArrayIndexOutOfBoundsException) {
      // This happens for bidi text on Android 7-8.
      // See
      // https://android.googlesource.com/platform/frameworks/base/+/821e9bd5cc2be4b3210cb0226e40ba0f42b51aed
      -1
    }
  }

  public override fun dispatchHoverEvent(event: MotionEvent): Boolean =
      super.dispatchHoverEvent(event)

  public override fun onFocusChanged(
      gainFocus: Boolean,
      direction: Int,
      previouslyFocusedRect: Rect?
  ) {
    if (clickableSpans.isNotEmpty() && !gainFocus) {
      clearSelection()
    }
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    val accessibilityDelegateCompat = ViewCompat.getAccessibilityDelegate(this)
    if (accessibilityDelegateCompat != null &&
        accessibilityDelegateCompat is ReactTextViewAccessibilityDelegate) {
      accessibilityDelegateCompat.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    }
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    val accessibilityDelegateCompat = ViewCompat.getAccessibilityDelegate(this)
    val delegateHandled =
        accessibilityDelegateCompat is ReactTextViewAccessibilityDelegate &&
            accessibilityDelegateCompat.dispatchKeyEvent(event)

    return delegateHandled || super.dispatchKeyEvent(event)
  }

  // This potentially a lie, to avoid clipping outside of layout bounds when we are translucent, at
  // the cost of incorrect alpha blending.
  // TODO T225199534: Add support for "needsOffscreenAlphaCompositing" to Text
  override fun hasOverlappingRendering(): Boolean = false

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int =
      getSpanInCoords(touchX.roundToInt(), touchY.roundToInt(), ReactTagSpan::class.java)?.reactTag
          ?: id

  @RequiresApi(api = Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private object Api34Utils {
    private var highlightPaths: List<Path>? = null
    private var highlightPaints: List<Paint>? = null

    @DoNotInline
    fun draw(layout: Layout, canvas: Canvas, selectionPath: Path?, selectionPaint: Paint?) {
      if (selectionPath != null) {
        // Layout#drawHighlights noops when highlightPaths and highlightPaints are nulls
        // Passing empty lists to fix that
        if (highlightPaths == null) {
          highlightPaths = ArrayList()
        }
        if (highlightPaints == null) {
          highlightPaints = ArrayList()
        }
      }
      layout.draw(canvas, highlightPaths, highlightPaints, selectionPath, selectionPaint, 0)
    }
  }

  private class TextSelection(
      var start: Int,
      var end: Int,
      var path: Path,
  )

  private companion object {
    private val selectionPaint = Paint()

    private fun filterClickableSpans(text: CharSequence): List<ClickableSpan> {
      if (text !is Spanned) {
        return emptyList()
      }

      val spans = ArrayList<ClickableSpan>()
      var i = 0
      while (i < text.length) {
        val next = text.nextSpanTransition(i, text.length, ClickableSpan::class.java)
        spans.addAll(text.getSpans(i, next, ClickableSpan::class.java))
        i = next
      }

      return spans
    }
  }
}
