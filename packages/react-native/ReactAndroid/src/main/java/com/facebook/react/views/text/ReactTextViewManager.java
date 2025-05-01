/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.os.Build;
import android.text.Spannable;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.internal.SystraceSection;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.IViewManagerWithChildren;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.internal.span.TextInlineImageSpan;
import com.facebook.yoga.YogaMeasureMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Concrete class for {@link ReactTextAnchorViewManager} which represents view managers of anchor
 * {@code <Text>} nodes.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
public class ReactTextViewManager extends ReactTextAnchorViewManager<ReactTextShadowNode>
    implements IViewManagerWithChildren {

  private static final String TAG = "ReactTextViewManager";

  private static final short TX_STATE_KEY_ATTRIBUTED_STRING = 0;
  private static final short TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
  // used for text input
  private static final short TX_STATE_KEY_HASH = 2;
  private static final short TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;

  @VisibleForTesting public static final String REACT_CLASS = "RCTText";

  protected @Nullable ReactTextViewManagerCallback mReactTextViewManagerCallback;

  public ReactTextViewManager() {
    this(null);
  }

  public ReactTextViewManager(@Nullable ReactTextViewManagerCallback reactTextViewManagerCallback) {
    mReactTextViewManagerCallback = reactTextViewManagerCallback;
    if (ReactNativeFeatureFlags.enableViewRecyclingForText()) {
      setupViewRecycling();
    }
  }

  @Override
  protected @Nullable ReactTextView prepareToRecycleView(
      @NonNull ThemedReactContext reactContext, ReactTextView view) {
    // BaseViewManager
    ReactTextView preparedView = super.prepareToRecycleView(reactContext, view);
    if (preparedView != null) {
      // Resets background and borders
      preparedView.recycleView();
      // Defaults from ReactTextAnchorViewManager
      setSelectionColor(preparedView, null);
    }
    return preparedView;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected void updateViewAccessibility(@NonNull ReactTextView view) {
    ReactTextViewAccessibilityDelegate.Companion.setDelegate(
        view, view.isFocusable(), view.getImportantForAccessibility());
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    return new ReactTextView(context);
  }

  @Override
  public void updateExtraData(ReactTextView view, Object extraData) {
    try (SystraceSection s = new SystraceSection("ReactTextViewManager.updateExtraData")) {
      ReactTextUpdate update = (ReactTextUpdate) extraData;
      Spannable spannable = update.getText();
      if (update.containsImages()) {
        TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
      }
      view.setText(update);

      // If this text view contains any clickable spans, set a view tag and reset the accessibility
      // delegate so that these can be picked up by the accessibility system.
      ReactTextViewAccessibilityDelegate.AccessibilityLinks accessibilityLinks =
          new ReactTextViewAccessibilityDelegate.AccessibilityLinks(spannable);
      view.setTag(
          R.id.accessibility_links, accessibilityLinks.size() > 0 ? accessibilityLinks : null);
      ReactTextViewAccessibilityDelegate.Companion.resetDelegate(
          view, view.isFocusable(), view.getImportantForAccessibility());
    }
  }

  @Override
  public ReactTextShadowNode createShadowNodeInstance() {
    return new ReactTextShadowNode(mReactTextViewManagerCallback);
  }

  public ReactTextShadowNode createShadowNodeInstance(
      @Nullable ReactTextViewManagerCallback reactTextViewManagerCallback) {
    return new ReactTextShadowNode(reactTextViewManagerCallback);
  }

  @Override
  public Class<ReactTextShadowNode> getShadowNodeClass() {
    return ReactTextShadowNode.class;
  }

  @Override
  protected void onAfterUpdateTransaction(ReactTextView view) {
    super.onAfterUpdateTransaction(view);
    view.updateView();
  }

  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Override
  public @Nullable Object updateState(
      ReactTextView view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    try (SystraceSection s = new SystraceSection("ReactTextViewManager.updateState")) {
      MapBuffer stateMapBuffer = stateWrapper.getStateDataMapBuffer();
      if (stateMapBuffer != null) {
        return getReactTextUpdate(view, props, stateMapBuffer);
      } else {
        return null;
      }
    }
  }

  private Object getReactTextUpdate(ReactTextView view, ReactStylesDiffMap props, MapBuffer state) {

    MapBuffer attributedString = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING);
    MapBuffer paragraphAttributes = state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES);
    Spannable spanned =
        TextLayoutManager.getOrCreateSpannableForText(
            view.getContext(), attributedString, mReactTextViewManagerCallback);
    view.setSpanned(spanned);

    try {
      float minimumFontSize =
          (float) paragraphAttributes.getDouble(TextLayoutManager.PA_KEY_MINIMUM_FONT_SIZE);
      view.setMinimumFontSize(minimumFontSize);
    } catch (IllegalArgumentException e) {
      // T190482857: We see rare crash with MapBuffer without PA_KEY_MINIMUM_FONT_SIZE entry
      FLog.e(
          TAG,
          "Paragraph Attributes: %s",
          paragraphAttributes != null ? paragraphAttributes.toString() : "<empty>");
      throw e;
    }

    int textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY));
    int currentJustificationMode =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ? 0 : view.getJustificationMode();

    return new ReactTextUpdate(
        spanned,
        -1, // UNUSED FOR TEXT
        false, // TODO add this into local Data
        TextLayoutManager.getTextGravity(attributedString, spanned, view.getGravityHorizontal()),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode));
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.of("topTextLayout", MapBuilder.of("registrationName", "onTextLayout")));
    return eventTypeConstants;
  }

  @Override
  public long measure(
      Context context,
      MapBuffer localData,
      MapBuffer props,
      @Nullable MapBuffer state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    return TextLayoutManager.measureText(
        context,
        localData,
        props,
        width,
        widthMode,
        height,
        heightMode,
        mReactTextViewManagerCallback,
        attachmentsPositions);
  }

  @Override
  public void setPadding(ReactTextView view, int left, int top, int right, int bottom) {
    view.setPadding(left, top, right, bottom);
  }

  @ReactProp(name = "overflow")
  public void setOverflow(ReactTextView view, @Nullable String overflow) {
    view.setOverflow(overflow);
  }
}
