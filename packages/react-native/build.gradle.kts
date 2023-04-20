/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This is the top level build.gradle.kts file used when the users
// is doing a build from source. It's triggered as the user
// will add an `includeBuild(../node_modules/react-native)` in
// their settings.gradle.kts file.
// More on this here: https://reactnative.dev/contributing/how-to-build-from-source
plugins {
  id("com.android.library") version "7.4.2" apply false
  id("com.android.application") version "7.4.2" apply false
  id("de.undercouch.download") version "5.0.1" apply false
  kotlin("android") version "1.7.22" apply false
}
