/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import androidx.core.view.doOnDetach
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import java.util.WeakHashMap

@Suppress("DEPRECATION")
public abstract class ViewGroupManager<T : ViewGroup>
@JvmOverloads
constructor(reactContext: ReactApplicationContext? = null) :
    BaseViewManager<T, LayoutShadowNode>(reactContext), IViewGroupManager<T> {

    public override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

    public override fun getShadowNodeClass(): Class<out LayoutShadowNode> =
        LayoutShadowNode::class.java

    public override fun updateExtraData(root: T, extraData: Any): Unit = Unit

    // parent: childIndex[] - Used when we can't immediately add a view
    protected val operationsMap: WeakHashMap<T, MutableMap<Int, Boolean>> = WeakHashMap()

    public fun addViewSafely(parent: T, child: View, index: Int, callback: () -> Unit) {
        UiThreadUtil.assertOnUiThread()

        if (child.parent == null) {
            callback()
            return
        }

        operationsMap.getOrPut(parent) {
            mutableMapOf()
        }[index] = true

        // When the child-parent relation is removed, onDetachedFromWindow will be called.
        // Its important to wait for detaching as the view might be in a transition, and isn't removed immediately.
        child.doOnDetach {
            // Looking at how endViewTransition is implemented, dispatchDetachedFromWindow
            // gets called _before_ the parent relation is removed, so we need to post this to the end of the frame:
            child.post {
                if(operationsMap.remove(parent) == null) {
                    // The addView operation was already countered by a removeView operation while we were waiting
                    FLog.w("ReactClippingViewManager", "Tried to add a view to a parent after the child was detached, but a remove operation was already enqueued")
                    return@post
                }
                FLog.w("ReactClippingViewManager", "addView(): ${child::class.java.simpleName} had a parent, removed from previous parent and after onDetach adding to new parent $parent")
                callback()
            }
        }

        // With the detach listener in place, we can now remove the view from the previous parent:
        // Note: This call here is potentially redundant, as SurfaceMountingManager.kt is already removing it
        (child.parent as? ViewGroup)?.removeView(child)
    }

    public override fun addView(parent: T, child: View, index: Int): Unit =
        addViewSafely(parent, child, index) { parent.addView(child, index) }

    /**
     * Convenience method for batching a set of addView calls Note that this adds the views to the
     * beginning of the ViewGroup
     *
     * @param parent the parent ViewGroup
     * @param views the set of views to add
     */
    public fun addViews(parent: T, views: List<View>) {
        UiThreadUtil.assertOnUiThread()
        views.forEachIndexed { i, view -> addView(parent, view, i) }
    }

    public override fun getChildCount(parent: T): Int = parent.childCount

    public override fun getChildAt(parent: T, index: Int): View? = parent.getChildAt(index)

    public override fun removeViewAt(parent: T, index: Int) {
        UiThreadUtil.assertOnUiThread()
        parent.removeViewAt(index)
        operationsMap[parent]?.remove(index)
    }

    /**
     * Expo overrides this function GroupViewManagerWrapper.kt`, which is a replacement view manager
     * adding support for delegates receiving callbacks whenever one of the methods in the view
     * manager are called.
     */
    public open fun removeView(parent: T, view: View) {
        UiThreadUtil.assertOnUiThread()

        for (i in 0 until getChildCount(parent)) {
            if (getChildAt(parent, i) === view) {

                removeViewAt(parent, i)
                break
            }
        }
    }

    /**
     * Returns whether this View type needs to handle laying out its own children instead of deferring
     * to the standard css-layout algorithm. Returns true for the layout to *not* be automatically
     * invoked. Instead onLayout will be invoked as normal and it is the View instance's
     * responsibility to properly call layout on its children. Returns false for the default behavior
     * of automatically laying out children without going through the ViewGroup's onLayout method. In
     * that case, onLayout for this View type must *not* call layout on its children.
     */
    public override fun needsCustomLayoutForChildren(): Boolean = false

    public companion object {
        private val zIndexHash: WeakHashMap<View, Int> = WeakHashMap()

        @JvmStatic
        public fun setViewZIndex(view: View, zIndex: Int): Unit = zIndexHash.set(view, zIndex)

        @JvmStatic public fun getViewZIndex(view: View?): Int? = zIndexHash[view]
    }
}
