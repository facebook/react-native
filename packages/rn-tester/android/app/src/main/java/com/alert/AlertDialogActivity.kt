package com.alert
import android.app.Activity
import android.content.Intent
import android.icu.lang.UCharacter.VerticalOrientation
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.AppCompatButton

public class AlertDialogActivity: Activity() {
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
        button1.setText("Send event")
        button1.setOnClickListener {
            ForcedAlertModule.sendSyncEvent(message ?: "no message")
        }

        val button2 = AppCompatButton(this)
        button2.setText("Send async event")
        button2.setOnClickListener {
            ForcedAlertModule.sendAsyncEvent(message ?: "no message")
        }
        view.addView(button1)
        view.addView(button2)

        builder
            .setView(view)
            .setTitle(title)
            .setPositiveButton("Dismiss") { _, _ ->
                ForcedAlertModule.sendSyncEvent("Closing Alert")
                ForcedAlertModule.sendAsyncEvent("Closing Alert")
                finish()
            }

        ForcedAlertModule.sendSyncEvent("Opening Alert")
        ForcedAlertModule.sendAsyncEvent("Opening Alert")

        val alert = builder.create()
        alert.setCancelable(false)
        alert.show()
    }
}
