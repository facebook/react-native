/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.fbreact.specs

import android.net.Uri
import android.os.Build
import android.util.DisplayMetrics
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultRegistry 
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.ActivityResultLauncher
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings
import java.util.UUID


//https://stackoverflow.com/questions/64476827/how-to-resolve-the-error-lifecycleowners-must-call-register-before-they-are-sta
public fun <I, O> ComponentActivity.registerActivityResultLauncher(
    contract: ActivityResultContract<I, O>,
    callback: ActivityResultCallback<O>
): ActivityResultLauncher<I> {
    val key = UUID.randomUUID().toString()
    return activityResultRegistry.register(key, contract, callback)
}

@DoNotStrip
@ReactModule(name = ImagePickerAndroid.NAME)
public class ImagePickerAndroid(private val context: ReactApplicationContext) :
    NativeImagePickerAndroidSpec(context) {

  @DoNotStrip
  @Suppress("unused")
  override fun getImageUrl(promise: Promise?) {
    val activity = context.getCurrentActivity() as? ComponentActivity
    if(context.hasCurrentActivity() && activity!=null){
      val launcher  = activity.registerActivityResultLauncher(ActivityResultContracts.GetContent(), { uri: Uri? ->
        if(uri != null){
          promise?.resolve(uri.toString())
        }else{
          promise?.resolve(null)
        }
      })
      launcher.launch("image/*")
    }else{
      promise?.reject("code1","Unable to obtain an image uri. No Current Activity.")
    }
  }

  override fun getName(): String {
    return NAME
  }

  public companion object {
    public const val NAME: String = "ImagePickerAndroid"
  }
}

