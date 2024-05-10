/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shell;

import android.annotation.SuppressLint;
import androidx.annotation.Nullable;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.ViewManagerOnDemandReactPackage;
import com.facebook.react.animated.NativeAnimatedModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.ClassFinder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.accessibilityinfo.AccessibilityInfoModule;
import com.facebook.react.modules.appearance.AppearanceModule;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.blob.BlobModule;
import com.facebook.react.modules.blob.FileReaderModule;
import com.facebook.react.modules.camera.ImageStoreManager;
import com.facebook.react.modules.clipboard.ClipboardModule;
import com.facebook.react.modules.devloading.DevLoadingModule;
import com.facebook.react.modules.devtoolssettings.DevToolsSettingsManagerModule;
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
import com.facebook.react.modules.toast.ToastModule;
import com.facebook.react.modules.vibration.VibrationModule;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.drawer.ReactDrawerLayoutManager;
import com.facebook.react.views.image.ReactImageManager;
import com.facebook.react.views.modal.ReactModalHostManager;
import com.facebook.react.views.progressbar.ReactProgressBarViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollContainerViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager;
import com.facebook.react.views.scroll.ReactScrollViewManager;
import com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager;
import com.facebook.react.views.switchview.ReactSwitchManager;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.text.ReactVirtualTextViewManager;
import com.facebook.react.views.text.frescosupport.FrescoBasedReactTextInlineImageViewManager;
import com.facebook.react.views.textinput.ReactTextInputManager;
import com.facebook.react.views.unimplementedview.ReactUnimplementedViewManager;
import com.facebook.react.views.view.ReactViewManager;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.inject.Provider;

/** Package defining basic modules and view managers. */
@ReactModuleList(
    nativeModules = {
      AccessibilityInfoModule.class,
      AppearanceModule.class,
      AppStateModule.class,
      BlobModule.class,
      DevLoadingModule.class,
      FileReaderModule.class,
      ClipboardModule.class,
      DialogModule.class,
      FrescoModule.class,
      I18nManagerModule.class,
      ImageLoaderModule.class,
      ImageStoreManager.class,
      IntentModule.class,
      NativeAnimatedModule.class,
      NetworkingModule.class,
      PermissionsModule.class,
      ShareModule.class,
      SoundManagerModule.class,
      StatusBarModule.class,
      ToastModule.class,
      VibrationModule.class,
      WebSocketModule.class,
    })
public class MainReactPackage extends TurboReactPackage implements ViewManagerOnDemandReactPackage {

  private MainPackageConfig mConfig;
  private @Nullable Map<String, ModuleSpec> mViewManagers;

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
      case DevLoadingModule.NAME:
        return new DevLoadingModule(context);
      case FileReaderModule.NAME:
        return new FileReaderModule(context);
      case ClipboardModule.NAME:
        return new ClipboardModule(context);
      case DialogModule.NAME:
        return new DialogModule(context);
      case FrescoModule.NAME:
        return new FrescoModule(context, true, mConfig != null ? mConfig.getFrescoConfig() : null);
      case I18nManagerModule.NAME:
        return new I18nManagerModule(context);
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
      case ToastModule.NAME:
        return new ToastModule(context);
      case VibrationModule.NAME:
        return new VibrationModule(context);
      case WebSocketModule.NAME:
        return new WebSocketModule(context);
      case DevToolsSettingsManagerModule.NAME:
        return new DevToolsSettingsManagerModule(context);
      default:
        return null;
    }
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>();

    viewManagers.add(new ReactDrawerLayoutManager());
    viewManagers.add(new ReactHorizontalScrollViewManager());
    viewManagers.add(new ReactHorizontalScrollContainerViewManager());
    viewManagers.add(new ReactProgressBarViewManager());
    viewManagers.add(new ReactScrollViewManager());
    viewManagers.add(new ReactSwitchManager());
    viewManagers.add(new SwipeRefreshLayoutManager());

    // Native equivalents
    viewManagers.add(new FrescoBasedReactTextInlineImageViewManager());
    viewManagers.add(new ReactImageManager());
    viewManagers.add(new ReactModalHostManager());
    viewManagers.add(new ReactRawTextManager());
    viewManagers.add(new ReactTextInputManager());
    viewManagers.add(new ReactTextViewManager());
    viewManagers.add(new ReactViewManager());
    viewManagers.add(new ReactVirtualTextViewManager());

    viewManagers.add(new ReactUnimplementedViewManager());

    return viewManagers;
  }

  private static void appendMap(
      Map<String, ModuleSpec> map, String name, Provider<? extends NativeModule> provider) {
    map.put(name, ModuleSpec.viewManagerSpec(provider));
  }

  /**
   * @return a map of view managers that should be registered with {@link UIManagerModule}
   */
  @SuppressLint("VisibleForTests")
  public Map<String, ModuleSpec> getViewManagersMap() {
    if (mViewManagers == null) {
      Map<String, ModuleSpec> viewManagers = new HashMap<>();
      appendMap(viewManagers, ReactDrawerLayoutManager.REACT_CLASS, ReactDrawerLayoutManager::new);
      appendMap(
          viewManagers,
          ReactHorizontalScrollViewManager.REACT_CLASS,
          ReactHorizontalScrollViewManager::new);
      appendMap(
          viewManagers,
          ReactHorizontalScrollContainerViewManager.REACT_CLASS,
          ReactHorizontalScrollContainerViewManager::new);
      appendMap(
          viewManagers, ReactProgressBarViewManager.REACT_CLASS, ReactProgressBarViewManager::new);
      appendMap(viewManagers, ReactScrollViewManager.REACT_CLASS, ReactScrollViewManager::new);
      appendMap(viewManagers, ReactSwitchManager.REACT_CLASS, ReactSwitchManager::new);
      appendMap(
          viewManagers, SwipeRefreshLayoutManager.REACT_CLASS, SwipeRefreshLayoutManager::new);
      appendMap(
          viewManagers,
          FrescoBasedReactTextInlineImageViewManager.REACT_CLASS,
          FrescoBasedReactTextInlineImageViewManager::new);
      appendMap(viewManagers, ReactImageManager.REACT_CLASS, ReactImageManager::new);
      appendMap(viewManagers, ReactModalHostManager.REACT_CLASS, ReactModalHostManager::new);
      appendMap(viewManagers, ReactRawTextManager.REACT_CLASS, ReactRawTextManager::new);
      appendMap(viewManagers, ReactTextInputManager.REACT_CLASS, ReactTextInputManager::new);
      appendMap(viewManagers, ReactTextViewManager.REACT_CLASS, ReactTextViewManager::new);
      appendMap(viewManagers, ReactViewManager.REACT_CLASS, ReactViewManager::new);
      appendMap(
          viewManagers, ReactVirtualTextViewManager.REACT_CLASS, ReactVirtualTextViewManager::new);
      appendMap(
          viewManagers,
          ReactUnimplementedViewManager.REACT_CLASS,
          ReactUnimplementedViewManager::new);
      mViewManagers = viewManagers;
    }
    return mViewManagers;
  }

  @Override
  public List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>(getViewManagersMap().values());
  }

  @Override
  public Collection<String> getViewManagerNames(ReactApplicationContext reactContext) {
    return getViewManagersMap().keySet();
  }

  @Override
  public @Nullable ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName) {
    ModuleSpec spec = getViewManagersMap().get(viewManagerName);
    return spec != null ? (ViewManager) spec.getProvider().get() : null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass();
    }
    try {
      Class<?> reactModuleInfoProviderClass =
          ClassFinder.findClass(
              "com.facebook.react.shell.MainReactPackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      return fallbackForMissingClass();
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for"
              + " com.facebook.react.shell.MainReactPackage$$ReactModuleInfoProvider",
          e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for"
              + " com.facebook.react.shell.MainReactPackage$$ReactModuleInfoProvider",
          e);
    }
  }

  private ReactModuleInfoProvider fallbackForMissingClass() {
    // In the OSS case, the annotation processor does not run.
    // We fall back to creating this by hand
    Class<? extends NativeModule>[] moduleList =
        new Class[] {
          AccessibilityInfoModule.class,
          AppearanceModule.class,
          AppStateModule.class,
          BlobModule.class,
          DevLoadingModule.class,
          FileReaderModule.class,
          ClipboardModule.class,
          DialogModule.class,
          FrescoModule.class,
          I18nManagerModule.class,
          ImageLoaderModule.class,
          ImageStoreManager.class,
          IntentModule.class,
          NativeAnimatedModule.class,
          NetworkingModule.class,
          PermissionsModule.class,
          DevToolsSettingsManagerModule.class,
          ShareModule.class,
          StatusBarModule.class,
          SoundManagerModule.class,
          ToastModule.class,
          VibrationModule.class,
          WebSocketModule.class
        };

    final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
    for (Class<? extends NativeModule> moduleClass : moduleList) {
      ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);
      if (reactModule != null) {
        reactModuleInfoMap.put(
            reactModule.name(),
            new ReactModuleInfo(
                reactModule.name(),
                moduleClass.getName(),
                reactModule.canOverrideExistingModule(),
                reactModule.needsEagerInit(),
                reactModule.isCxxModule(),
                ReactModuleInfo.classIsTurboModule(moduleClass)));
      }
    }
    return () -> reactModuleInfoMap;
  }
}
