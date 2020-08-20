/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.text.Spannable;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.IViewManagerWithChildren;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.yoga.YogaMeasureMode;
import java.util.Map;

/**
 * Concrete class for {@link ReactTextAnchorViewManager} which represents view managers of anchor
 * {@code <Text>} nodes.
 */
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
public class ReactTextViewManager
    extends ReactTextAnchorViewManager<ReactTextView, ReactTextShadowNode>
    implements IViewManagerWithChildren {

  @VisibleForTesting public static final String REACT_CLASS = "RCTText";

  protected @Nullable ReactTextViewManagerCallback mReactTextViewManagerCallback;

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
    if (update.containsImages()) {
      Spannable spannable = update.getText();
      TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
    }
    view.setText(update);
  }

  @Override
  public ReactTextShadowNode createShadowNodeInstance() {
    return new ReactTextShadowNode();
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
      ReactTextView view, ReactStylesDiffMap props, @Nullable StateWrapper stateWrapper) {
    ReadableNativeMap state = stateWrapper.getState();
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

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        "topTextLayout", MapBuilder.of("registrationName", "onTextLayout"),
        "topInlineViewLayout", MapBuilder.of("registrationName", "onInlineViewLayout"));
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
  public void setPadding(ReactTextView view, int left, int top, int right, int bottom) {
    view.setPadding(left, top, right, bottom);
  }
}
