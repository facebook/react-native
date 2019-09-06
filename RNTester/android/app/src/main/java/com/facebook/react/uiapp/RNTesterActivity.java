/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uiapp;

import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;

import androidx.annotation.Nullable;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;

public class RNTesterActivity extends ReactActivity {
  public static class RNTesterActivityDelegate extends ReactActivityDelegate {
    private static final String PARAM_ROUTE = "route";
    private static final String PARAM_BUNDLE_TEST = "bundle-test";
    private Bundle mInitialProps = null;
    private final @Nullable ReactActivity mActivity;

    public RNTesterActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
      this.mActivity = activity;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
      // Get remote param before calling super which uses it
      Intent intent = mActivity.getIntent();
      if (Intent.ACTION_VIEW.equals(intent.getAction())) {
        Uri data = intent.getData();
        if (data != null) {
          intent.setData(null); // Reset so that we only take action once.
          mInitialProps = new Bundle();
          String host = data.getHost();
          if ("example".equals(host)) {
            String routeUri =
              "rntester://example/" +
                data.getQueryParameter(PARAM_ROUTE) +
                "Example";
            mInitialProps.putString("exampleFromAppetizeParams", routeUri);
          } else if ("bundle-test".equals(host)) {
            Bundle[] children = new Bundle[2];
            children[0] = new Bundle();
            children[1] = new Bundle();
            children[0].putString("exampleChildKey", "exampleChild1");
            children[1].putString("exampleChildKey", "exampleChild2");
            mInitialProps.putSerializable("bundle", children);
            Parcel parcel = null;
            byte[] bytes = null;

            try {
              parcel = Parcel.obtain();
              mInitialProps.writeToParcel(parcel, 0);
              bytes = parcel.marshall();
              parcel.unmarshall(bytes, 0, bytes.length);
              parcel.setDataPosition(0);
              mInitialProps = Bundle.CREATOR.createFromParcel(parcel);
            } finally {
              if (parcel != null) {
                parcel.recycle();
              }
            }
          }
        }
      }

      super.onCreate(savedInstanceState);
    }

    @Override
    protected Bundle getLaunchOptions() {
      return mInitialProps;
    }
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new RNTesterActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected String getMainComponentName() {
    return "RNTesterApp";
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ReactInstanceManager instanceManager = getReactInstanceManager();

    if (instanceManager != null) {
      instanceManager.onConfigurationChanged(newConfig);
    }
  }
}
