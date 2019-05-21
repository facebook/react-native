/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.text;

import android.content.Context;
import android.text.Layout;
import android.text.Spannable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.IViewManagerWithChildren;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.yoga.YogaMeasureMode;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * Concrete class for {@link ReactTextAnchorViewManager} which represents view managers of anchor
 * {@code <Text>} nodes.
 */
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
public class ReactTextViewManager
    extends ReactTextAnchorViewManager<ReactTextView, ReactTextShadowNode>
    implements IViewManagerWithChildren {

  @VisibleForTesting public static final String REACT_CLASS = "RCTText";

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
  public Object updateLocalData(
      ReactTextView view, ReactStylesDiffMap props, ReactStylesDiffMap localData) {
    ReadableMap attributedString = localData.getMap("attributedString");

    Spannable spanned =
        TextLayoutManager.getOrCreateSpannableForText(view.getContext(), attributedString);
    view.setSpanned(spanned);

    TextAttributeProps textViewProps = new TextAttributeProps(props);

    // TODO add textBreakStrategy prop into local Data
    int textBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;

    // TODO add justificationMode prop into local Data
    int justificationMode = Layout.JUSTIFICATION_MODE_NONE;

    return new ReactTextUpdate(
        spanned,
        -1, // TODO add this into local Data?
        false, // TODO add this into local Data
        textViewProps.getStartPadding(),
        textViewProps.getTopPadding(),
        textViewProps.getEndPadding(),
        textViewProps.getBottomPadding(),
        textViewProps.getTextAlign(),
        textBreakStrategy,
        justificationMode
      );
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
      YogaMeasureMode heightMode) {

    return TextLayoutManager.measureText(
        context, localData, props, width, widthMode, height, heightMode);
  }
}
