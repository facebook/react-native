/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import com.facebook.proguard.annotations.DoNotStrip

/**
 * A JS exception that was propagated to native. In debug mode, these exceptions are normally shown
 * to developers in a redbox.
 */
@DoNotStrip
public open class JavascriptException(jsStackTrace: String) :
    RuntimeException(jsStackTrace), HasJavascriptExceptionMetadata {
  private var extraDataAsJson: String? = null

  override fun getExtraDataAsJson(): String? = extraDataAsJson

  public fun setExtraDataAsJson(extraDataAsJson: String?): JavascriptException {
    this.extraDataAsJson = extraDataAsJson
    return this
  }
}
