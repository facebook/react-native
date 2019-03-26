/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import javax.annotation.Nullable;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;

import com.facebook.react.common.annotations.VisibleForTesting;

public class ReactPicker extends Spinner {

  private int mMode = MODE_DIALOG;
  private @Nullable Integer mPrimaryColor;
  private boolean mSuppressNextEvent;
  private @Nullable OnSelectListener mOnSelectListener;
  private @Nullable Integer mStagedSelection;

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

  public void setOnSelectListener(@Nullable OnSelectListener onSelectListener) {
    if (getOnItemSelectedListener() == null) {
      // onItemSelected gets fired immediately after layout because checkSelectionChanged() in
      // AdapterView updates the selection position from the default INVALID_POSITION. To match iOS
      // behavior, we don't want the event emitter for onItemSelected to fire right after layout.
      mSuppressNextEvent = true;
      setOnItemSelectedListener(
          new OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
              if (!mSuppressNextEvent && mOnSelectListener != null) {
                mOnSelectListener.onItemSelected(position);
              }
              mSuppressNextEvent = false;
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
              if (!mSuppressNextEvent && mOnSelectListener != null) {
                mOnSelectListener.onItemSelected(-1);
              }
              mSuppressNextEvent = false;
            }
          });
    }
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
      mSuppressNextEvent = true;
      setSelection(position);
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
