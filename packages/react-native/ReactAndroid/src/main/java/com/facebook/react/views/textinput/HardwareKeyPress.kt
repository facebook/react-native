/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.view.KeyEvent

/**
 * Names a hardware key press the way `onKeyPress` names the keys a soft keyboard types: the key's
 * `KeyboardEvent.key` value on the web for a key that types no character, and the character
 * otherwise.
 */
internal object HardwareKeyPress {

  private val namedKeys: Map<Int, String> =
      mapOf(
          KeyEvent.KEYCODE_DEL to ReactEditTextInputConnectionWrapper.BACKSPACE_KEY_VALUE,
          KeyEvent.KEYCODE_ENTER to ReactEditTextInputConnectionWrapper.ENTER_KEY_VALUE,
          KeyEvent.KEYCODE_NUMPAD_ENTER to ReactEditTextInputConnectionWrapper.ENTER_KEY_VALUE,
          KeyEvent.KEYCODE_FORWARD_DEL to "Delete",
          KeyEvent.KEYCODE_TAB to "Tab",
          KeyEvent.KEYCODE_ESCAPE to "Escape",
          KeyEvent.KEYCODE_DPAD_UP to "ArrowUp",
          KeyEvent.KEYCODE_DPAD_DOWN to "ArrowDown",
          KeyEvent.KEYCODE_DPAD_LEFT to "ArrowLeft",
          KeyEvent.KEYCODE_DPAD_RIGHT to "ArrowRight",
          KeyEvent.KEYCODE_MOVE_HOME to "Home",
          KeyEvent.KEYCODE_MOVE_END to "End",
          KeyEvent.KEYCODE_PAGE_UP to "PageUp",
          KeyEvent.KEYCODE_PAGE_DOWN to "PageDown",
          KeyEvent.KEYCODE_INSERT to "Insert",
      )

  /**
   * The key to report for [event], or `null` for a key with no name that types no character — a
   * modifier on its own, or a chord such as Ctrl+Z.
   */
  fun keyName(event: KeyEvent): String? {
    namedKeys[event.keyCode]?.let {
      return it
    }
    if (event.isCtrlPressed || event.isMetaPressed) {
      return null
    }
    // A dead key sets KeyCharacterMap.COMBINING_ACCENT, the sign bit, so it never reads positive.
    val character = event.unicodeChar
    return if (character > 0 && !Character.isISOControl(character)) {
      String(Character.toChars(character))
    } else {
      null
    }
  }
}
