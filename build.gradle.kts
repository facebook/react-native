// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

buildscript {
    repositories {
        mavenLocal()
        google()
        jcenter()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:3.3.0")
        classpath("de.undercouch:gradle-download-task:3.4.3")

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

allprojects {
    repositories {
        mavenLocal()
        google()
        jcenter()

        def androidSdk = System.getenv("ANDROID_SDK")
        maven {
            url("$androidSdk/extras/m2repository/")
        }
    }
}
