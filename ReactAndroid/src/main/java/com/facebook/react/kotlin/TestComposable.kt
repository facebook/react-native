/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.kotlin

import android.content.Context
import android.util.Log
import android.view.View
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView

@Composable
fun TestComposable() {
  Text("Hello world from Compose!")
}

fun getComposeView(context: Context): View {
  Log.e("TAG", "DAVIDDAVIDDAVIDDAVIDDAVIDDAVIDDAVIDDAVIDDAVID")

  return ComposeView(context).apply { setContent { TestComposable() } }
}
