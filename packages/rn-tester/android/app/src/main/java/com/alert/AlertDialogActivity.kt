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
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext

public class AlertDialogActivity: Activity() {

  private var taskID: Int? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        displayAlert()

      val taskConfig = HeadlessJsTaskConfig(
        taskKey = "MY_TESTING_KEY",
        timeout = 0,
        data = Arguments.createMap(),
        isAllowedInForeground = true)
      ForcedAlertModule.currentContext?.let {
        val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(it)
        taskID = headlessJsTaskContext.startTask(taskConfig)
      }
    }

  override fun onDestroy() {
    super.onDestroy()
    ForcedAlertModule.currentContext?.let {
      taskID?.let { id ->
        val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(it)
        headlessJsTaskContext.finishTask(id)
        taskID = null
      }
    }
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
