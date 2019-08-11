/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.picker;

import android.widget.Spinner;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.picker.events.PickerItemSelectEvent;
import java.util.List;

/**
 * {@link ViewManager} for the {@link ReactPicker} view. This is abstract because the {@link
 * Spinner} doesn't support setting the mode (dropdown/dialog) outside the constructor, so that is
 * delegated to the separate {@link ReactDropdownPickerManager} and {@link ReactDialogPickerManager}
 * components. These are merged back on the JS side into one React component.
 */
public abstract class ReactPickerManager extends SimpleViewManager<ReactPicker> {

  @ReactProp(name = "items")
  public void setItems(ReactPicker view, @Nullable ReadableArray items) {
    final List<ReactPickerItem> pickerItems = ReactPickerItem.createFromJsArrayMap(items);
    view.setStagedItems(pickerItems);
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ReactPicker view, @Nullable Integer color) {
    view.setStagedPrimaryTextColor(color);
  }

  @ReactProp(name = "prompt")
  public void setPrompt(ReactPicker view, @Nullable String prompt) {
    view.setPrompt(prompt);
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactPicker view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "selected")
  public void setSelected(ReactPicker view, int selected) {
    view.setStagedSelection(selected);
  }

  @Override
  protected void onAfterUpdateTransaction(ReactPicker view) {
    super.onAfterUpdateTransaction(view);
    view.commitStagedData();
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactPicker picker) {
    picker.setOnSelectListener(
        new PickerEventEmitter(
            picker, reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()));
  }

  private static class PickerEventEmitter implements ReactPicker.OnSelectListener {

    private final ReactPicker mReactPicker;
    private final EventDispatcher mEventDispatcher;

    public PickerEventEmitter(ReactPicker reactPicker, EventDispatcher eventDispatcher) {
      mReactPicker = reactPicker;
      mEventDispatcher = eventDispatcher;
    }

    @Override
    public void onItemSelected(int position) {
      mEventDispatcher.dispatchEvent(new PickerItemSelectEvent(mReactPicker.getId(), position));
    }
  }
}
