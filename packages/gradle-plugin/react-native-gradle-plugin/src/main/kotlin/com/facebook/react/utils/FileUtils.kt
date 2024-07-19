/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File

internal fun File.moveTo(destination: File) {
  copyTo(destination, overwrite = true)
  delete()
}

internal fun File.recreateDir() {
  deleteRecursively()
  mkdirs()
}
