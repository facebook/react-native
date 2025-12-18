package com.facebook.react.uiapp.component

import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.core.view.children
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.viewmanagers.CustomViewManagerInterface
import com.facebook.react.viewmanagers.CustomViewManagerDelegate

@ReactModule(name = CustomViewManager.REACT_CLASS)
public class CustomViewManager : ViewGroupManager<ReactViewGroup>(), CustomViewManagerInterface<ReactViewGroup> {
  private val delegate: CustomViewManagerDelegate<ReactViewGroup, CustomViewManager> =
    CustomViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReactViewGroup> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ReactViewGroup = ReactViewGroup(reactContext)

  private val listOfTransitions = mutableListOf<Pair<ViewGroup, View>>()
  public override fun startViewTransition(view: ReactViewGroup?) {
    if (view == null) return

    val reactContext = UIManagerHelper.getReactContext(view)
    val reactTag = view.id
    val uiManager = UIManagerHelper.getUIManagerForReactTag(reactContext, reactTag)
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)

    view.children.forEach { child ->
      Log.d("HannoDebug", "Starting view transition for child: ${child.javaClass.simpleName}:${child.id}")
      uiManager!!.markViewAsInTransition(surfaceId, child.id, true)
      view.startViewTransition(child)
      listOfTransitions.add(Pair(view, child))
      if (child is ViewGroup) {
        child.children.forEach {
          Log.d("HannoDebug", "Starting view transition for grandchild: ${it.javaClass.simpleName}:${it.id}")
          uiManager.markViewAsInTransition(surfaceId, it.id, true)
          child.startViewTransition(it)
          listOfTransitions.add(Pair(child, it) )
        }
      }
    }
    (view.parent as? ViewGroup)?.startViewTransition(view)?.also {
      listOfTransitions.add(Pair(view.parent as ViewGroup, view) )
    }
  }

  public override fun endViewTransition(view: ReactViewGroup?) {
    if (view == null) return

    val reactContext = UIManagerHelper.getReactContext(view)
    val reactTag = view.id
    val uiManager = UIManagerHelper.getUIManagerForReactTag(reactContext, reactTag)
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)

    // TODO: once fixed also stress test with .reversed(), it should work correctly then
    listOfTransitions.reversed().forEach { (parent, child) ->
      Log.d("HannoDebug", "Ending view transition for child: ${child.javaClass.simpleName}:${child.id}")

      UiThreadUtil.runOnUiThread({
        parent.endViewTransition(child)
        uiManager!!.markViewAsInTransition(surfaceId, child.id, false)
      })
    }
    listOfTransitions.clear()
  }

  public companion object {
    public const val REACT_CLASS: String = "CustomView"
  }
}
