/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.Rule;

import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class CompositeReactPackageTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Mock ReactPackage packageNo1;
  @Mock ReactPackage packageNo2;
  @Mock ReactPackage packageNo3;

  @Mock ReactApplicationContext reactContext;

  @Before
  public void initMocks() {
    MockitoAnnotations.initMocks(this);
  }

  @Test
  public void testThatCreateNativeModulesIsCalledOnAllPackages() {
    // Given
    CompositeReactPackage composite = new CompositeReactPackage(packageNo1, packageNo2, packageNo3);

    // When
    composite.createNativeModules(reactContext);

    // Then
    verify(packageNo1).createNativeModules(reactContext);
    verify(packageNo2).createNativeModules(reactContext);
    verify(packageNo3).createNativeModules(reactContext);
  }

  @Test
  public void testThatCreateViewManagersIsCalledOnAllPackages() {
    // Given
    CompositeReactPackage composite = new CompositeReactPackage(packageNo1, packageNo2, packageNo3);

    // When
    composite.createViewManagers(reactContext);

    // Then
    verify(packageNo1).createViewManagers(reactContext);
    verify(packageNo2).createViewManagers(reactContext);
    verify(packageNo3).createViewManagers(reactContext);
  }

  @Test
  public void testThatCompositeReturnsASumOfNativeModules() {
    // Given
    CompositeReactPackage composite = new CompositeReactPackage(packageNo1, packageNo2);

    NativeModule moduleNo1 = mock(NativeModule.class);
    when(moduleNo1.getName()).thenReturn("ModuleNo1");

    // module2 and module3 will share same name, composite should return only the latter one
    final String sameModuleName = "SameModuleName";

    NativeModule moduleNo2 = mock(NativeModule.class);
    when(moduleNo2.getName()).thenReturn(sameModuleName);

    NativeModule moduleNo3 = mock(NativeModule.class);
    when(moduleNo3.getName()).thenReturn(sameModuleName);

    NativeModule moduleNo4 = mock(NativeModule.class);
    when(moduleNo4.getName()).thenReturn("ModuleNo4");

    when(packageNo1.createNativeModules(reactContext)).thenReturn(
        Arrays.asList(new NativeModule[]{moduleNo1, moduleNo2}));

    when(packageNo2.createNativeModules(reactContext)).thenReturn(
        Arrays.asList(new NativeModule[]{moduleNo3, moduleNo4}));

    // When
    List<NativeModule> compositeModules = composite.createNativeModules(reactContext);

    // Then

    // Wrapping lists into sets to be order-independent.
    // Note that there should be no module2 returned.
    Set<NativeModule> expected = new HashSet<>(
        Arrays.asList(new NativeModule[]{moduleNo1, moduleNo3, moduleNo4}));
    Set<NativeModule> actual = new HashSet<>(compositeModules);

    assertEquals(expected, actual);
  }

  @Test
  public void testThatCompositeReturnsASumOfViewManagers() {
    // Given
    CompositeReactPackage composite = new CompositeReactPackage(packageNo1, packageNo2);

    ViewManager managerNo1 = mock(ViewManager.class);
    when(managerNo1.getName()).thenReturn("ManagerNo1");

    // managerNo2 and managerNo3 will share same name, composite should return only the latter one
    final String sameModuleName = "SameModuleName";

    ViewManager managerNo2 = mock(ViewManager.class);
    when(managerNo2.getName()).thenReturn(sameModuleName);

    ViewManager managerNo3 = mock(ViewManager.class);
    when(managerNo3.getName()).thenReturn(sameModuleName);

    ViewManager managerNo4 = mock(ViewManager.class);
    when(managerNo4.getName()).thenReturn("ManagerNo4");

    when(packageNo1.createViewManagers(reactContext)).thenReturn(
        Arrays.asList(new ViewManager[]{managerNo1, managerNo2}));

    when(packageNo2.createViewManagers(reactContext)).thenReturn(
        Arrays.asList(new ViewManager[]{managerNo3, managerNo4}));

    // When
    List<ViewManager> compositeModules = composite.createViewManagers(reactContext);

    // Then

    // Wrapping lists into sets to be order-independent.
    // Note that there should be no managerNo2 returned.
    Set<ViewManager> expected = new HashSet<>(
        Arrays.asList(new ViewManager[]{managerNo1, managerNo3, managerNo4})
    );
    Set<ViewManager> actual = new HashSet<>(compositeModules);

    assertEquals(expected, actual);
  }
}
