package com.facebook.react.views.modal;

import android.app.Dialog;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

public class ModalHostFragment extends DialogFragment {

    private Dialog mDialog;

    ModalHostFragment(Dialog dialog) {
        mDialog = dialog;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        return mDialog;
    }
}
