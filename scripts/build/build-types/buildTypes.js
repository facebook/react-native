/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {PACKAGES_DIR, REPO_ROOT} = require('../../consts');
const getRequireStack = require('./resolution/getRequireStack');
const resolveTypeInputFile = require('./resolution/resolveTypeInputFile');
const translatedModuleTemplate = require('./templates/translatedModule.d.ts-template');
const translateSourceFile = require('./translateSourceFile');
const {promises: fs} = require('fs');
const micromatch = require('micromatch');
const path = require('path');

const OUTPUT_DIR = 'types_generated';

const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.{macos,windows}.js',
];

const ENTRY_POINTS = [
  'packages/react-native/Libraries/ActionSheetIOS/ActionSheetIOS.js',
  'packages/react-native/Libraries/Alert/Alert.js',
  'packages/react-native/Libraries/Animated/Animated.js',
  'packages/react-native/Libraries/Animated/useAnimatedValue.js',
  'packages/react-native/Libraries/AppState/AppState.js',
  'packages/react-native/Libraries/BatchedBridge/NativeModules.js',
  'packages/react-native/Libraries/Blob/Blob.js',
  'packages/react-native/Libraries/Blob/File.js',
  'packages/react-native/Libraries/Blob/FileReader.js',
  'packages/react-native/Libraries/Blob/URL.js',
  'packages/react-native/Libraries/Blob/URLSearchParams.js',
  'packages/react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.js',
  'packages/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js',
  'packages/react-native/Libraries/Components/Button.js',
  'packages/react-native/Libraries/Components/Clipboard/Clipboard.js',
  'packages/react-native/Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.js',
  'packages/react-native/Libraries/Components/Keyboard/Keyboard.js',
  'packages/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js',
  'packages/react-native/Libraries/Components/Pressable/Pressable.js',
  'packages/react-native/Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.js',
  'packages/react-native/Libraries/Components/ToastAndroid/ToastAndroid.js',
  'packages/react-native/Libraries/Components/ScrollView/ScrollView.js',
  'packages/react-native/Libraries/Interaction/InteractionManager.js',
  'packages/react-native/Libraries/Interaction/PanResponder.js',
  'packages/react-native/Libraries/EventEmitter/NativeEventEmitter.js',
  'packages/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js',
  'packages/react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter.js',
  'packages/react-native/Libraries/LayoutAnimation/LayoutAnimation.js',
  'packages/react-native/Libraries/LogBox/LogBox.js',
  'packages/react-native/Libraries/Performance/Systrace.js',
  'packages/react-native/Libraries/ReactNative/AppRegistry.js',
  'packages/react-native/Libraries/ReactNative/I18nManager.js',
  'packages/react-native/Libraries/ReactNative/RendererProxy.js',
  'packages/react-native/Libraries/ReactNative/requireNativeComponent.js',
  'packages/react-native/Libraries/ReactNative/RootTag.js',
  'packages/react-native/Libraries/ReactNative/UIManager.js',
  'packages/react-native/Libraries/Settings/Settings.js',
  'packages/react-native/Libraries/Share/Share.js',
  'packages/react-native/Libraries/Utilities/Appearance.js',
  'packages/react-native/Libraries/Utilities/BackHandler.js.flow',
  'packages/react-native/Libraries/Utilities/DevSettings.js',
  'packages/react-native/Libraries/Utilities/Dimensions.js',
  'packages/react-native/Libraries/Utilities/PixelRatio.js',
  'packages/react-native/Libraries/Utilities/Platform.js.flow',
  'packages/react-native/Libraries/Utilities/useColorScheme.js',
  'packages/react-native/Libraries/Utilities/useWindowDimensions.js',
  'packages/react-native/Libraries/vendor/emitter/EventEmitter.js',
  'packages/react-native/Libraries/Vibration/Vibration.js',
  'packages/react-native/Libraries/PermissionsAndroid/PermissionsAndroid.js',
  'packages/react-native/Libraries/PushNotificationIOS/PushNotificationIOS.js',
  'packages/react-native/Libraries/Modal/Modal.js',
  'packages/react-native/Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  'packages/react-native/Libraries/Components/Touchable/TouchableNativeFeedback.js',
  'packages/react-native/Libraries/Components/Touchable/TouchableHighlight.js',
  'packages/react-native/Libraries/Components/Touchable/Touchable.js',
  'packages/react-native/Libraries/Components/Switch/Switch.js',
  'packages/react-native/Libraries/Components/StatusBar/StatusBar.js',
  'packages/react-native/Libraries/Components/RefreshControl/RefreshControl.js',
  'packages/react-native/Libraries/Image/Image.js.flow',
  'packages/react-native/Libraries/Image/ImageBackground.js',
  'packages/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js',
  'packages/react-native/Libraries/Components/Touchable/TouchableOpacity.js',
];

/**
 * [Experimental] Build generated TypeScript types for react-native.
 */
async function buildTypes(): Promise<void> {
  const files = new Set<string>(
    ENTRY_POINTS.map(file => path.join(REPO_ROOT, file)),
  );
  const translatedFiles = new Set<string>();
  const dependencyEdges: DependencyEdges = [];

  while (files.size > 0) {
    for (const file of files) {
      const interfaceFile = resolveTypeInputFile(file);
      if (interfaceFile) {
        files.delete(file);
        translatedFiles.add(file);
        files.add(interfaceFile);
      }
    }
    const dependencies = await translateSourceFiles(dependencyEdges, files);
    dependencyEdges.push(...dependencies);

    files.forEach(file => translatedFiles.add(file));
    files.clear();

    for (const [, dep] of dependencies) {
      if (
        !translatedFiles.has(dep) &&
        !IGNORE_PATTERNS.some(pattern => micromatch.isMatch(dep, pattern))
      ) {
        files.add(dep);
      }
    }
  }
}

type DependencyEdges = Array<[string, string]>;

async function translateSourceFiles(
  dependencyEdges: DependencyEdges,
  inputFiles: Iterable<string>,
): Promise<DependencyEdges> {
  const files = new Set<string>([...inputFiles]);
  const dependencies: DependencyEdges = [];

  await Promise.all(
    Array.from(files).map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');

      try {
        const {result: typescriptDef, dependencies: fileDeps} =
          await translateSourceFile(source, file);

        for (const dep of fileDeps) {
          dependencies.push([file, dep]);
        }

        await fs.mkdir(path.dirname(buildPath), {recursive: true});
        await fs.writeFile(
          buildPath,
          translatedModuleTemplate({
            originalFileName: path.relative(REPO_ROOT, file),
            source: stripDocblock(typescriptDef),
          }),
        );
      } catch (e) {
        console.error(`Failed to build ${path.relative(REPO_ROOT, file)}\n`, e);
        const requireStack = getRequireStack(dependencyEdges, file);
        if (requireStack.length > 0) {
          console.error('Require stack:');
          for (const stackEntry of requireStack) {
            console.error(`- ${stackEntry}`);
          }
        }
      }
    }),
  );

  return dependencies;
}

function getPackageName(file: string): string {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file: string): string {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(packageDir, OUTPUT_DIR)
      .replace(/\.js\.flow$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

function stripDocblock(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\/\n/, '');
}

module.exports = buildTypes;
