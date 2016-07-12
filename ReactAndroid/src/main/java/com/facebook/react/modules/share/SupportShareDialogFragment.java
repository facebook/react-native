/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.share;

import javax.annotation.Nullable;

import android.app.Dialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.support.v4.app.DialogFragment;
import android.widget.ArrayAdapter;

import java.util.ArrayList;
import java.util.List;

@SuppressWarnings("ValidFragment")
public class SupportShareDialogFragment extends DialogFragment {

  @Nullable ShareModule.ShareDialogListener mListener;
  private Intent mIntent;

  public SupportShareDialogFragment(Intent intent) {
    mIntent = intent;
  }

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    final Bundle args = getArguments();

    final List<String> packages = new ArrayList<String>();
    final List<ResolveInfo> resInfos = getActivity().getPackageManager().queryIntentActivities(mIntent, 0);
    for (ResolveInfo resInfo : resInfos) {
      String packageName = resInfo.activityInfo.packageName;
      packages.add(packageName);
    }

    ArrayAdapter<String> adapter = new ChooserArrayAdapter(
      getActivity(), android.R.layout.select_dialog_item, android.R.id.text1, packages);

    final OnClickListener onClickItem = new DialogInterface.OnClickListener() {
      public void onClick(DialogInterface dialog, int item ) {
        String packageName = packages.get(item);
        mIntent.setComponent(new ComponentName(packageName, resInfos.get(item).activityInfo.name));
        mIntent.setPackage(packageName);
        getActivity().startActivity(mIntent);
        if (mListener != null) {
          mListener.onClick(dialog, packageName);
        }
      }
    };

    return ShareDialogFragment.createDialog(args, getActivity(), onClickItem, adapter);
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    super.onDismiss(dialog);
    if (mListener != null) {
      mListener.onDismiss(dialog);
    }
  }

  public void setListener(@Nullable ShareModule.ShareDialogListener listener) {
    mListener = listener;
  }
}
