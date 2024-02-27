/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager
import java.util.*
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class CompositeReactPackageTest {
  private lateinit var packageNo1: ReactPackage
  private lateinit var packageNo2: ReactPackage
  private lateinit var packageNo3: ReactPackage
  private lateinit var reactContext: BridgeReactContext

  @Before
  fun setUp() {
    packageNo1 = mock(ReactPackage::class.java)
    packageNo2 = mock(ReactPackage::class.java)
    packageNo3 = mock(ReactPackage::class.java)
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
  }

  @Test
  @Suppress("DEPRECATION")
  fun testThatCreateNativeModulesIsCalledOnAllPackages() {
    // Given
    val composite = CompositeReactPackage(packageNo1, packageNo2, packageNo3)

    // When
    composite.createNativeModules(reactContext)

    // Then
    verify(packageNo1).createNativeModules(reactContext)
    verify(packageNo2).createNativeModules(reactContext)
    verify(packageNo3).createNativeModules(reactContext)
  }

  @Test
  @Suppress("DEPRECATION")
  fun testThatCreateViewManagersIsCalledOnAllPackages() {
    // Given
    val composite = CompositeReactPackage(packageNo1, packageNo2, packageNo3)

    // When
    composite.createViewManagers(reactContext)

    // Then
    verify(packageNo1).createViewManagers(reactContext)
    verify(packageNo2).createViewManagers(reactContext)
    verify(packageNo3).createViewManagers(reactContext)
  }

  @Test
  @Suppress("DEPRECATION")
  fun testThatCompositeReturnsASumOfNativeModules() {
    // Given
    val composite = CompositeReactPackage(packageNo1, packageNo2)
    val moduleNo1 = mock(NativeModule::class.java)
    whenever(moduleNo1.name).thenReturn("ModuleNo1")

    // module2 and module3 will share same name, composite should return only the latter one
    val sameModuleName = "SameModuleName"
    val moduleNo2 = mock(NativeModule::class.java)
    whenever(moduleNo2.name).thenReturn(sameModuleName)
    val moduleNo3 = mock(NativeModule::class.java)
    whenever(moduleNo3.name).thenReturn(sameModuleName)
    val moduleNo4 = mock(NativeModule::class.java)
    whenever(moduleNo4.name).thenReturn("ModuleNo4")
    whenever(packageNo1.createNativeModules(reactContext)).thenReturn(listOf(moduleNo1, moduleNo2))
    whenever(packageNo2.createNativeModules(reactContext)).thenReturn(listOf(moduleNo3, moduleNo4))

    // When
    val compositeModules = composite.createNativeModules(reactContext)

    // Then

    // Wrapping lists into sets to be order-independent.
    // Note that there should be no module2 returned.
    val expected: Set<NativeModule> = setOf(moduleNo1, moduleNo3, moduleNo4)
    val actual: Set<NativeModule> = compositeModules.toSet()
    Assert.assertEquals(expected, actual)
  }

  @Test
  @Suppress("DEPRECATION")
  fun testThatCompositeReturnsASumOfViewManagers() {
    // Given
    val composite = CompositeReactPackage(packageNo1, packageNo2)
    val managerNo1 = mock(ViewManager::class.java)
    whenever(managerNo1.name).thenReturn("ManagerNo1")

    // managerNo2 and managerNo3 will share same name, composite should return only the latter
    // one
    val sameModuleName = "SameModuleName"
    val managerNo2 = mock(ViewManager::class.java)
    whenever(managerNo2.name).thenReturn(sameModuleName)
    val managerNo3 = mock(ViewManager::class.java)
    whenever(managerNo3.name).thenReturn(sameModuleName)
    val managerNo4 = mock(ViewManager::class.java)
    whenever(managerNo4.name).thenReturn("ManagerNo4")
    whenever(packageNo1.createViewManagers(reactContext)).thenReturn(listOf(managerNo1, managerNo2))
    whenever(packageNo2.createViewManagers(reactContext)).thenReturn(listOf(managerNo3, managerNo4))

    // When
    val compositeModules = composite.createViewManagers(reactContext)

    // Then

    // Wrapping lists into sets to be order-independent.
    // Note that there should be no managerNo2 returned.
    val expected: Set<ViewManager<*, *>> = setOf(managerNo1, managerNo3, managerNo4)
    val actual: Set<ViewManager<*, *>> = compositeModules.toSet()
    Assert.assertEquals(expected, actual)
  }
}
