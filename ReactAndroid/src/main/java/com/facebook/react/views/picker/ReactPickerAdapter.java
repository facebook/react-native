/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.content.Context;
import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import java.util.List;

/* package */
class ReactPickerAdapter extends ArrayAdapter<ReactPickerItem> {

  private final LayoutInflater mInflater;
  private @Nullable Integer mPrimaryTextColor;

  public ReactPickerAdapter(Context context, List<ReactPickerItem> data) {
    super(context, 0, data);

    mInflater =
        (LayoutInflater)
            Assertions.assertNotNull(context.getSystemService(Context.LAYOUT_INFLATER_SERVICE));
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
    ReactPickerItem item = getItem(position);
    boolean isNew = false;
    if (convertView == null) {
      int layoutResId =
          isDropdown
              ? android.R.layout.simple_spinner_dropdown_item
              : android.R.layout.simple_spinner_item;
      convertView = mInflater.inflate(layoutResId, parent, false);
      // Save original text colors
      convertView.setTag(((TextView) convertView).getTextColors());
      isNew = true;
    }

    TextView textView = (TextView) convertView;
    textView.setText(item.label);
    if (!isDropdown && mPrimaryTextColor != null) {
      textView.setTextColor(mPrimaryTextColor);
    } else if (item.color != null) {
      textView.setTextColor(item.color);
    } else if (textView.getTag() != null && !isNew) {
      // In case the new item does not set the color prop, go back to the default one
      textView.setTextColor((ColorStateList) textView.getTag());
    }

    return textView;
  }

  public @Nullable Integer getPrimaryTextColor() {
    return mPrimaryTextColor;
  }

  public void setPrimaryTextColor(@Nullable Integer primaryTextColor) {
    mPrimaryTextColor = primaryTextColor;
    notifyDataSetChanged();
  }
}
