package com.alert

import android.content.Intent
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONException
import org.json.JSONObject

public class ForcedAlertModule internal constructor(private val context: ReactApplicationContext?) :
  ReactContextBaseJavaModule(context) {

  @ReactMethod
  public fun addListener(eventName: String?) { /* No JS events expected */
  }

  @ReactMethod
  public fun removeListeners(count: Int?) { /* No JS events expected */
  }

  override fun getName(): String {
    return "ForcedAlert"
  }

  override fun getConstants(): MutableMap<String, Any> =
    hashMapOf("EVENT_SYNC" to EVENT_SYNC, "EVENT_ASYNC" to EVENT_ASYNC)

  @ReactMethod
  public fun alert(title: String?, message: String?) {
    val dialogIntent = Intent(reactApplicationContext, AlertDialogActivity::class.java)
    dialogIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    dialogIntent.putExtra("title", title)
    dialogIntent.putExtra("message", message)
    context?.startActivity(dialogIntent)
    currentContext = context
  }

  public companion object {
    public const val EVENT_SYNC: String = "EVENT_SYNC"
    public const val EVENT_ASYNC: String = "EVENT_ASYNC"

    private var currentContext: ReactApplicationContext? = null

    public fun sendSyncEvent(body: String) {
      currentContext?.getJSModule(ReactContext.RCTDeviceEventEmitter::class.java)
        ?.emit(EVENT_SYNC, body)
    }

    public fun sendAsyncEvent(body: String) {
      currentContext?.getJSModule(ReactContext.RCTDeviceEventEmitter::class.java)
        ?.emit(EVENT_ASYNC, body)
    }
  }
}
