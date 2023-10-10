/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

import android.app.Activity;
import android.content.Context;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.uimanager.UIManagerModule;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;

/** Tests {@link BridgelessReactContext} */
@RunWith(RobolectricTestRunner.class)
public class BridgelessReactContextTest {

  private Context mContext;
  private ReactHostImpl mReactHost;
  private BridgelessReactContext mBridgelessReactContext;

  @Before
  public void setUp() {
    mContext = Robolectric.buildActivity(Activity.class).create().get();
    mReactHost = Mockito.mock(ReactHostImpl.class);
    mBridgelessReactContext = new BridgelessReactContext(mContext, mReactHost);
  }

  @Test
  public void getNativeModuleTest() {
    UIManagerModule mUiManagerModule = Mockito.mock(UIManagerModule.class);
    doReturn(mUiManagerModule)
        .when(mReactHost)
        .getNativeModule(ArgumentMatchers.<Class<UIManagerModule>>any());

    UIManagerModule uiManagerModule =
        mBridgelessReactContext.getNativeModule(UIManagerModule.class);

    assertThat(uiManagerModule).isEqualTo(mUiManagerModule);
  }

  @Test(expected = UnsupportedOperationException.class)
  public void getJSIModule_throwsException() {
    mBridgelessReactContext.getJSIModule(JSIModuleType.TurboModuleManager);
  }

  // Disable this test for now due to mocking FabricUIManager fails
  // @Test
  // public void getJSIModuleTest() {
  //   FabricUIManager fabricUiManager = Mockito.mock(FabricUIManager.class);
  //   doReturn(fabricUiManager).when(mReactHost).getUIManager();
  //   assertThat(mBridgelessReactContext.getJSIModule(JSIModuleType.UIManager))
  //       .isEqualTo(fabricUiManager);
  // }

  @Test(expected = UnsupportedOperationException.class)
  public void getCatalystInstance_throwsException() {
    mBridgelessReactContext.getCatalystInstance();
  }
}
