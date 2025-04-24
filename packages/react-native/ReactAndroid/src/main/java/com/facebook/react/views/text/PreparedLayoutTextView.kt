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
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.style.Overflow
import kotlin.collections.ArrayList

/**
 * A custom version of Android's TextView, providing React Native with lower-level hooks for text
 * drawing, such as fine-grained control over clipping. PreparedLayoutTextView directly draws an
 * existing layout, previously generated for measurement by Fabric, to ensure consistency of
 * measurements, and avoid duplicate work.
 */
internal class PreparedLayoutTextView(context: Context) : ViewGroup(context) {

  private var clickableSpans: List<ClickableSpan> = emptyList()
  private var selection: TextSelection? = null

  public var layout: Layout? = null
    set(value) {
      if (field != value) {
        val lastSelection = selection
        if (lastSelection != null) {
          if (value != null && field?.text.toString() == value.text.toString()) {
            value.getSelectionPath(lastSelection.start, lastSelection.end, lastSelection.path)
          } else {
            clearSelection()
          }
        }

        clickableSpans = value?.text?.let { filterClickableSpans(it) } ?: emptyList()

        // T221698736: This and `accessible` prop can clobber each other, and ShadowTree does not
        // know
        // about this. Need to figure out desired behavior for controlling implicit focusability.
        isFocusable = clickableSpans.isNotEmpty()

        field = value
        invalidate()
      }
    }

  // T221698007: This is closest to existing behavior, but does not align with web. We may want to
  // change in the future if not too breaking.
  public var overflow: Overflow = Overflow.HIDDEN
    set(value) {
      if (field != value) {
        field = value
        invalidate()
      }
    }

  public @ColorInt var selectionColor: Int? = null

  public val text: CharSequence?
    get() = layout?.text

  init {
    initView()
    // ViewGroup by default says only its children will draw
    setWillNotDraw(false)
  }

  private fun initView() {
    clickableSpans = emptyList()
    selection = null
    layout = null
  }

  public fun recycleView(): Unit {
    initView()
    BackgroundStyleApplicator.reset(this)
    isFocusable = false
    overflow = Overflow.HIDDEN
  }

  override fun onDraw(canvas: Canvas) {
    if (overflow != Overflow.VISIBLE) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    }

    super.onDraw(canvas)
    canvas.translate(paddingLeft.toFloat(), paddingTop.toFloat())

    val textLayout = layout
    if (textLayout != null) {
      if (selection != null) {
        selectionPaint.setColor(
            selectionColor ?: DefaultStyleValuesUtil.getDefaultTextColorHighlight(context))
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        Api34Utils.draw(textLayout, canvas, selection?.path, selectionPaint)
      } else {
        textLayout.draw(canvas, selection?.path, selectionPaint, 0)
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // No-op
  }

  private fun setSelection(span: ClickableSpan) {
    val textLayout = checkNotNull(layout)
    val start = (textLayout.text as Spanned).getSpanStart(span)
    val end = (textLayout.text as Spanned).getSpanEnd(span)

    val textSelection = selection
    if (textSelection == null) {
      val selectionPath = Path()
      textLayout.getSelectionPath(start, end, selectionPath)
      selection = TextSelection(start, end, selectionPath)
    } else {
      textSelection.start = start
      textSelection.end = end
      textLayout.getSelectionPath(start, end, textSelection.path)
    }

    invalidate()
  }

  private fun clearSelection() {
    selection = null
    invalidate()
  }

  // T222163602: We should reconcile this hit testing with ReactCompoundView hit testing
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

    val clickedSpan = getClickableSpanInCoords(x, y)

    if (clickedSpan == null) {
      clearSelection()
      return super.onTouchEvent(event)
    }

    if (action == MotionEvent.ACTION_UP) {
      clearSelection()
      clickedSpan.onClick(this)
    } else if (action == MotionEvent.ACTION_DOWN) {
      setSelection(clickedSpan)
    }

    return true
  }

  /**
   * Get the clickable span that is at the exact coordinates
   *
   * @param x x-position of the click
   * @param y y-position of the click
   * @return a clickable span that's located where the click occurred, or: `null` if no clickable
   *   span was located there
   */
  private fun getClickableSpanInCoords(x: Int, y: Int): ClickableSpan? {
    val offset = getTextOffsetAt(x, y)
    if (offset < 0) {
      return null
    }

    val spanned = text as? Spanned ?: return null

    val clickableSpans = spanned.getSpans(offset, offset, ClickableSpan::class.java)
    if (clickableSpans.isNotEmpty()) {
      return clickableSpans[0]
    }

    return null
  }

  private fun getTextOffsetAt(x: Int, y: Int): Int {
    val textLayout = layout ?: return -1
    val line = textLayout.getLineForVertical(y)

    val left: Float
    val right: Float

    if (textLayout.alignment == Layout.Alignment.ALIGN_CENTER) {
      /**
       * [Layout#getLineLeft] and [Layout#getLineRight] properly account for paragraph margins on
       * centered text.
       */
      left = textLayout.getLineLeft(line)
      right = textLayout.getLineRight(line)
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
      val rtl = textLayout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT
      left =
          if (rtl) (textLayout.width - textLayout.getLineMax(line))
          else textLayout.getParagraphLeft(line).toFloat()
      right = if (rtl) textLayout.getParagraphRight(line).toFloat() else textLayout.getLineMax(line)
    }

    if (x < left || x > right) {
      return -1
    }

    return try {
      textLayout.getOffsetForHorizontal(line, x.toFloat())
    } catch (e: ArrayIndexOutOfBoundsException) {
      // This happens for bidi text on Android 7-8.
      // See
      // https://android.googlesource.com/platform/frameworks/base/+/821e9bd5cc2be4b3210cb0226e40ba0f42b51aed
      -1
    }
  }

  public override fun dispatchHoverEvent(event: MotionEvent): Boolean =
      // TODO T221698305: Dispatch to AccessibilityDelegate
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
    // TODO T221698305: Dispatch to AccessibilityDelegate
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean =
      // TODO T221698305: Dispatch to AccessibilityDelegate
      super.dispatchKeyEvent(event)

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (isEnabled &&
        clickableSpans.isNotEmpty() &&
        selection == null &&
        (isDirectionKey(keyCode) || keyCode == KeyEvent.KEYCODE_TAB)) {
      // View just received focus due to keyboard navigation. Nothing is currently selected,
      // let's select first span according to the navigation direction.
      var targetSpan: ClickableSpan? = null
      if (isDirectionKey(keyCode) && event.hasNoModifiers()) {
        if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT || keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
          targetSpan = clickableSpans[0]
        } else if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_DPAD_UP) {
          targetSpan = clickableSpans[clickableSpans.size - 1]
        }
      }

      if (keyCode == KeyEvent.KEYCODE_TAB) {
        if (event.hasNoModifiers()) {
          targetSpan = clickableSpans[0]
        } else if (event.hasModifiers(KeyEvent.META_SHIFT_ON)) {
          targetSpan = clickableSpans[clickableSpans.size - 1]
        }
      }

      if (targetSpan != null) {
        setSelection(targetSpan)
        return true
      }
    }

    return super.onKeyUp(keyCode, event)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (isEnabled &&
        clickableSpans.isNotEmpty() &&
        (isDirectionKey(keyCode) || isConfirmKey(keyCode)) &&
        event.hasNoModifiers()) {
      val selectedSpanIndex = selectedSpanIndex()
      if (selectedSpanIndex == -1) {
        return super.onKeyDown(keyCode, event)
      }

      if (isDirectionKey(keyCode)) {
        val direction =
            if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT || keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
              1
            } else {
              // keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_DPAD_UP
              -1
            }
        val repeatCount = 1 + event.repeatCount
        val targetIndex = selectedSpanIndex + direction * repeatCount
        if (targetIndex >= 0 && targetIndex < clickableSpans.size) {
          setSelection(clickableSpans[targetIndex])
          return true
        }
      }

      if (isConfirmKey(keyCode) && event.repeatCount == 0) {
        clearSelection()
        clickableSpans[selectedSpanIndex].onClick(this)
        return true
      }
    }

    return super.onKeyDown(keyCode, event)
  }

  private fun selectedSpanIndex(): Int {
    val spanned = text as? Spanned ?: return -1
    val textSelection = selection ?: return -1

    if (clickableSpans.isEmpty()) {
      return -1
    }

    for (i in clickableSpans.indices) {
      val span = clickableSpans[i]
      val spanStart = spanned.getSpanStart(span)
      val spanEnd = spanned.getSpanEnd(span)
      if (spanStart == textSelection.start && spanEnd == textSelection.end) {
        return i
      }
    }
    return -1
  }

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

    private fun isDirectionKey(keyCode: Int): Boolean =
        keyCode == KeyEvent.KEYCODE_DPAD_LEFT ||
            keyCode == KeyEvent.KEYCODE_DPAD_RIGHT ||
            keyCode == KeyEvent.KEYCODE_DPAD_UP ||
            keyCode == KeyEvent.KEYCODE_DPAD_DOWN

    private fun isConfirmKey(keyCode: Int): Boolean =
        keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
            keyCode == KeyEvent.KEYCODE_ENTER ||
            keyCode == KeyEvent.KEYCODE_SPACE ||
            keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER

    private fun filterClickableSpans(text: CharSequence): List<ClickableSpan> {
      if (text !is Spanned ||
          text.nextSpanTransition(0, text.length, ClickableSpan::class.java) == text.length) {
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
