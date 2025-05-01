/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.app.Activity
import android.os.Bundle
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.AppCompatButton
import com.facebook.fbreact.specs.SampleLegacyModule

public class AlertDialogActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    displayAlert()
  }

  private fun displayAlert() {
    val builder = AlertDialog.Builder(this)
    val message = intent.getStringExtra("message")
    val title = intent.getStringExtra("title")
    val view = LinearLayout(this)
    view.orientation = LinearLayout.VERTICAL

    val button1 = AppCompatButton(this)
    button1.text = "Send event"
    button1.setOnClickListener {
      SampleLegacyModule.sendEvent(SampleLegacyModule.EVENT_A, message ?: "no message")
    }

    val button2 = AppCompatButton(this)
    button2.text = "Send event with async"
    button2.setOnClickListener {
      SampleLegacyModule.sendEvent(SampleLegacyModule.EVENT_B, message ?: "no message")
    }
    view.addView(button1)
    view.addView(button2)

    builder.setView(view).setTitle(title).setPositiveButton("Dismiss") { _, _ -> finish() }

    val alert = builder.create()
    alert.setCancelable(false)
    alert.show()
  }
}
