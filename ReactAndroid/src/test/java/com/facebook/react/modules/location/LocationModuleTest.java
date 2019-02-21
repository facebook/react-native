/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.location;

import android.content.Context;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.support.v4.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Tests for {@link LocationModule}.
 */
@PrepareForTest({LocationManager.class, ContextCompat.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@RunWith(RobolectricTestRunner.class)
public class LocationModuleTest {

  private ReactApplicationContext mAppContext;
  private LocationModule mLocModule;
  private LocationManager mLocManager;

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void setUp() throws Exception {
    PowerMockito.mockStatic(ContextCompat.class);

    mAppContext = ReactTestHelper.createCatalystContextForTest();
    mLocModule = new LocationModule(mAppContext);
    mLocManager = (LocationManager) mAppContext.getSystemService(Context.LOCATION_SERVICE);
  }

  @Test
  public void testGpsAndNetwork() {
    LocationManager mMockedLocManager = mock(LocationManager.class);
    when(mMockedLocManager.isProviderEnabled(LocationManager.GPS_PROVIDER)).thenReturn(true);
    when(mMockedLocManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)).thenReturn(true);

    when(ContextCompat.checkSelfPermission(mAppContext, android.Manifest.permission.ACCESS_FINE_LOCATION)).thenReturn(PackageManager.PERMISSION_GRANTED);
    assertEquals(LocationManager.GPS_PROVIDER, mLocModule.getValidProvider(mLocManager, true));
    assertEquals(LocationManager.NETWORK_PROVIDER, mLocModule.getValidProvider(mLocManager, false));

    when(ContextCompat.checkSelfPermission(mAppContext, android.Manifest.permission.ACCESS_FINE_LOCATION)).thenReturn(PackageManager.PERMISSION_DENIED);
    assertEquals(null, mLocModule.getValidProvider(mLocManager, true));
    assertEquals(LocationManager.NETWORK_PROVIDER, mLocModule.getValidProvider(mLocManager, false));
  }

  public void testGpsNoNetwork() {
    LocationManager mMockedLocManager = mock(LocationManager.class);
    when(mMockedLocManager.isProviderEnabled(LocationManager.GPS_PROVIDER)).thenReturn(true);
    when(mMockedLocManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)).thenReturn(false);

    when(ContextCompat.checkSelfPermission(mAppContext, android.Manifest.permission.ACCESS_FINE_LOCATION)).thenReturn(PackageManager.PERMISSION_GRANTED);
    assertEquals(LocationManager.GPS_PROVIDER, mLocModule.getValidProvider(mLocManager, true));
    assertEquals(null, mLocModule.getValidProvider(mLocManager, false));

    when(ContextCompat.checkSelfPermission(mAppContext, android.Manifest.permission.ACCESS_FINE_LOCATION)).thenReturn(PackageManager.PERMISSION_DENIED);
    assertEquals(LocationManager.GPS_PROVIDER, mLocModule.getValidProvider(mLocManager, true));
    assertEquals(null, mLocModule.getValidProvider(mLocManager, false));
  }
}
