/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.dialog;

import javax.annotation.Nullable;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;

import android.support.v4.app.DialogFragment;

/**
 * {@link AlertFragment} for apps that use the Support FragmentActivity and FragmentManager
 * for legacy reasons.
 */
public class SupportAlertFragment extends DialogFragment implements DialogInterface.OnClickListener {

  private final @Nullable DialogModule.AlertFragmentListener mListener;

  public SupportAlertFragment() {
      mListener = null;
  }

  @SuppressLint("ValidFragment")
  public SupportAlertFragment(@Nullable DialogModule.AlertFragmentListener listener, Bundle arguments) {
    mListener = listener;
    setArguments(arguments);
  }

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    return AlertFragment.createDialog(getActivity(), getArguments(), this);
  }

  @Override
  public void onClick(DialogInterface dialog, int which) {
    if (mListener != null) {
      mListener.onClick(dialog, which);
    }
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    super.onDismiss(dialog);
    if (mListener != null) {
      mListener.onDismiss(dialog);
    }
  }
}
