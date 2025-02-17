/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.example.benchmark

import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * This is an example startup benchmark.
 *
 * It navigates to the device's home screen, and launches the default activity.
 *
 * Before running this benchmark:
 * 1) switch your app's active build variant in the Studio (affects Studio runs only)
 * 2) add `<profileable android:shell="true" />` to your app's manifest, within the `<application>`
 *    tag
 *
 * Run this benchmark from Studio to see startup measurements, and captured system traces for
 * investigating your app's performance.
 */
@RunWith(AndroidJUnit4::class)
class ExampleStartupBenchmark {
  @get:Rule val benchmarkRule = MacrobenchmarkRule()

  @Test
  fun startup() =
      benchmarkRule.measureRepeated(
          packageName = "com.facebook.react.uiapp",
          metrics = listOf(StartupTimingMetric()),
          iterations = 10,
          startupMode = StartupMode.COLD,
          setupBlock = {
            pressHome()
          }) {
            startActivityAndWait()

            // Waits for an element that corresponds to fully drawn state
            device.wait(Until.hasObject(By.text("Components")), 10_000)
            device.waitForIdle()
          }
}
