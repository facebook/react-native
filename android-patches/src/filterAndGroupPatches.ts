import fse from 'fs-extra';
import path from 'path';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'verbose',
  defaultMeta: {service: 'user-service'},
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: 'filter_group_error.log',
      level: 'error',
      dirname: 'logs',
    }),
    new winston.transports.File({
      filename: 'filter_group_combined.log',
      dirname: 'logs',
    }),
  ],
});

const rawPatchStore = 'E:\\github\\office-android-patches\\patches';

const filteredGroupedPatchStore =
  'E:\\github\\office-android-patches\\patches-droid-office-grouped';

if (fse.existsSync(filteredGroupedPatchStore)) {
  logger.error('Output directory exists !');
  process.exit();
}

fse.ensureDirSync(filteredGroupedPatchStore);

// Known groups
const OfficeRNHostDir = 'OfficeRNHost';
const V8IntegrationDir = 'V8Integration';
const AccessibilityDir = 'Accessibility';
const UIScollChangesDir = 'UIScroll';
const UITextFontChangesDir = 'UITextFont';
const UIEditTextChangesDir = 'UIEditText';
const DialogModuleDir = 'DialogModule';
const AnnotationProcessingDir = 'AnnotationProcessing';
const BuildAndThirdPartyFixesDir = 'BuildAndThirdPartyFixes';
const SecurityFixesDir = 'SecurityFixes';

const processFile = (
  patchFileRelativePath: string,
  groupName: string,
): void => {
  const patchFileName = path.basename(patchFileRelativePath);

  // Source path.
  const patchFileSourceAbsPath = path.resolve(
    rawPatchStore,
    patchFileRelativePath,
  );

  // Create destination path.
  const patchFileRelativeDir = path.parse(patchFileRelativePath).dir;
  const groupDir = path.resolve(filteredGroupedPatchStore, groupName);
  const patchFileAbsDir = path.resolve(groupDir, patchFileRelativeDir);
  fse.ensureDirSync(patchFileAbsDir);
  const patchFileDestAbsPath = path.resolve(patchFileAbsDir, patchFileName);

  fse.copyFileSync(patchFileSourceAbsPath, patchFileDestAbsPath);
};

// Annotation Processing
processFile('settings.gradle.kts', AnnotationProcessingDir);
processFile('processor\\build.gradle', AnnotationProcessingDir);
processFile(
  'processor\\libs\\infer-annotations-1.5.jar',
  AnnotationProcessingDir,
);
processFile(
  'processor\\src\\main\\resources\\META-INF\\services\\javax.annotation.processing.Processor',
  AnnotationProcessingDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\processing\\ReactNativeModuleProcessor.java',
  AnnotationProcessingDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\AcJavaModuleWrapper.java',
  AnnotationProcessingDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\JavaModuleWrapper.java',
  AnnotationProcessingDir,
);

//OfficeRNHost
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstanceImpl.java',
  OfficeRNHostDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\DynamicFromObject.java',
//   OfficeRNHostDir,
// );
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\NativeModuleRegistry.java',
//   OfficeRNHostDir,
// );
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactBridge.java',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java',
  OfficeRNHostDir,
);
processFile('ReactCommon\\cxxreact\\CxxNativeModule.cpp', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\CxxNativeModule.h', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\Instance.cpp', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\Instance.h', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\JSExecutor.h', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\NativeToJsBridge.cpp', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\NativeToJsBridge.h', OfficeRNHostDir);
processFile('ReactCommon\\cxxreact\\PlatformBundleInfo.h', OfficeRNHostDir);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\JMessageQueueThread.cpp',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.h',
  OfficeRNHostDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\JSLogging.h',
  OfficeRNHostDir,
);

// DialogModule
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\datepicker\\DatePickerDialogModule.java',
  DialogModuleDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\DialogModule.java',
  DialogModuleDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\PlatformAlertFragment.java',
  DialogModuleDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\timepicker\\TimePickerDialogModule.java',
  DialogModuleDir,
);

// UIScroll
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactHorizontalScrollView.java',
  UIScollChangesDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactScrollView.java',
  UIScollChangesDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactScrollViewManager.java',
  UIScollChangesDir,
);

// UITextFont
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\text\\ReactFontManager.java',
  UITextFontChangesDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\text\\ReactTextShadowNode.java',
//   UITextFontChangesDir,
// );
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\text\\ReactTextView.java',
//   UITextFontChangesDir,
// );

//UIEditTextChanges
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactEditText.java',
  UIEditTextChangesDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactTextInputManager.java',
  UIEditTextChangesDir,
);
processFile(
  'Libraries\\Components\\TextInput\\TextInput.js',
  UIEditTextChangesDir,
);
processFile(
  'Libraries\\Components\\TextInput\\TextInputState.js',
  UIEditTextChangesDir,
);

// Accessibility
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\view\\ReactViewManager.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\BaseViewManager.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\NativeViewHierarchyManager.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIImplementation.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIManagerModule.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIViewOperationQueue.java',
  AccessibilityDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\ViewManager.java',
//   AccessibilityDir,
// );
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\ViewManagerRegistry.java',
  AccessibilityDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\view\\ReactViewFocusEvent.java',
  AccessibilityDir,
);

// V8Integration
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\Android.mk',
  V8IntegrationDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\BUCK',
//   V8IntegrationDir,
// );
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.cpp',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.h',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\OnLoad.cpp',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8Executor.java',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.cpp',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.h',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.java',
  V8IntegrationDir,
);
processFile('ReactCommon\\jsi\\Android.mk', V8IntegrationDir);
processFile('ReactCommon\\jsi\\FileUtils.cpp', V8IntegrationDir);
processFile('ReactCommon\\jsi\\FileUtils.h', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Platform.cpp', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Platform.h', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime.h', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime_basic.cpp', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime_droid.cpp', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime_impl.h', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime_shared.cpp', V8IntegrationDir);
processFile('ReactCommon\\jsi\\V8Runtime_win.cpp', V8IntegrationDir);

processFile(
  'ReactAndroid\\src\\main\\jni\\react\\jni\\Android.mk',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\v8\\Android.mk',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\v8\\base.mk',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\v8base\\Android.mk',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\v8platform\\Android.mk',
  V8IntegrationDir,
);
processFile(
  'ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactMarkerConstants.java',
  V8IntegrationDir,
);
processFile('ReactCommon\\cxxreact\\ReactMarker.h', V8IntegrationDir);

// BuildAndThirdPartyFixes
processFile(
  'ReactAndroid\\src\\main\\jni\\Application.mk',
  BuildAndThirdPartyFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\boost\\Android.mk',
  BuildAndThirdPartyFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\double-conversion\\Android.mk',
  BuildAndThirdPartyFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\folly\\Android.mk',
  BuildAndThirdPartyFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\glog\\Android.mk',
  BuildAndThirdPartyFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\third-party\\glog\\config.h',
  BuildAndThirdPartyFixesDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\jni\\third-party\\jsc\\Android.mk',
//   BuildAndThirdPartyFixesDir,
// );

processFile('ReactAndroid\\build.gradle', BuildAndThirdPartyFixesDir);
processFile('ReactAndroid\\NuGet.Config', BuildAndThirdPartyFixesDir);
processFile('ReactAndroid\\packages.config', BuildAndThirdPartyFixesDir);
processFile('ReactAndroid\\ReactAndroid.nuspec', BuildAndThirdPartyFixesDir);

// Security
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\Android.mk',
  SecurityFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\assert.cpp',
  SecurityFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\CRTSafeAPIs.cpp',
  SecurityFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\log.cpp',
  SecurityFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\include\\fb\\CRTSafeAPIs.h',
  SecurityFixesDir,
);
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\fb\\jni\\jni_helpers.cpp',
  SecurityFixesDir,
);
// processFile(
//   'ReactAndroid\\src\\main\\jni\\first-party\\yogajni\\Android.mk',
//   SecurityFixesDir,
// );
processFile(
  'ReactAndroid\\src\\main\\jni\\first-party\\yogajni\\jni\\YGJNI.cpp',
  SecurityFixesDir,
);
