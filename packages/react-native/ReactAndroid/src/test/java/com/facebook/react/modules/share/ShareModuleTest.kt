/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.share

import android.content.Intent
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.testutils.shadows.ShadowArguments
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class ShareModuleTest {

  private lateinit var shareModule: ShareModule
  private lateinit var activityController: ActivityController<FragmentActivity>

  @Before
  fun prepareModules() {
    activityController = Robolectric.buildActivity(FragmentActivity::class.java)
    val activity = activityController.create().start().resume().get()
    val applicationContext = ReactTestHelper.createCatalystContextForTest()
    applicationContext.onNewIntent(activity, Intent())
    shareModule = ShareModule(applicationContext)
  }

  @Test
  fun testShareDialog() {
    val title = "Title"
    val message = "Message"
    val dialogTitle = "Dialog Title"

    val content = JavaOnlyMap()
    content.putString("title", title)
    content.putString("message", message)

    val promise = SimplePromise()

    shareModule.share(content, dialogTitle, promise)

    val chooserIntent = shadowOf(RuntimeEnvironment.getApplication()).nextStartedActivity
    assertNotNull("Dialog was not displayed", chooserIntent)
    assertEquals(Intent.ACTION_CHOOSER, chooserIntent.action)
    assertEquals(dialogTitle, chooserIntent.extras?.getString(Intent.EXTRA_TITLE))

    val contentIntent = chooserIntent.extras?.getParcelable(Intent.EXTRA_INTENT, Intent::class.java)
    assertNotNull("Intent was not built correctly", contentIntent)
    assertEquals(Intent.ACTION_SEND, contentIntent?.action)
    assertEquals(title, contentIntent?.extras?.getString(Intent.EXTRA_SUBJECT))
    assertEquals(message, contentIntent?.extras?.getString(Intent.EXTRA_TEXT))

    assertEquals(1, promise.resolved)
  }

  @Test
  fun testInvalidContent() {
    val dialogTitle = "Dialog Title"

    val promise = SimplePromise()

    shareModule.share(null, dialogTitle, promise)

    assertEquals(1, promise.rejected)
    assertEquals(ShareModule.ERROR_INVALID_CONTENT, promise.errorCode)
  }

  internal class SimplePromise : Promise {
    companion object {
      private const val ERROR_DEFAULT_CODE = "EUNSPECIFIED"
      private const val ERROR_DEFAULT_MESSAGE = "Error not specified."
    }

    var resolved = 0
      private set

    var rejected = 0
      private set

    var value: Any? = null
      private set

    var errorCode: String? = null
      private set

    var errorMessage: String? = null
      private set

    override fun resolve(value: Any?) {
      resolved++
      this.value = value
    }

    override fun reject(code: String?, message: String?) {
      reject(code, message, null, null)
    }

    override fun reject(code: String?, throwable: Throwable?) {
      reject(code, null, throwable, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?) {
      reject(code, message, throwable, null)
    }

    override fun reject(throwable: Throwable?) {
      reject(null, null, throwable, null)
    }

    override fun reject(throwable: Throwable?, userInfo: WritableMap?) {
      reject(null, null, throwable, userInfo)
    }

    override fun reject(code: String?, userInfo: WritableMap) {
      reject(code, null, null, userInfo)
    }

    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap?) {
      reject(code, null, throwable, userInfo)
    }

    override fun reject(code: String?, message: String?, userInfo: WritableMap) {
      reject(code, message, null, userInfo)
    }

    override fun reject(
        code: String?,
        message: String?,
        throwable: Throwable?,
        userInfo: WritableMap?
    ) {
      rejected++

      errorCode = code ?: ERROR_DEFAULT_CODE
      errorMessage = message ?: throwable?.message ?: ERROR_DEFAULT_MESSAGE
    }

    @Deprecated("Method deprecated")
    override fun reject(message: String?) {
      reject(null, message, null, null)
    }
  }
}
