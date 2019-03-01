/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.content.Context;
import android.support.v7.widget.AppCompatSpinner;
import android.util.AttributeSet;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;

import com.facebook.react.common.annotations.VisibleForTesting;

import javax.annotation.Nullable;

public class ReactPicker extends AppCompatSpinner {

  private int mMode = Spinner.MODE_DIALOG;
  private @Nullable Integer mPrimaryColor;
  private @Nullable OnSelectListener mOnSelectListener;
  private @Nullable Integer mStagedSelection;

  private final OnItemSelectedListener mItemSelectedListener = new OnItemSelectedListener() {
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

  /**
   * Listener interface for ReactPicker events.
   */
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

  private final Runnable measureAndLayout = new Runnable() {
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
    if (getOnItemSelectedListener() == null)
      setOnItemSelectedListener(mItemSelectedListener);
  }

  public void setOnSelectListener(@Nullable OnSelectListener onSelectListener) {
    mOnSelectListener = onSelectListener;
  }

  @Nullable public OnSelectListener getOnSelectListener() {
    return mOnSelectListener;
  }

  /**
   * Will cache "selection" value locally and set it only once {@link #updateStagedSelection} is
   * called
   */
  public void setStagedSelection(int selection) {
    mStagedSelection = selection;
  }

  public void updateStagedSelection() {
    if (mStagedSelection != null) {
      setSelectionWithSuppressEvent(mStagedSelection);
      mStagedSelection = null;
    }
  }

  /**
   * Set the selection while suppressing the follow-up {@link OnSelectListener#onItemSelected(int)}
   * event. This is used so we don't get an event when changing the selection ourselves.
   *
   * @param position the position of the selected item
   */
  private void setSelectionWithSuppressEvent(int position) {
    if (position != getSelectedItemPosition()) {
      setOnItemSelectedListener(null);
      setSelection(position, false);
      setOnItemSelectedListener(mItemSelectedListener);
    }
  }

  public @Nullable Integer getPrimaryColor() {
    return mPrimaryColor;
  }

  public void setPrimaryColor(@Nullable Integer primaryColor) {
    mPrimaryColor = primaryColor;
  }

  @VisibleForTesting
  public int getMode() {
    return mMode;
  }
}
