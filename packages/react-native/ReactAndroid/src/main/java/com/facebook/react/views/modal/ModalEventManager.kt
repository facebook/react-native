package com.facebook.react.views.modal;

import android.content.DialogInterface

public object ModalEventManager {
  private val listeners: MutableList<ModalCallback> = mutableListOf()

  public fun addModalListener(listener: ModalCallback) {
    listeners.add(listener)
  }

  public fun onModalOpen(dialog: DialogInterface?, viewTag: Int) {
    for (listener in listeners) {
        listener.onModalOpen(dialog, viewTag)
    }
  }

  public fun onModalRequestClose(dialog: DialogInterface?, viewTag: Int) {
    for (listener in listeners) {
      listener.onModalRequestClose(dialog, viewTag)
    }
  }

  public fun removeAllListeners() { listeners.clear() }
}
