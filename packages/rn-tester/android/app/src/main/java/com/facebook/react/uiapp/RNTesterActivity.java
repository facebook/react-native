/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import android.os.Bundle;
import androidx.annotation.Nullable;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class RNTesterActivity extends ReactActivity {
  public static class RNTesterActivityDelegate extends DefaultReactActivityDelegate {
    private static final String PARAM_ROUTE = "route";
    private Bundle mInitialProps = null;
    private final @Nullable ReactActivity mActivity;

    public RNTesterActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(
          activity,
          mainComponentName,
          DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
          DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
          );
      this.mActivity = activity;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
      // Get remote param before calling super which uses it
      Bundle bundle = mActivity.getIntent().getExtras();
      if (bundle != null && bundle.containsKey(PARAM_ROUTE)) {
        String routeUri =
            new StringBuilder("rntester://example/")
                .append(bundle.getString(PARAM_ROUTE))
                .append("Example")
                .toString();
        mInitialProps = new Bundle();
        mInitialProps.putString("exampleFromAppetizeParams", routeUri);
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
}
