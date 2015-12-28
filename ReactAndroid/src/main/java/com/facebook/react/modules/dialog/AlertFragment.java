/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.dialog;

import javax.annotation.Nullable;

import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DialogFragment;
import android.content.DialogInterface;
import android.content.Context;
import android.os.Bundle;

/**
 * A fragment used to display the dialog.
 */
/* package */ class AlertFragment extends DialogFragment implements DialogInterface.OnClickListener {

  /* package */ static final String ARG_TITLE = "title";
  /* package */ static final String ARG_MESSAGE = "message";
  /* package */ static final String ARG_BUTTON_POSITIVE = "button_positive";
  /* package */ static final String ARG_BUTTON_NEGATIVE = "button_negative";
  /* package */ static final String ARG_BUTTON_NEUTRAL = "button_neutral";

  private final @Nullable DialogModule.AlertFragmentListener mListener;

  public AlertFragment(@Nullable DialogModule.AlertFragmentListener listener, Bundle arguments) {
    mListener = listener;
    setArguments(arguments);
  }

  public static Dialog createDialog(
      Context activityContext, Bundle arguments, DialogInterface.OnClickListener fragment) {
    AlertDialog.Builder builder = new AlertDialog.Builder(activityContext)
        .setTitle(arguments.getString(ARG_TITLE))
        .setMessage(arguments.getString(ARG_MESSAGE));

    if (arguments.containsKey(ARG_BUTTON_POSITIVE)) {
      builder.setPositiveButton(arguments.getString(ARG_BUTTON_POSITIVE), fragment);
    }
    if (arguments.containsKey(ARG_BUTTON_NEGATIVE)) {
      builder.setNegativeButton(arguments.getString(ARG_BUTTON_NEGATIVE), fragment);
    }
    if (arguments.containsKey(ARG_BUTTON_NEUTRAL)) {
      builder.setNeutralButton(arguments.getString(ARG_BUTTON_NEUTRAL), fragment);
    }

    return builder.create();
  }

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    return createDialog(getActivity(), getArguments(), this);
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
