/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.picker;

import javax.annotation.Nullable;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.picker.events.PickerItemSelectEvent;

/**
 * {@link ViewManager} for the {@link ReactPicker} view. This is abstract because the
 * {@link Spinner} doesn't support setting the mode (dropdown/dialog) outside the constructor, so
 * that is delegated to the separate {@link ReactDropdownPickerManager} and
 * {@link ReactDialogPickerManager} components. These are merged back on the JS side into one
 * React component.
 */
public abstract class ReactPickerManager extends SimpleViewManager<ReactPicker> {

  @ReactProp(name = "items")
  public void setItems(ReactPicker view, @Nullable ReadableArray items) {
    if (items != null) {
      ReadableMap[] data = new ReadableMap[items.size()];
      for (int i = 0; i < items.size(); i++) {
        data[i] = items.getMap(i);
      }
      ReactPickerAdapter adapter = new ReactPickerAdapter(view.getContext(), data);
      adapter.setPrimaryTextColor(view.getPrimaryColor());
      view.setAdapter(adapter);
    } else {
      view.setAdapter(null);
    }
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ReactPicker view, @Nullable Integer color) {
    view.setPrimaryColor(color);
    ReactPickerAdapter adapter = (ReactPickerAdapter) view.getAdapter();
    if (adapter != null) {
      adapter.setPrimaryTextColor(color);
    }
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
    view.updateStagedSelection();
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactPicker picker) {
    picker.setOnSelectListener(
            new PickerEventEmitter(
                    picker,
                    reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()));
  }

  private static class ReactPickerAdapter extends ArrayAdapter<ReadableMap> {

    private final LayoutInflater mInflater;
    private @Nullable Integer mPrimaryTextColor;

    public ReactPickerAdapter(Context context, ReadableMap[] data) {
      super(context, 0, data);

      mInflater = (LayoutInflater) Assertions.assertNotNull(
          context.getSystemService(Context.LAYOUT_INFLATER_SERVICE));
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
      return getView(position, convertView, parent, false);
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
      return getView(position, convertView, parent, true);
    }

    private View getView(int position, View convertView, ViewGroup parent, boolean isDropdown) {
      ReadableMap item = getItem(position);

      if (convertView == null) {
        int layoutResId = isDropdown
            ? android.R.layout.simple_spinner_dropdown_item
            : android.R.layout.simple_spinner_item;
        convertView = mInflater.inflate(layoutResId, parent, false);
      }

      TextView textView = (TextView) convertView;
      textView.setText(item.getString("label"));
      if (!isDropdown && mPrimaryTextColor != null) {
        textView.setTextColor(mPrimaryTextColor);
      } else if (item.hasKey("color") && !item.isNull("color")) {
        textView.setTextColor(item.getInt("color"));
      }

      return convertView;
    }

    public void setPrimaryTextColor(@Nullable Integer primaryTextColor) {
      mPrimaryTextColor = primaryTextColor;
      notifyDataSetChanged();
    }
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
      mEventDispatcher.dispatchEvent( new PickerItemSelectEvent(
              mReactPicker.getId(), SystemClock.nanoTime(), position));
    }
  }
}
