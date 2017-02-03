package com.facebook.react;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

public class ReactFragment extends Fragment implements PermissionAwareActivity, DefaultHardwareBackBtnHandler {

  public final static int REQUEST_OVERLAY_CODE = 1111;
  private static final String REDBOX_PERMISSION_MESSAGE =
    "Overlay permissions need to be granted in order for react native apps to run in dev mode.";
  private static final String REDBOX_PERMISSION_GRANTED_MESSAGE =
    "Overlay permissions have been granted.";

  protected static final String ARG_COMPONENT_NAME = "arg_component_name";
  protected static final String ARG_LAUNCH_OPTIONS = "arg_launch_options";

  private String mComponentName;
  private Bundle mLaunchOptions;

  private ReactRootView mReactRootView;

  @Nullable
  private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;

  @Nullable
  private PermissionListener mPermissionListener;


  public ReactFragment() {
    // Required empty public constructor
  }

  /**
   * @param componentName The name of the react native component
   * @return A new instance of fragment ReactFragment.
   */
  private static ReactFragment newInstance(@NonNull String componentName, Bundle launchOptions) {
    ReactFragment fragment = new ReactFragment();
    Bundle args = new Bundle();
    args.putString(ARG_COMPONENT_NAME, componentName);
    args.putBundle(ARG_LAUNCH_OPTIONS, launchOptions);
    fragment.setArguments(args);
    return fragment;
  }

  // region Lifecycle
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (getArguments() != null) {
      mComponentName = getArguments().getString(ARG_COMPONENT_NAME);
      mLaunchOptions = getArguments().getBundle(ARG_LAUNCH_OPTIONS);
    }
    if (mComponentName == null) {
      throw new IllegalStateException("Cannot loadApp if component name is null");
    }
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
  }

  @Override
  public View onCreateView(LayoutInflater inflater, ViewGroup container,
                           Bundle savedInstanceState) {
    boolean needToEnableDevMenu = false;
    if (getReactNativeHost().getUseDeveloperSupport() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show redbox in dev builds.
      if (!Settings.canDrawOverlays(getContext())) {
        needToEnableDevMenu = true;
        Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        FLog.w(ReactConstants.TAG, REDBOX_PERMISSION_MESSAGE);
        Toast.makeText(getContext(), REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
        startActivityForResult(serviceIntent, REQUEST_OVERLAY_CODE);
      }
    }
    mReactRootView = createRootView();
    if (!needToEnableDevMenu) {
      mReactRootView.startReactApplication(
        getReactNativeHost().getReactInstanceManager(),
        mComponentName,
        mLaunchOptions);
    }
    return mReactRootView;
  }

  @Override
  public void onResume() {
    super.onResume();
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostResume(getActivity(), this);
    }
  }

  @Override
  public void onPause() {
    super.onPause();
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostPause(getActivity());
    }
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
      mReactRootView = null;
    }
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostDestroy(getActivity());
    }
  }
  // endregion

  /**
   * This currently only checks to see if we've enabled the permission to draw over other apps.
   * This is only used in debug/developer mode and is otherwise not used.
   *
   * @param requestCode Code that requested the activity
   * @param resultCode  Code which describes the result
   * @param data        Any data passed from the activity
   */
  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode == REQUEST_OVERLAY_CODE) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (Settings.canDrawOverlays(getContext())) {
          mReactRootView.startReactApplication(
            getReactNativeHost().getReactInstanceManager(),
            mComponentName,
            mLaunchOptions);
          Toast.makeText(getContext(), REDBOX_PERMISSION_GRANTED_MESSAGE, Toast.LENGTH_LONG).show();
        }
      }
    }
  }

  /**
   * Helper to forward hardware back presses to our React Native Host
   *
   * This must be called via a forward from your host Activity
   *
   */
  public void onBackPressed() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onBackPressed();
    }
  }

  /**
   * Helper to forward onKeyUp commands from our host Activity.
   * This allows ReactFragment to handle double tap reloads and dev menus
   *
   * This must be called via a foward from your host Activity
   *
   * @param keyCode keyCode
   * @param event   event
   * @return true if we handled onKeyUp
   */
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    boolean handled = false;
    // TODO: Update once https://github.com/facebook/react-native/pull/11329 is merged (Right now using a fork)
    if (getReactNativeHost().getUseDeveloperSupport() && getReactNativeHost().hasInstance()) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
        handled = true;
      }
      boolean didDoubleTapR = Assertions.assertNotNull(mDoubleTapReloadRecognizer).didDoubleTapR(keyCode, getActivity().getCurrentFocus());
      if (didDoubleTapR) {
        getReactNativeHost().getReactInstanceManager().getDevSupportManager().handleReloadJS();
        handled = true;
      }
    }
    return handled;
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (mPermissionListener != null &&
      mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
      mPermissionListener = null;
    }
  }

  @Override
  public int checkPermission(String permission, int pid, int uid) {
    return getActivity().checkPermission(permission, pid, uid);
  }

  @TargetApi(Build.VERSION_CODES.M)
  @Override
  public int checkSelfPermission(String permission) {
    return getActivity().checkSelfPermission(permission);
  }

  @TargetApi(Build.VERSION_CODES.M)
  @Override
  public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
    mPermissionListener = listener;
    requestPermissions(permissions, requestCode);
  }

  /**
   * {@link #invokeDefaultOnBackPressed()} will get called if our JS React app doesn't consume
   * the event itself. Once this gets called we then call our Activity's method.
   * {@link Activity#onBackPressed()}. If you want to do something else when this is called
   * extend this class and override this method.
   */
  @Override
  public void invokeDefaultOnBackPressed() {
    getActivity().onBackPressed();
  }

  private ReactRootView createRootView() {
    return new ReactRootView(getContext());
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes
   * {@link Activity#getApplication()} is an instance of {@link ReactApplication} and calls
   * {@link ReactApplication#getReactNativeHost()}. Override this method if your application class
   * does not implement {@code ReactApplication} or you simply have a different mechanism for
   * storing a {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getActivity().getApplication()).getReactNativeHost();
  }

  /**
   * Builder class to help instantiate a ReactFragment
   */
  public static class Builder {

    String mComponentName;
    Bundle mLaunchOptions;

    public Builder() {
      mComponentName = null;
      mLaunchOptions = null;
    }

    /**
     * Set the Component name for our React Native instance.
     *
     * @param componentName The name of the component
     * @return Builder
     */
    public Builder setComponentName(String componentName) {
      mComponentName = componentName;
      return this;
    }

    /**
     * Set the Launch Options for our React Native instance.
     *
     * @param launchOptions launchOptions
     * @return Builder
     */
    public Builder setLaunchOptions(Bundle launchOptions) {
      mLaunchOptions = launchOptions;
      return this;
    }

    public ReactFragment build() {
      return ReactFragment.newInstance(mComponentName, mLaunchOptions);
    }

  }
}
