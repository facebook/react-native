/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.core.util.Pools.SimplePool

/** Implementation of Dynamic wrapping a ReadableMap. */
internal class DynamicFromMap
// This is a pools object. Hide the constructor.
private constructor() : Dynamic {
    private var mMap: ReadableMap? = null
    private var mName: String? = null

    override fun recycle() {
        mMap = null
        mName = null
        sPool.get()?.release(this)
    }

    override val isNull: Boolean
        get() {
            check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
            return mMap!!.isNull(mName!!)
        }

    override fun asBoolean(): Boolean {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getBoolean(mName!!)
    }

    override fun asDouble(): Double {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getDouble(mName!!)
    }

    override fun asInt(): Int {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getInt(mName!!)
    }

    override fun asString(): String? {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getString(mName!!)
    }

    override fun asArray(): ReadableArray? {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getArray(mName!!)
    }

    override fun asMap(): ReadableMap? {
        check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
        return mMap!!.getMap(mName!!)
    }

    override val type: ReadableType
        get() {
            check(!(mMap == null || mName == null)) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
            return mMap!!.getType(mName!!)
        }

    companion object {
        private val sPool: ThreadLocal<SimplePool<DynamicFromMap>> =
            ThreadLocal.withInitial { SimplePool(10) }

        private const val DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE =
            "This dynamic value has been recycled"

        fun create(map: ReadableMap?, name: String?): DynamicFromMap {
            val dynamic = sPool.get()?.acquire() ?: DynamicFromMap()

            return dynamic.apply {
                mMap = map
                mName = name
            }
        }
    }
}
