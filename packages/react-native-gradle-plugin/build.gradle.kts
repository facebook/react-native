/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  kotlin("jvm") version "1.4.21"
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("reactApp") {
      id = "com.facebook.react.app"
      implementationClass = "com.facebook.react.ReactAppPlugin"
    }
  }
}

dependencies {
  implementation(gradleApi())
  implementation("com.android.tools.build:gradle:4.2.2")
}
