/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.Spanned
import android.text.TextUtils
import android.text.method.LinkMovementMethod
import android.text.util.Linkify
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import androidx.annotation.Nullable
import androidx.appcompat.widget.AppCompatTextView
import androidx.appcompat.widget.TintContextWrapper
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.customview.widget.ExploreByTouchHelper
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.infer.annotation.Nullsafe
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.SystraceSection
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundView
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.ViewDefaults
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.text.internal.span.ReactTagSpan
import com.facebook.react.views.text.internal.span.TextInlineImageSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.yoga.YogaMeasureMode

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactTextView(context: Context) : AppCompatTextView(context), ReactCompoundView {

  private var mContainsImages: Boolean = false
  private var mNumberOfLines: Int = 0
  private var mEllipsizeLocation: TextUtils.TruncateAt? = null
  private var mAdjustsFontSizeToFit: Boolean = false
  private var mFontSize: Float = 0f
  private var mMinimumFontSize: Float = 0f
  private var mLetterSpacing: Float = 0f
  private var mLinkifyMaskType: Int = 0
  private var mTextIsSelectable: Boolean = false
  private var mShouldAdjustSpannableFontSize: Boolean = false
  private var mOverflow: Overflow = Overflow.VISIBLE

  private var mSpanned: Spannable? = null

  init {
    initView()
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactTextView is recycled.
   */
  private fun initView() {
    mNumberOfLines = ViewDefaults.NUMBER_OF_LINES
    mAdjustsFontSizeToFit = false
    mLinkifyMaskType = 0
    mTextIsSelectable = false
    mShouldAdjustSpannableFontSize = false
    mEllipsizeLocation = TextUtils.TruncateAt.END
    mFontSize = Float.NaN
    mMinimumFontSize = Float.NaN
    mLetterSpacing = 0f
    mOverflow = Overflow.VISIBLE
    mSpanned = null
  }

  /* package */ internal fun recycleView() {
    // Set default field values
    initView()

    // If the view is still attached to a parent, we need to remove it from the parent
    // before we can recycle it.
    if (parent != null) {
      (parent as ViewGroup).removeView(this)
    }

    BackgroundStyleApplicator.reset(this)

    // Defaults for these fields:
    // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L1061
    breakStrategy = Layout.BREAK_STRATEGY_SIMPLE
    movementMethod = defaultMovementMethod
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      justificationMode = Layout.JUSTIFICATION_MODE_NONE
    }

    // reset text
    layoutParams = EMPTY_LAYOUT_PARAMS
    super.setText(null)
    applyTextAttributes()

    // Call setters to ensure that any super setters are called
    gravity = DEFAULT_GRAVITY
    setNumberOfLines(mNumberOfLines)
    setAdjustFontSizeToFit(mAdjustsFontSizeToFit)
    setLinkifyMask(mLinkifyMaskType)
    setTextIsSelectable(mTextIsSelectable)

    // Default true:
    // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L9347
    includeFontPadding = true
    isEnabled = true

    // reset data detectors
    setLinkifyMask(0)

    setEllipsizeLocation(mEllipsizeLocation)

    // View flags - defaults are here:
    // https://android.googlesource.com/platform/frameworks/base/+/98e54bb941cb6feb07127b75da37833281951d52/core/java/android/view/View.java#5311
    //         mViewFlags = SOUND_EFFECTS_ENABLED | HAPTIC_FEEDBACK_ENABLED |
    // LAYOUT_DIRECTION_INHERIT;
    isEnabled = true
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      setFocusable(View.FOCUSABLE_AUTO)
    }

    hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
    updateView() // call after changing ellipsizeLocation in particular
  }

  override fun onLayout(
      changed: Boolean, textViewLeft: Int, textViewTop: Int, textViewRight: Int, textViewBottom: Int) {
    // TODO T62882314: Delete this method when Fabric is fully released in OSS
    val reactTag = id
    if (text !is Spanned
        || ViewUtil.getUIManagerType(reactTag) == UIManagerType.FABRIC
        || ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      /**
       * In general, {@link #setText} is called via {@link ReactTextViewManager#updateExtraData}
       * before we are laid out. This ordering is a requirement because we utilize the data from
       * setText in onLayout.
       *
       * <p>However, it's possible for us to get an extra layout before we've received our setText
       * call. If this happens before the initial setText call, then getText() will have its default
       * value which isn't a Spanned and we need to bail out. That's fine because we'll get a
       * setText followed by a layout later.
       *
       * <p>The cause for the extra early layout is that an ancestor gets transitioned from a
       * layout-only node to a non layout-only node.
       */
      return
    }

    val reactContext = reactContext
    val uiManager =
        Assertions.assertNotNull(reactContext.getNativeModule(UIManagerModule::class.java))

    val text = getText() as Spanned
    val layout = getLayout()
    if (layout == null) {
      // Text layout is calculated during pre-draw phase, so in some cases it can be empty during
      // layout phase, which usually happens before drawing.
      // The text layout is created by private {@link assumeLayout} method, which we can try to
      // invoke directly through reflection or indirectly through some methods that compute it
      // (e.g. {@link getExtendedPaddingTop}).
      // It is safer, however, to just early return here, as next measure/layout passes are way more
      // likely to have the text layout computed.
      return
    }

    val placeholders =
        text.getSpans(0, text.length, TextInlineViewPlaceholderSpan::class.java)
    val textViewWidth = textViewRight - textViewLeft
    val textViewHeight = textViewBottom - textViewTop

    for (placeholder in placeholders) {
      val child = uiManager.resolveView(placeholder.reactTag)

      val start = text.getSpanStart(placeholder)
      val line = layout.getLineForOffset(start)
      val isLineTruncated = layout.getEllipsisCount(line) > 0

      if ( // This truncation check works well on recent versions of Android (tested on 5.1.1 and
      // 6.0.1) but not on Android 4.4.4. The reason is that getEllipsisCount is buggy on
      // Android 4.4.4. Specifically, it incorrectly returns 0 if an inline view is the first
      // thing to be truncated.
      (isLineTruncated && start >= layout.getLineStart(line) + layout.getEllipsisStart(line))
          ||

          // This truncation check works well on Android 4.4.4 but not on others (e.g. 6.0.1).
          // On Android 4.4.4, getLineEnd returns the first truncated character whereas on 6.0.1,
          // it appears to return the position after the last character on the line even if that
          // character is truncated.
          line >= mNumberOfLines
          || start >= layout.getLineEnd(line)) {
        // On some versions of Android (e.g. 4.4.4, 5.1.1), getPrimaryHorizontal can infinite
        // loop when called on a character that appears after the ellipsis. Avoid this bug by
        // special casing the character truncation case.
        child?.visibility = View.GONE
      } else {
        val width = placeholder.width
        val height = placeholder.height

        // Calculate if the direction of the placeholder character is Right-To-Left.
        val isRtlChar = layout.isRtlCharAt(start)

        val isRtlParagraph = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT

        val placeholderHorizontalPosition: Int
        // There's a bug on Samsung devices where calling getPrimaryHorizontal on
        // the last offset in the layout will result in an endless loop. Work around
        // this bug by avoiding getPrimaryHorizontal in that case.
        if (start == text.length - 1) {
          val endsWithNewLine =
              text.length > 0 && text[layout.getLineEnd(line) - 1] == '\n'
          val lineWidth =
              if (endsWithNewLine) layout.getLineMax(line).toInt() else layout.getLineWidth(line).toInt()
          placeholderHorizontalPosition =
              if (isRtlParagraph)
                  // Equivalent to `layout.getLineLeft(line)` but `getLineLeft` returns incorrect
                  // values when the paragraph is RTL and `setSingleLine(true)`.
                  textViewWidth - lineWidth
              else (layout.getLineRight(line).toInt() - width)
        } else {
          // The direction of the paragraph may not be exactly the direction the string is heading
          // in at the
          // position of the placeholder. So, if the direction of the character is the same as the
          // paragraph
          // use primary, secondary otherwise.
          val characterAndParagraphDirectionMatch = isRtlParagraph == isRtlChar

          var calculatedPosition =
              if (characterAndParagraphDirectionMatch)
                  layout.getPrimaryHorizontal(start).toInt()
              else layout.getSecondaryHorizontal(start).toInt()

          if (isRtlParagraph) {
            // Adjust `placeholderHorizontalPosition` to work around an Android bug.
            // The bug is when the paragraph is RTL and `setSingleLine(true)`, some layout
            // methods such as `getPrimaryHorizontal`, `getSecondaryHorizontal`, and
            // `getLineRight` return incorrect values. Their return values seem to be off
            // by the same number of pixels so subtracting these values cancels out the error.
            //
            // The result is equivalent to bugless versions of
            // `getPrimaryHorizontal`/`getSecondaryHorizontal`.
            calculatedPosition =
                textViewWidth - ((layout.getLineRight(line).toInt() - calculatedPosition))
          }

          if (isRtlChar) {
            calculatedPosition -= width
          }

          placeholderHorizontalPosition = calculatedPosition
        }

        val leftRelativeToTextView =
            if (isRtlChar)
                placeholderHorizontalPosition + totalPaddingRight
            else placeholderHorizontalPosition + totalPaddingLeft

        val left = textViewLeft + leftRelativeToTextView

        // Vertically align the inline view to the baseline of the line of text.
        val topRelativeToTextView = totalPaddingTop + layout.getLineBaseline(line) - height
        val top = textViewTop + topRelativeToTextView

        val isFullyClipped =
            textViewWidth <= leftRelativeToTextView || textViewHeight <= topRelativeToTextView
        val layoutVisibility = if (isFullyClipped) View.GONE else View.VISIBLE
        val layoutLeft = left
        val layoutTop = top
        val layoutRight = left + width
        val layoutBottom = top + height

        child?.visibility = layoutVisibility
        child?.layout(layoutLeft, layoutTop, layoutRight, layoutBottom)
      }
    }
  }

  override fun onDraw(canvas: Canvas) {
    SystraceSection("ReactTextView.onDraw").use {
      val spanned = getSpanned()
      if (mAdjustsFontSizeToFit && spanned != null && mShouldAdjustSpannableFontSize) {
        mShouldAdjustSpannableFontSize = false
        TextLayoutManager.adjustSpannableFontToFit(
            spanned,
            width.toFloat(),
            YogaMeasureMode.EXACTLY,
            height.toFloat(),
            YogaMeasureMode.EXACTLY,
            mMinimumFontSize,
            mNumberOfLines,
            includeFontPadding,
            breakStrategy,
            hyphenationFrequency,
            // always passing ALIGN_NORMAL here should be fine, since this method doesn't depend on
            // how exactly lines are aligned, just their width
            Layout.Alignment.ALIGN_NORMAL,
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) -1 else justificationMode,
            paint)
        setText(spanned as CharSequence)
      }

      if (mOverflow != Overflow.VISIBLE) {
        BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
      }

      super.onDraw(canvas)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    SystraceSection("ReactTextView.onMeasure").use {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
  }

  public fun setText(update: ReactTextUpdate) {
    SystraceSection("ReactTextView.setText(ReactTextUpdate)").use {
      mContainsImages = update.containsImages()
      // Android's TextView crashes when it tries to relayout if LayoutParams are
      // null; explicitly set the LayoutParams to prevent this crash. See:
      // https://github.com/facebook/react-native/pull/7011
      if (layoutParams == null) {
        layoutParams = EMPTY_LAYOUT_PARAMS
      }
      val spannable = update.text
      if (mLinkifyMaskType > 0) {
        Linkify.addLinks(spannable, mLinkifyMaskType)
        movementMethod = LinkMovementMethod.getInstance()
      }
      setText(spannable as CharSequence)
      val paddingLeft = update.paddingLeft
      val paddingTop = update.paddingTop
      val paddingRight = update.paddingRight
      val paddingBottom = update.paddingBottom

      // In Fabric padding is set by the update of Layout Metrics and not as part of the "setText"
      // operation
      // TODO T56559197: remove this condition when we migrate 100% to Fabric
      if (paddingLeft.toInt() != ReactConstants.UNSET
          && paddingTop.toInt() != ReactConstants.UNSET
          && paddingRight.toInt() != ReactConstants.UNSET
          && paddingBottom.toInt() != ReactConstants.UNSET) {

        setPadding(
            paddingLeft.toInt(),
            paddingTop.toInt(),
            paddingRight.toInt(),
            paddingBottom.toInt())
      }

      val nextTextAlign = update.textAlign
      if (nextTextAlign != getGravityHorizontal()) {
        setGravityHorizontal(nextTextAlign)
      }
      if (breakStrategy != update.textBreakStrategy) {
        breakStrategy = update.textBreakStrategy
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        if (justificationMode != update.justificationMode) {
          justificationMode = update.justificationMode
        }
      }

      // Ensure onLayout is called so the inline views can be repositioned.
      requestLayout()
    }
  }

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int {
    val text = text
    var target = id

    val x = touchX.toInt()
    val y = touchY.toInt()

    val layout = getLayout()
    if (layout == null) {
      // If the layout is null, the view hasn't been properly laid out yet. Therefore, we can't find
      // the exact text tag that has been touched, and the correct tag to return is the default one.
      return target
    }
    val line = layout.getLineForVertical(y)

    val lineStartX = layout.getLineLeft(line).toInt()
    val lineEndX = layout.getLineRight(line).toInt()

    // TODO(5966918): Consider extending touchable area for text spans by some DP constant
    if (text is Spanned && x >= lineStartX && x <= lineEndX) {
      val spannedText = text as Spanned
      var index = -1
      try {
        index = layout.getOffsetForHorizontal(line, x.toFloat())
      } catch (e: ArrayIndexOutOfBoundsException) {
        // https://issuetracker.google.com/issues/113348914
        FLog.e(ReactConstants.TAG, "Crash in HorizontalMeasurementProvider: " + e.message)
        return target
      }

      // We choose the most inner span (shortest) containing character at the given index
      // if no such span can be found we will send the textview's react id as a touch handler
      // In case when there are more than one spans with same length we choose the last one
      // from the spans[] array, since it correspond to the most inner react element
      val spans = spannedText.getSpans(index, index, ReactTagSpan::class.java)

      if (spans != null) {
        var targetSpanTextLength = text.length
        for (i in spans.indices) {
          val spanStart = spannedText.getSpanStart(spans[i])
          val spanEnd = spannedText.getSpanEnd(spans[i])
          if (spanEnd >= index && (spanEnd - spanStart) <= targetSpanTextLength) {
            target = spans[i].reactTag
            targetSpanTextLength = (spanEnd - spanStart)
          }
        }
      }
    }

    return target
  }

  override fun verifyDrawable(drawable: Drawable): Boolean {
    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        if (span.drawable == drawable) {
          return true
        }
      }
    }
    return super.verifyDrawable(drawable)
  }

  override fun invalidateDrawable(drawable: Drawable) {
    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        if (span.drawable == drawable) {
          invalidate()
        }
      }
    }
    super.invalidateDrawable(drawable)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        span.onDetachedFromWindow()
      }
    }
  }

  override fun onStartTemporaryDetach() {
    super.onStartTemporaryDetach()
    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        span.onStartTemporaryDetach()
      }
    }
  }

  override fun setTextIsSelectable(selectable: Boolean) {
    mTextIsSelectable = selectable
    super.setTextIsSelectable(selectable)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // This is a workaround to ensure the text becomes selectable as it doesn't work if we call
    // `setTextIsSelectable(true)` directly when setTextIsSelectable was already true.
    if (mTextIsSelectable) {
      setTextIsSelectable(false)
      setTextIsSelectable(true)
    } else {
      setTextIsSelectable(false)
    }

    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        span.onAttachedToWindow()
      }
    }
  }

  override fun onFinishTemporaryDetach() {
    super.onFinishTemporaryDetach()
    if (mContainsImages && text is Spanned) {
      val text = text as Spanned
      val spans = text.getSpans(0, text.length, TextInlineImageSpan::class.java)
      for (span in spans) {
        span.onFinishTemporaryDetach()
      }
    }
  }

  override fun hasOverlappingRendering(): Boolean {
    return false
  }

  /* package */ internal fun getGravityHorizontal(): Int {
    return (gravity and (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK))
  }

  /* package */ internal fun setGravityHorizontal(gravityHorizontal: Int) {
    var gravityHorizontalValue = gravityHorizontal
    if (gravityHorizontalValue == 0) {
      gravityHorizontalValue =
          (DEFAULT_GRAVITY and (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK))
    }
    gravity =
        (((gravity and (Gravity.HORIZONTAL_GRAVITY_MASK.inv())) and (Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK.inv()))
            or gravityHorizontalValue)
  }

  /* package */ internal fun setGravityVertical(gravityVertical: Int) {
    var gravityVerticalValue = gravityVertical
    if (gravityVerticalValue == 0) {
      gravityVerticalValue = (DEFAULT_GRAVITY and Gravity.VERTICAL_GRAVITY_MASK)
    }
    gravity = ((gravity and Gravity.VERTICAL_GRAVITY_MASK.inv()) or gravityVerticalValue)
  }

  public fun setNumberOfLines(numberOfLines: Int) {
    mNumberOfLines = if (numberOfLines == 0) ViewDefaults.NUMBER_OF_LINES else numberOfLines
    maxLines = mNumberOfLines
    mShouldAdjustSpannableFontSize = true
  }

  public fun setAdjustFontSizeToFit(adjustsFontSizeToFit: Boolean) {
    mAdjustsFontSizeToFit = adjustsFontSizeToFit
  }

  public fun setFontSize(fontSize: Float) {
    mFontSize =
        if (mAdjustsFontSizeToFit)
            Math.ceil(PixelUtil.toPixelFromSP(fontSize).toDouble()).toFloat()
        else Math.ceil(PixelUtil.toPixelFromDIP(fontSize).toDouble()).toFloat()

    applyTextAttributes()
  }

  public fun setMinimumFontSize(minimumFontSize: Float) {
    mMinimumFontSize = minimumFontSize
    mShouldAdjustSpannableFontSize = true
  }

  override fun setIncludeFontPadding(includepad: Boolean) {
    super.setIncludeFontPadding(includepad)
    mShouldAdjustSpannableFontSize = true
  }

  override fun setBreakStrategy(breakStrategy: Int) {
    super.setBreakStrategy(breakStrategy)
    mShouldAdjustSpannableFontSize = true
  }

  override fun setHyphenationFrequency(hyphenationFrequency: Int) {
    super.setHyphenationFrequency(hyphenationFrequency)
    mShouldAdjustSpannableFontSize = true
  }

  public override fun setLetterSpacing(letterSpacing: Float) {
    if (letterSpacing.isNaN()) {
      return
    }

    val letterSpacingPixels = PixelUtil.toPixelFromDIP(letterSpacing)

    // `letterSpacingPixels` and `getEffectiveFontSize` are both in pixels,
    // yielding an accurate em value.
    mLetterSpacing = letterSpacingPixels / mFontSize

    applyTextAttributes()
  }

  public fun setEllipsizeLocation(ellipsizeLocation: TextUtils.TruncateAt?) {
    mEllipsizeLocation = ellipsizeLocation
  }

  public fun updateView() {
    val ellipsizeLocation =
        if (mNumberOfLines == ViewDefaults.NUMBER_OF_LINES || mAdjustsFontSizeToFit)
            null
        else mEllipsizeLocation
    ellipsize = ellipsizeLocation
  }

  override fun setBackgroundColor(color: Int) {
    BackgroundStyleApplicator.setBackgroundColor(this, color)
  }

  public fun setBorderWidth(position: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(
        this, LogicalEdge.values()[position], PixelUtil.toDIPFromPixel(width))
  }

  public fun setBorderColor(position: Int, @Nullable color: Int?) {
    BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.values()[position], color)
  }

  public fun setBorderRadius(borderRadius: Float) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal)
  }

  public fun setBorderRadius(borderRadius: Float, position: Int) {
    val radius =
        if (borderRadius.isNaN())
            null
        else
            LengthPercentage(
                PixelUtil.toDIPFromPixel(borderRadius), LengthPercentageType.POINT)
    BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius)
  }

  public fun setBorderStyle(style: String?) {
    BackgroundStyleApplicator.setBorderStyle(
        this, if (style == null) null else BorderStyle.fromString(style))
  }

  public fun setSpanned(spanned: Spannable?) {
    mSpanned = spanned
    mShouldAdjustSpannableFontSize = true
  }

  public fun getSpanned(): Spannable? {
    return mSpanned
  }

  public fun setLinkifyMask(mask: Int) {
    mLinkifyMaskType = mask
  }

  override fun dispatchHoverEvent(event: MotionEvent): Boolean {
    // if this view has an accessibility delegate set, and that delegate supports virtual view
    // children (used for links), pass the hover event along to it so that touching and holding on
    // this text will properly move focus to the virtual children.
    if (ViewCompat.hasAccessibilityDelegate(this)) {
      val delegate = ViewCompat.getAccessibilityDelegate(this)
      if (delegate is ExploreByTouchHelper) {
        return delegate.dispatchHoverEvent(event) || super.dispatchHoverEvent(event)
      }
    }

    return super.dispatchHoverEvent(event)
  }

  /**
   * Note that if we have a movement method then we DO NOT forward these events to the accessibility
   * delegate. This is because the movement method should handle the focus highlighting and
   * changing. If we don't do this then we have mutliple selections happening at once. We cannot get
   * rid of movement method since links found by Linkify will not be clickable. Also, putting this
   * gating in the accessibility delegate itself will break screen reader accessibility more
   * generally, since we still need to register virtual views.
   */
  override fun onFocusChanged(
      gainFocus: Boolean, direction: Int, @Nullable previouslyFocusedRect: Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    val accessibilityDelegateCompat =
        ViewCompat.getAccessibilityDelegate(this)
    if (accessibilityDelegateCompat != null
        && accessibilityDelegateCompat is ReactTextViewAccessibilityDelegate
        && movementMethod == null) {
      (accessibilityDelegateCompat as ReactTextViewAccessibilityDelegate)
          .onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    }
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    val accessibilityDelegateCompat =
        ViewCompat.getAccessibilityDelegate(this)
    return (accessibilityDelegateCompat != null
            && movementMethod == null
            && accessibilityDelegateCompat is ReactTextViewAccessibilityDelegate
            && (accessibilityDelegateCompat as ReactTextViewAccessibilityDelegate)
                .dispatchKeyEvent(event))
        || super.dispatchKeyEvent(event)
  }

  private fun applyTextAttributes() {
    // Workaround for an issue where text can be cut off with an ellipsis when
    // using certain font sizes and padding. Sets the provided text size and
    // letter spacing to ensure consistent rendering and prevent cut-off.
    if (!mFontSize.isNaN()) {
      setTextSize(TypedValue.COMPLEX_UNIT_PX, mFontSize)
    }

    if (!mLetterSpacing.isNaN()) {
      super.setLetterSpacing(mLetterSpacing)
    }
  }

  public fun setOverflow(overflow: String?) {
    mOverflow =
        if (overflow == null) {
          Overflow.VISIBLE
        } else {
          val parsedOverflow = Overflow.fromString(overflow)
          parsedOverflow ?: Overflow.VISIBLE
        }

    invalidate()
  }

  private fun inlineViewJson(
      visibility: Int, index: Int, left: Int, top: Int, right: Int, bottom: Int): WritableMap {
    val json = Arguments.createMap()
    if (visibility == View.GONE) {
      json.putString("visibility", "gone")
      json.putInt("index", index)
    } else if (visibility == View.VISIBLE) {
      json.putString("visibility", "visible")
      json.putInt("index", index)
      json.putDouble("left", PixelUtil.toDIPFromPixel(left.toFloat()).toDouble())
      json.putDouble("top", PixelUtil.toDIPFromPixel(top.toFloat()).toDouble())
      json.putDouble("right", PixelUtil.toDIPFromPixel(right.toFloat()).toDouble())
      json.putDouble("bottom", PixelUtil.toDIPFromPixel(bottom.toFloat()).toDouble())
    } else {
      json.putString("visibility", "unknown")
      json.putInt("index", index)
    }
    return json
  }

  private val reactContext: ReactContext
    get() {
      val context = getContext()
      return if (context is TintContextWrapper)
          (context as TintContextWrapper).baseContext as ReactContext
      else context as ReactContext
    }

  public companion object {
    private val EMPTY_LAYOUT_PARAMS = ViewGroup.LayoutParams(0, 0)

    // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L854
    private const val DEFAULT_GRAVITY = Gravity.TOP or Gravity.START
  }
}
