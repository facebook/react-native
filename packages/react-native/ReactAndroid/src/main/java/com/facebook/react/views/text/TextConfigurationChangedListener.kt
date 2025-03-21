package com.facebook.react.views.text

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.view.View

public object TextConfigurationChangedListener : BroadcastReceiver() {
  private val listeners = mutableMapOf<View, () -> Unit>()

  override fun onReceive(context: Context?, intent: Intent?) {
    if (intent?.action == Intent.ACTION_CONFIGURATION_CHANGED) {
      listeners.values.forEach { it() }
    }
  }

  public fun addListener(view: View, listener: () -> Unit) {
    if (listeners.isEmpty()) {
      val filter = IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED)
      view.context.registerReceiver(this, filter)
    }

    listeners[view] = listener
  }

  public fun removeListener(view: View) {
    listeners.remove(view)

    if (listeners.isEmpty()) {
      view.context.unregisterReceiver(this)
    }
  }
}
