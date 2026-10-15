/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.util.DisplayMetrics
import android.view.InputDevice
import android.view.KeyCharacterMap
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTModernEventEmitter
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class])
class ReactEditTextKeyPressTest {

  private lateinit var view: ReactEditText
  private val reportedKeys = mutableListOf<String?>()
  private var nextDownTime = 1_000L

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    val themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    val eventDispatcher: EventDispatcher = mock {
      on { dispatchEvent(any()) } doAnswer
          { invocation ->
            val event = invocation.getArgument<Event<*>>(0)
            if (event is ReactTextInputKeyPressEvent) {
              reportedKeys.add(readKey(event))
            }
          }
    }
    view = ReactEditText(themedContext)
    view.setEventDispatcher(eventDispatcher)
    view.setOnKeyPress(true)
  }

  private fun readKey(event: ReactTextInputKeyPressEvent): String? {
    val emitter = mock<RCTModernEventEmitter>()
    val payload = argumentCaptor<WritableMap>()
    event.dispatchModern(emitter)
    verify(emitter).receiveEvent(any(), any(), any(), any(), any(), payload.capture(), any())
    return payload.firstValue.getString("key")
  }

  private fun keyEvent(
      action: Int,
      keyCode: Int,
      downTime: Long,
      metaState: Int = 0,
      flags: Int = 0,
  ): KeyEvent =
      KeyEvent(
          downTime,
          downTime,
          action,
          keyCode,
          0,
          metaState,
          KeyCharacterMap.VIRTUAL_KEYBOARD,
          0,
          flags,
          InputDevice.SOURCE_KEYBOARD,
      )

  private fun pressHardwareKey(keyCode: Int, metaState: Int = 0) {
    val downTime = nextDownTime++
    view.dispatchKeyEvent(keyEvent(KeyEvent.ACTION_DOWN, keyCode, downTime, metaState))
    view.dispatchKeyEvent(keyEvent(KeyEvent.ACTION_UP, keyCode, downTime, metaState))
  }

  private fun keyPressFromInputMethod(keyCode: Int, flags: Int): List<KeyEvent> {
    val downTime = nextDownTime++
    return listOf(
        keyEvent(KeyEvent.ACTION_DOWN, keyCode, downTime, flags = flags),
        keyEvent(KeyEvent.ACTION_UP, keyCode, downTime, flags = flags),
    )
  }

  // The input connection posts each event to the view's window, which hands the view a copy
  // without FLAG_FROM_SYSTEM once the input method's call has returned. A view outside a window
  // receives nothing, so the test hands it those copies.
  private fun sendFromInputMethod(inputConnection: InputConnection, events: List<KeyEvent>) {
    events.forEach { inputConnection.sendKeyEvent(it) }
    events.forEach {
      view.dispatchKeyEvent(KeyEvent.changeFlags(it, it.flags and KeyEvent.FLAG_FROM_SYSTEM.inv()))
    }
  }

  private fun openInputConnection(): InputConnection =
      checkNotNull(view.onCreateInputConnection(EditorInfo()))

  @Test
  fun hardwareNavigationKeysAreReportedByTheirWebKeyNames() {
    pressHardwareKey(KeyEvent.KEYCODE_DPAD_UP)
    pressHardwareKey(KeyEvent.KEYCODE_DPAD_DOWN)
    pressHardwareKey(KeyEvent.KEYCODE_DPAD_LEFT)
    pressHardwareKey(KeyEvent.KEYCODE_DPAD_RIGHT)
    pressHardwareKey(KeyEvent.KEYCODE_MOVE_HOME)
    pressHardwareKey(KeyEvent.KEYCODE_MOVE_END)
    pressHardwareKey(KeyEvent.KEYCODE_PAGE_UP)
    pressHardwareKey(KeyEvent.KEYCODE_PAGE_DOWN)
    pressHardwareKey(KeyEvent.KEYCODE_TAB)
    pressHardwareKey(KeyEvent.KEYCODE_ESCAPE)
    pressHardwareKey(KeyEvent.KEYCODE_FORWARD_DEL)

    assertThat(reportedKeys)
        .containsExactly(
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
            "PageUp",
            "PageDown",
            "Tab",
            "Escape",
            "Delete",
        )
  }

  @Test
  fun hardwareEnterAndBackspaceUseTheNamesTheSoftKeyboardReports() {
    pressHardwareKey(KeyEvent.KEYCODE_ENTER)
    pressHardwareKey(KeyEvent.KEYCODE_DEL)

    assertThat(reportedKeys).containsExactly("Enter", "Backspace")
  }

  @Test
  fun hardwareCharacterKeyIsReportedAsTheCharacterItTypes() {
    pressHardwareKey(KeyEvent.KEYCODE_A)
    pressHardwareKey(KeyEvent.KEYCODE_A, KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_LEFT_ON)
    pressHardwareKey(KeyEvent.KEYCODE_7)
    pressHardwareKey(KeyEvent.KEYCODE_SPACE)

    assertThat(reportedKeys).containsExactly("a", "A", "7", " ")
  }

  @Test
  fun keyThatTypesNoCharacterAndHasNoNameIsNotReported() {
    pressHardwareKey(KeyEvent.KEYCODE_SHIFT_LEFT)
    pressHardwareKey(KeyEvent.KEYCODE_Z, KeyEvent.META_CTRL_ON or KeyEvent.META_CTRL_LEFT_ON)

    assertThat(reportedKeys).isEmpty()
  }

  @Test
  fun backspaceTheInputMethodSendsIsReportedOnce() {
    sendFromInputMethod(
        openInputConnection(),
        keyPressFromInputMethod(
            KeyEvent.KEYCODE_DEL,
            KeyEvent.FLAG_SOFT_KEYBOARD or KeyEvent.FLAG_KEEP_TOUCH_MODE,
        ),
    )

    assertThat(reportedKeys).containsExactly("Backspace")
  }

  @Test
  fun hardwareKeyTheInputMethodForwardsIsReported() {
    sendFromInputMethod(
        openInputConnection(),
        keyPressFromInputMethod(KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.FLAG_FROM_SYSTEM),
    )

    assertThat(reportedKeys).containsExactly("ArrowLeft")
  }

  @Test
  fun keysTheInputMethodSendsTogetherAreReportedInTheOrderTheViewReceivesThem() {
    sendFromInputMethod(
        openInputConnection(),
        keyPressFromInputMethod(KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.FLAG_FROM_SYSTEM) +
            keyPressFromInputMethod(KeyEvent.KEYCODE_DEL, KeyEvent.FLAG_FROM_SYSTEM),
    )

    assertThat(reportedKeys).containsExactly("ArrowLeft", "Backspace")
  }

  @Test
  fun textTheInputMethodCommitsIsReportedByTheInputConnection() {
    openInputConnection().commitText("a", 1)

    assertThat(reportedKeys).containsExactly("a")
  }

  @Test
  fun noKeyIsReportedWithoutAnOnKeyPressListener() {
    view.setOnKeyPress(false)

    pressHardwareKey(KeyEvent.KEYCODE_DPAD_UP)
    pressHardwareKey(KeyEvent.KEYCODE_A)

    assertThat(reportedKeys).isEmpty()
  }
}
