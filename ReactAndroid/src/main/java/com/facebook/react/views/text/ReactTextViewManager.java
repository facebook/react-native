/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.text.Spannable;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.R;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.IViewManagerWithChildren;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.yoga.YogaMeasureMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Concrete class for {@link ReactTextAnchorViewManager} which represents view managers of anchor
 * {@code <Text>} nodes.
 */
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
public class ReactTextViewManager
    extends ReactTextAnchorViewManager<ReactTextView, ReactTextShadowNode>
    implements IViewManagerWithChildren {

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
    setupViewRecycling();
  }

  @Override
  protected ReactTextView prepareToRecycleView(
      @NonNull ThemedReactContext reactContext, ReactTextView view) {
    // BaseViewManager
    super.prepareToRecycleView(reactContext, view);

    // Resets background and borders
    view.recycleView();

    // Defaults from ReactTextAnchorViewManager
    setSelectionColor(view, null);

    return view;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    return new ReactTextView(context);
  }

  @Override
  public void updateExtraData(ReactTextView view, Object extraData) {
    ReactTextUpdate update = (ReactTextUpdate) extraData;
    Spannable spannable = update.getText();
    if (update.containsImages()) {
      TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
    }
    view.setText(update);

    // If this text view contains any clickable spans, set a view tag and reset the accessibility
    // delegate so that these can be picked up by the accessibility system.
    ReactClickableSpan[] clickableSpans =
        spannable.getSpans(0, update.getText().length(), ReactClickableSpan.class);

    if (clickableSpans.length > 0) {
      view.setTag(
          R.id.accessibility_links,
          new ReactAccessibilityDelegate.AccessibilityLinks(clickableSpans, spannable));
      ReactAccessibilityDelegate.resetDelegate(
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
  public Object updateState(
      ReactTextView view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    MapBuffer stateMapBuffer = stateWrapper.getStateDataMapBuffer();
    if (stateMapBuffer != null) {
      return getReactTextUpdate(view, props, stateMapBuffer);
    }
    ReadableNativeMap state = stateWrapper.getStateData();
    if (state == null) {
      return null;
    }

    ReadableMap attributedString = state.getMap("attributedString");
    ReadableMap paragraphAttributes = state.getMap("paragraphAttributes");
    Spannable spanned =
        TextLayoutManager.getOrCreateSpannableForText(
            view.getContext(), attributedString, mReactTextViewManagerCallback);
    view.setSpanned(spanned);

    int textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(paragraphAttributes.getString("textBreakStrategy"));

    return new ReactTextUpdate(
        spanned,
        state.hasKey("mostRecentEventCount") ? state.getInt("mostRecentEventCount") : -1,
        false, // TODO add this into local Data
        TextAttributeProps.getTextAlignment(props, TextLayoutManager.isRTL(attributedString)),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props));
  }

  private Object getReactTextUpdate(ReactTextView view, ReactStylesDiffMap props, MapBuffer state) {

    MapBuffer attributedString = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING);
    MapBuffer paragraphAttributes = state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES);
    Spannable spanned =
        TextLayoutManagerMapBuffer.getOrCreateSpannableForText(
            view.getContext(), attributedString, mReactTextViewManagerCallback);
    view.setSpanned(spanned);

    int textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManagerMapBuffer.PA_KEY_TEXT_BREAK_STRATEGY));

    return new ReactTextUpdate(
        spanned,
        -1, // UNUSED FOR TEXT
        false, // TODO add this into local Data
        TextAttributeProps.getTextAlignment(
            props, TextLayoutManagerMapBuffer.isRTL(attributedString)),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props));
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.of(
            "topTextLayout", MapBuilder.of("registrationName", "onTextLayout"),
            "topInlineViewLayout", MapBuilder.of("registrationName", "onInlineViewLayout")));
    return eventTypeConstants;
  }

  @Override
  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
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
    return TextLayoutManagerMapBuffer.measureText(
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
}
