package com.facebook.react.views.modal;

import android.content.DialogInterface;

public interface ModalCallback {
  public fun onModalOpen(dialog: DialogInterface?, viewTag: Int)
  public fun onModalRequestClose(dialog: DialogInterface?, viewTag: Int)
}
