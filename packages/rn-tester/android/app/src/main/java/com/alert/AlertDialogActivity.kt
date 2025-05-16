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
            ForcedAlertModule.sendEvent(ForcedAlertModule.EVENT_A, message ?: "no message")
        }

        val button2 = AppCompatButton(this)
        button2.setText("Send event with async")
        button2.setOnClickListener {
            ForcedAlertModule.sendEvent(ForcedAlertModule.EVENT_B, message ?: "no message")
        }
        view.addView(button1)
        view.addView(button2)

        builder
            .setView(view)
            .setTitle(title)
            .setPositiveButton("Dismiss") { _, _ ->
                finish()
            }

        val alert = builder.create()
        alert.setCancelable(false)
        alert.show()
    }
}