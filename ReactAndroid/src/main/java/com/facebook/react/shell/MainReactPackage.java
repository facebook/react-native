/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shell;

import androidx.annotation.Nullable;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.animated.NativeAnimatedModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.accessibilityinfo.AccessibilityInfoModule;
import com.facebook.react.modules.appearance.AppearanceModule;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.blob.BlobModule;
import com.facebook.react.modules.blob.FileReaderModule;
import com.facebook.react.modules.camera.CameraRollManager;
import com.facebook.react.modules.camera.ImageEditingManager;
import com.facebook.react.modules.camera.ImageStoreManager;
import com.facebook.react.modules.clipboard.ClipboardModule;
import com.facebook.react.modules.datepicker.DatePickerDialogModule;
import com.facebook.react.modules.dialog.DialogModule;
import com.facebook.react.modules.fresco.FrescoModule;
import com.facebook.react.modules.i18nmanager.I18nManagerModule;
import com.facebook.react.modules.image.ImageLoaderModule;
import com.facebook.react.modules.intent.IntentModule;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.permissions.PermissionsModule;
import com.facebook.react.modules.share.ShareModule;
import com.facebook.react.modules.sound.SoundManagerModule;
import com.facebook.react.modules.statusbar.StatusBarModule;
import com.facebook.react.modules.storage.AsyncStorageModule;
import com.facebook.react.modules.timepicker.TimePickerDialogModule;
import com.facebook.react.modules.toast.ToastModule;
import com.facebook.react.modules.vibration.VibrationModule;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.art.ARTRenderableViewManager;
import com.facebook.react.views.art.ARTSurfaceViewManager;
import com.facebook.react.views.checkbox.ReactCheckBoxManager;
import com.facebook.react.views.drawer.ReactDrawerLayoutManager;
import com.facebook.react.views.image.ReactImageManager;
import com.facebook.react.views.modal.ReactModalHostManager;
import com.facebook.react.views.picker.ReactDialogPickerManager;
import com.facebook.react.views.picker.ReactDropdownPickerManager;
import com.facebook.react.views.progressbar.ReactProgressBarViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollContainerViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager;
import com.facebook.react.views.scroll.ReactScrollViewManager;
import com.facebook.react.views.slider.ReactSliderManager;
import com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager;
import com.facebook.react.views.switchview.ReactSwitchManager;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.text.ReactVirtualTextViewManager;
import com.facebook.react.views.text.frescosupport.FrescoBasedReactTextInlineImageViewManager;
import com.facebook.react.views.textinput.ReactTextInputManager;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.react.views.viewpager.ReactViewPagerManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Package defining basic modules and view managers. */
@ReactModuleList(
    nativeModules = {
      AccessibilityInfoModule.class,
      AppearanceModule.class,
      AppStateModule.class,
      BlobModule.class,
      FileReaderModule.class,
      AsyncStorageModule.class,
      CameraRollManager.class,
      ClipboardModule.class,
      DatePickerDialogModule.class,
      DialogModule.class,
      FrescoModule.class,
      I18nManagerModule.class,
      ImageEditingManager.class,
      ImageLoaderModule.class,
      ImageStoreManager.class,
      IntentModule.class,
      NativeAnimatedModule.class,
      NetworkingModule.class,
      PermissionsModule.class,
      ShareModule.class,
      SoundManagerModule.class,
      StatusBarModule.class,
      TimePickerDialogModule.class,
      ToastModule.class,
      VibrationModule.class,
      WebSocketModule.class,
    })
public class MainReactPackage extends TurboReactPackage {

  private MainPackageConfig mConfig;

  public MainReactPackage() {}

  /** Create a new package with configuration */
  public MainReactPackage(MainPackageConfig config) {
    mConfig = config;
  }

  @Override
  public @Nullable NativeModule getModule(String name, ReactApplicationContext context) {
    switch (name) {
      case AccessibilityInfoModule.NAME:
        return new AccessibilityInfoModule(context);
      case AppearanceModule.NAME:
        return new AppearanceModule(context);
      case AppStateModule.NAME:
        return new AppStateModule(context);
      case BlobModule.NAME:
        return new BlobModule(context);
      case FileReaderModule.NAME:
        return new FileReaderModule(context);
      case AsyncStorageModule.NAME:
        return new AsyncStorageModule(context);
      case CameraRollManager.NAME:
        return new CameraRollManager(context);
      case ClipboardModule.NAME:
        return new ClipboardModule(context);
      case DatePickerDialogModule.FRAGMENT_TAG:
        return new DatePickerDialogModule(context);
      case DialogModule.NAME:
        return new DialogModule(context);
      case FrescoModule.NAME:
        return new FrescoModule(context, true, mConfig != null ? mConfig.getFrescoConfig() : null);
      case I18nManagerModule.NAME:
        return new I18nManagerModule(context);
      case ImageEditingManager.NAME:
        return new ImageEditingManager(context);
      case ImageLoaderModule.NAME:
        return new ImageLoaderModule(context);
      case ImageStoreManager.NAME:
        return new ImageStoreManager(context);
      case IntentModule.NAME:
        return new IntentModule(context);
      case NativeAnimatedModule.NAME:
        return new NativeAnimatedModule(context);
      case NetworkingModule.NAME:
        return new NetworkingModule(context);
      case PermissionsModule.NAME:
        return new PermissionsModule(context);
      case ShareModule.NAME:
        return new ShareModule(context);
      case StatusBarModule.NAME:
        return new StatusBarModule(context);
      case SoundManagerModule.NAME:
        return new SoundManagerModule(context);
      case TimePickerDialogModule.FRAGMENT_TAG:
        return new TimePickerDialogModule(context);
      case ToastModule.NAME:
        return new ToastModule(context);
      case VibrationModule.NAME:
        return new VibrationModule(context);
      case WebSocketModule.NAME:
        return new WebSocketModule(context);
      default:
        return null;
    }
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>();

    viewManagers.add(ARTRenderableViewManager.createARTGroupViewManager());
    viewManagers.add(ARTRenderableViewManager.createARTShapeViewManager());
    viewManagers.add(ARTRenderableViewManager.createARTTextViewManager());
    viewManagers.add(new ReactCheckBoxManager());
    viewManagers.add(new ReactDialogPickerManager());
    viewManagers.add(new ReactDrawerLayoutManager());
    viewManagers.add(new ReactDropdownPickerManager());
    viewManagers.add(new ReactHorizontalScrollViewManager());
    viewManagers.add(new ReactHorizontalScrollContainerViewManager());
    viewManagers.add(new ReactProgressBarViewManager());
    viewManagers.add(new ReactScrollViewManager());
    viewManagers.add(new ReactSliderManager());
    viewManagers.add(new ReactSwitchManager());
    viewManagers.add(new SwipeRefreshLayoutManager());

    // Native equivalents
    viewManagers.add(new ARTSurfaceViewManager());
    viewManagers.add(new FrescoBasedReactTextInlineImageViewManager());
    viewManagers.add(new ReactImageManager());
    viewManagers.add(new ReactModalHostManager());
    viewManagers.add(new ReactRawTextManager());
    viewManagers.add(new ReactTextInputManager());
    viewManagers.add(new ReactTextViewManager());
    viewManagers.add(new ReactViewManager());
    viewManagers.add(new ReactViewPagerManager());
    viewManagers.add(new ReactVirtualTextViewManager());

    return viewManagers;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    try {
      Class<?> reactModuleInfoProviderClass =
          Class.forName("com.facebook.react.MainReactPackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      // In OSS case, the annotation processor does not run. We fall back on creating this byhand
      Class<? extends NativeModule>[] moduleList =
          new Class[] {
            AccessibilityInfoModule.class,
            AppearanceModule.class,
            AppStateModule.class,
            BlobModule.class,
            FileReaderModule.class,
            AsyncStorageModule.class,
            CameraRollManager.class,
            ClipboardModule.class,
            DatePickerDialogModule.class,
            DialogModule.class,
            FrescoModule.class,
            I18nManagerModule.class,
            ImageEditingManager.class,
            ImageLoaderModule.class,
            ImageStoreManager.class,
            IntentModule.class,
            NativeAnimatedModule.class,
            NetworkingModule.class,
            PermissionsModule.class,
            ShareModule.class,
            StatusBarModule.class,
            SoundManagerModule.class,
            TimePickerDialogModule.class,
            ToastModule.class,
            VibrationModule.class,
            WebSocketModule.class
          };

      final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
      for (Class<? extends NativeModule> moduleClass : moduleList) {
        ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

        reactModuleInfoMap.put(
            reactModule.name(),
            new ReactModuleInfo(
                reactModule.name(),
                moduleClass.getName(),
                reactModule.canOverrideExistingModule(),
                reactModule.needsEagerInit(),
                reactModule.hasConstants(),
                reactModule.isCxxModule(),
                false));
      }

      return new ReactModuleInfoProvider() {
        @Override
        public Map<String, ReactModuleInfo> getReactModuleInfos() {
          return reactModuleInfoMap;
        }
      };
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    }
  }
}
