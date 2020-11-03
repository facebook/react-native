/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.content.Context;
import android.content.res.ColorStateList;
import android.util.AttributeSet;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatSpinner;
import androidx.core.view.ViewCompat;
import com.facebook.react.common.annotations.VisibleForTesting;
import java.util.List;

public class ReactPicker extends AppCompatSpinner {

  private int mMode = Spinner.MODE_DIALOG;
  private @Nullable OnSelectListener mOnSelectListener;
  private @Nullable List<ReactPickerItem> mItems;
  private @Nullable List<ReactPickerItem> mStagedItems;
  private @Nullable Integer mStagedSelection;
  private @Nullable Integer mStagedPrimaryTextColor;
  private @Nullable Integer mStagedBackgroundColor;

  private final OnItemSelectedListener mItemSelectedListener =
      new OnItemSelectedListener() {
        @Override
        public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
          if (mOnSelectListener != null) {
            mOnSelectListener.onItemSelected(position);
          }
        }

        @Override
        public void onNothingSelected(AdapterView<?> parent) {
          if (mOnSelectListener != null) {
            mOnSelectListener.onItemSelected(-1);
          }
        }
      };

  /** Listener interface for ReactPicker events. */
  public interface OnSelectListener {
    void onItemSelected(int position);
  }

  public ReactPicker(Context context) {
    super(context);
  }

  public ReactPicker(Context context, int mode) {
    super(context, mode);
    mMode = mode;
  }

  public ReactPicker(Context context, AttributeSet attrs) {
    super(context, attrs);
  }

  public ReactPicker(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
  }

  public ReactPicker(Context context, AttributeSet attrs, int defStyle, int mode) {
    super(context, attrs, defStyle, mode);
    mMode = mode;
  }

  private final Runnable measureAndLayout =
      new Runnable() {
        @Override
        public void run() {
          measure(
              MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
              MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
          layout(getLeft(), getTop(), getRight(), getBottom());
        }
      };

  @Override
  public void requestLayout() {
    super.requestLayout();

    // The spinner relies on a measure + layout pass happening after it calls requestLayout().
    // Without this, the widget never actually changes the selection and doesn't call the
    // appropriate listeners. Since we override onLayout in our ViewGroups, a layout pass never
    // happens after a call to requestLayout, so we simulate one here.
    post(measureAndLayout);
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);

    // onItemSelected gets fired immediately after layout because checkSelectionChanged() in
    // AdapterView updates the selection position from the default INVALID_POSITION.
    // To match iOS behavior, which no onItemSelected during initial layout.
    // We setup the listener after layout.
    if (getOnItemSelectedListener() == null) setOnItemSelectedListener(mItemSelectedListener);
  }

  public void setOnSelectListener(@Nullable OnSelectListener onSelectListener) {
    mOnSelectListener = onSelectListener;
  }

  @Nullable
  public OnSelectListener getOnSelectListener() {
    return mOnSelectListener;
  }

  /* package */ void setStagedItems(final @Nullable List<ReactPickerItem> items) {
    mStagedItems = items;
  }

  /**
   * Will cache "selection" value locally and set it only once {@link #commitStagedData} is called
   */
  /* package */ void setStagedSelection(int selection) {
    mStagedSelection = selection;
  }

  /** Will set the "selection" value immediately as opposed to {@link #setStagedSelection(int)} */
  /* package */ void setImmediateSelection(int selection) {
    if (selection != getSelectedItemPosition()) {
      setOnItemSelectedListener(null);
      setSelection(selection, false);
      setOnItemSelectedListener(mItemSelectedListener);
    }
  }

  /* package */ void setStagedPrimaryTextColor(@Nullable Integer primaryColor) {
    mStagedPrimaryTextColor = primaryColor;
  }

  /* package */ void setStagedBackgroundColor(@Nullable Integer backgroundColor) {
    mStagedBackgroundColor = backgroundColor;
  }

  /**
   * Used to commit staged data into ReactPicker view. During this period, we will disable {@link
   * OnSelectListener#onItemSelected(int)} temporarily, so we don't get an event when changing the
   * items/selection ourselves.
   */
  /* package */ void commitStagedData() {
    setOnItemSelectedListener(null);

    ReactPickerAdapter adapter = (ReactPickerAdapter) getAdapter();
    final int origSelection = getSelectedItemPosition();
    if (mStagedItems != null && mStagedItems != mItems) {
      mItems = mStagedItems;
      mStagedItems = null;
      if (adapter == null) {
        adapter = new ReactPickerAdapter(getContext(), mItems);
        setAdapter(adapter);
      } else {
        adapter.clear();
        adapter.addAll(mItems);
        adapter.notifyDataSetChanged();
      }
    }

    if (mStagedSelection != null && mStagedSelection != origSelection) {
      setSelection(mStagedSelection, false);
      mStagedSelection = null;
    }

    if (mStagedPrimaryTextColor != null
        && adapter != null
        && mStagedPrimaryTextColor != adapter.getPrimaryTextColor()) {
      adapter.setPrimaryTextColor(mStagedPrimaryTextColor);
      ViewCompat.setBackgroundTintList(this, ColorStateList.valueOf(mStagedPrimaryTextColor));
      mStagedPrimaryTextColor = null;
    }

    if (mStagedBackgroundColor != null
        && adapter != null
        && mStagedBackgroundColor != adapter.getBackgroundColor()) {
      adapter.setBackgroundColor(mStagedBackgroundColor);
      mStagedBackgroundColor = null;
    }

    setOnItemSelectedListener(mItemSelectedListener);
  }

  @VisibleForTesting
  public int getMode() {
    return mMode;
  }
}
