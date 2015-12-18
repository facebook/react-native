package com.facebook.react;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.view.KeyEvent;
import android.widget.EditText;
import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.shell.MainReactPackage;

import java.util.List;

import javax.annotation.Nullable;

/**
 * Base Activity for React Native applications.
 */
public abstract class ReactActivity extends Activity implements DefaultHardwareBackBtnHandler {

  private static final String REDBOX_PERMISSION_MESSAGE =
      "Overlay permissions needs to be granted in order for react native apps to run in dev mode";

  private @Nullable ReactInstanceManager mReactInstanceManager;
  private LifecycleState mLifecycleState = LifecycleState.BEFORE_RESUME;
  private boolean mDoRefresh = false;

  /**
   * @return the name of the bundle in assets. If this is null, and no file path is specified for
   * the bundle, the app will only work with `getUseDeveloperSupport` enabled and will always try
   * to load the JS bundle from the packager server.
   * e.g. "index.android.bundle"
   */
  protected @Nullable String getBundleAssetName() {
    return "index.android.bundle";
  };

  /**
   * @return the path of the bundle file. This is used in cases the bundle should be loaded from
   * a custom path
   * e.g. "file://sdcard/myapp_cache/index.android.bundle"
   */
  protected @Nullable String getJSBundleFile() {
    return null;
  }

  /**
   * @return the name of the main module. This is used to determine the URL to fetch the JS bundle
   * from the packager server and is only used when dev support is enabled.
   * This is the first file to be executed once the {@code ReactInstanceManager} is created.
   * e.g. "Movies/MoviesApp.android"
   */
  protected String getJSMainModuleName() {
    return "index.android";
  }

  /**
   * @return the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component
   * e.g. "MoviesApp"
   */
  protected abstract String getMainComponentName();

  /**
   * @return if debug mode should be enabled
   */
  protected abstract boolean getUseDeveloperSupport();

  /**
   * Method returns a list of {@link ReactPackage} associated with this class.
   * A subclass may override this method if it needs more views or modules.
   * In that case a subclass should return a list of the ReactPackages
   */
  protected @Nullable List<ReactPackage> getAdditionalPackages() {
    return null;
  };

  /**
   * @return a ReactInstanceManager
   * A subclass may override this method if it needs to use a custom instance
   */
  protected ReactInstanceManager getReactInstanceManager() {
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
        .setApplication(getApplication())
        .setJSMainModuleName(getJSMainModuleName())
        .addPackage(new MainReactPackage())
        .setUseDeveloperSupport(getUseDeveloperSupport())
        .setInitialLifecycleState(mLifecycleState);

    String jsBundleFile = getJSBundleFile();

    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile);
    } else {
      builder.setBundleAssetName(getBundleAssetName());
    }

    List<ReactPackage> additionalPackages = getAdditionalPackages();

    if (additionalPackages != null) {
      for (ReactPackage reactPackage : additionalPackages) {
        builder.addPackage(reactPackage);
      }
    }

    return builder.build();
  }

  /**
   * @return a ReactRootView
   * A subclass may override this method if it needs to use a custom ReactRootView
   */
  protected ReactRootView getReactRootView() {
    return new ReactRootView(this);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (getUseDeveloperSupport() && Build.VERSION.SDK_INT >= 23) {
      // Get permission to show redbox in dev builds.
      if (!Settings.canDrawOverlays(this)) {
        Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        startActivity(serviceIntent);
        FLog.w(ReactConstants.TAG, REDBOX_PERMISSION_MESSAGE);
        Toast.makeText(this, REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
      }
    }

    mReactInstanceManager = getReactInstanceManager();
    ReactRootView mReactRootView = getReactRootView();
    mReactRootView.startReactApplication(mReactInstanceManager, getMainComponentName());
    setContentView(mReactRootView);
  }

  @Override
  protected void onPause() {
    super.onPause();

    mLifecycleState = LifecycleState.BEFORE_RESUME;

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onPause();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    mLifecycleState = LifecycleState.RESUMED;

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onDestroy();
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onActivityResult(requestCode, resultCode, data);
    }
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (mReactInstanceManager != null &&
        mReactInstanceManager.getDevSupportManager().getDevSupportEnabled()) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        mReactInstanceManager.showDevOptionsDialog();
        return true;
      }
      if (keyCode == KeyEvent.KEYCODE_R && !(getCurrentFocus() instanceof EditText)) {
        // Enable double-tap-R-to-reload
        if (mDoRefresh) {
          mReactInstanceManager.getDevSupportManager().handleReloadJS();
          mDoRefresh = false;
        } else {
          mDoRefresh = true;
          new Handler().postDelayed(
              new Runnable() {
                @Override
                public void run() {
                  mDoRefresh = false;
                }
              },
              200);
        }
      }
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onBackPressed();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }
}
