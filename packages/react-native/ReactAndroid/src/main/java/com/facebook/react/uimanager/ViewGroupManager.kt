/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import java.util.*

public abstract class ViewGroupManager<T : ViewGroup>
@JvmOverloads
constructor(reactContext: ReactApplicationContext? = null) :
    BaseViewManager<T, LayoutShadowNode>(reactContext), IViewGroupManager<T> {

    public companion object {
        private val zIndexHash: WeakHashMap<View, Int> = WeakHashMap()

        @JvmStatic
        public fun setViewZIndex(view: View, zIndex: Int): Unit = zIndexHash.set(view, zIndex)

        @JvmStatic public fun getViewZIndex(view: View?): Int? = zIndexHash[view]
    }

    public override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

    public override fun getShadowNodeClass(): Class<out LayoutShadowNode> =
        LayoutShadowNode::class.java

    public override fun updateExtraData(root: T, extraData: Any) {}

    public override fun addView(parent: T, child: View, index: Int): Unit =
        parent.addView(child, index)

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
    }

    public fun removeView(parent: T, view: View) {
        UiThreadUtil.assertOnUiThread()
        for (i in 0 until getChildCount(parent)) {
            if (getChildAt(parent, i) === view) {
                removeViewAt(parent, i)
                break
            }
        }
    }

    public override fun needsCustomLayoutForChildren(): Boolean = false
}
