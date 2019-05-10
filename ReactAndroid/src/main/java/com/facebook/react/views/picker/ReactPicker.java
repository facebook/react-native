/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.content.Context;
import androidx.appcompat.widget.AppCompatSpinner;
import android.util.AttributeSet;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;
import android.widget.SpinnerAdapter;

import com.facebook.react.common.annotations.VisibleForTesting;

import javax.annotation.Nullable;

public class ReactPicker extends AppCompatSpinner {

  private int mMode = Spinner.MODE_DIALOG;
  private @Nullable Integer mPrimaryColor;
  private @Nullable OnSelectListener mOnSelectListener;
  private @Nullable SpinnerAdapter mStagedAdapter;
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

  /* package */ void setStagedAdapter(final SpinnerAdapter adapter) {
   mStagedAdapter = adapter;
  }

  /**
   * Will cache "selection" value locally and set it only once {@link #commitStagedData} is
   * called
   */
  /* package */ void setStagedSelection(int selection) {
    mStagedSelection = selection;
  }

  /**
   * Used to commit staged data into ReactPicker view.
   * During this period, we will disable {@link OnSelectListener#onItemSelected(int)} temporarily,
   * so we don't get an event when changing the items/selection ourselves.
   */
  /* package */ void commitStagedData() {
    setOnItemSelectedListener(null);

    final int origSelection = getSelectedItemPosition();
    if (mStagedAdapter != null && mStagedAdapter != getAdapter()) {
      setAdapter(mStagedAdapter);
      // After setAdapter(), Spinner will reset selection and cause unnecessary onValueChange event.
      // Explicitly setup selection again to prevent this.
      // Ref: https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/widget/AbsSpinner.java#123
      setSelection(origSelection, false);
      mStagedAdapter = null;
    }

    if (mStagedSelection != null && mStagedSelection != origSelection) {
      setSelection(mStagedSelection, false);
      mStagedSelection = null;
    }

    setOnItemSelectedListener(mItemSelectedListener);
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
