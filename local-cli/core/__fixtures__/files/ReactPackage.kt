package com.some.example;

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import java.util.*

class SomeExampleKotlinPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule>
            = mutableListOf(MaterialPaletteModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext?):
            MutableList<ViewManager<View, ReactShadowNode>> = Collections.emptyList()

}
