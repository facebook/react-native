/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.api.BaseVariant
import com.facebook.react.utils.projectPathToLibraryName
import java.io.File
import javax.inject.Inject
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.MapProperty
import org.gradle.api.provider.Property

abstract class ReactExtension @Inject constructor(project: Project) {

  private val objects = project.objects

  /**
   * Whether the React App plugin should apply its logic or not. Set it to false if you're still
   * relying on `react.gradle` to configure your build. Default: false
   */
  val applyAppPlugin: Property<Boolean> = objects.property(Boolean::class.java).convention(false)

  /**
   * The path to the root of your project. This is the path to where the `package.json` lives. All
   * the CLI commands will be invoked from this folder as working directory.
   *
   * Default: ${rootProject.dir}/../
   */
  val root: DirectoryProperty =
      objects.directoryProperty().convention(project.rootProject.layout.projectDirectory.dir("../"))

  /**
   * The path to the JS entry file. If not specified, the plugin will try to resolve it using a list
   * of known locations (e.g. `index.android.js`, `index.js`, etc.).
   */
  val entryFile: RegularFileProperty = objects.fileProperty()

  /**
   * The path to the React Native CLI. If not specified, the plugin will try to resolve it looking
   * for `react-native` CLI inside `node_modules` in [root].
   */
  val cliPath: Property<String> = objects.property(String::class.java)

  /**
   * The path to the Node executable and extra args. By default it assumes that you have `node`
   * installed and configured in your $PATH. Default: ["node"]
   */
  val nodeExecutableAndArgs: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("node"))

  /** The command to use to invoke bundle. Default is `bundle` and will be invoked on [root]. */
  val bundleCommand: Property<String> = objects.property(String::class.java).convention("bundle")

  /**
   * Custom configuration for the [bundleCommand]. If provided it will be passed over with a
   * `--config` flag to the bundle command.
   */
  val bundleConfig: Property<String> = objects.property(String::class.java)

  /**
   * The Bundle Asset name. This name will be used also for deriving other bundle outputs such as
   * the packager source map, the compiler source map and the output source map file.
   *
   * Default: index.android.bundle
   */
  val bundleAssetName: Property<String> =
      objects.property(String::class.java).convention("index.android.bundle")

  /**
   * Variant Name to File destination map that allows to specify where is the resource dir for a
   * specific variant. If a value is supplied, the plugin will copy the bundled resource for that
   * variant from `generated/res/react/<variant>` into the custom specified location. Default: {}
   */
  val resourcesDir: MapProperty<String, File> =
      objects.mapProperty(String::class.java, File::class.java).convention(emptyMap())

  /**
   * Variant Name to File destination map that allows to specify where is the asset dir for a
   * specific variant. If a value is supplied, the plugin will copy the bundled JS for that variant
   * from `generated/assets/react/<variant>` into the custom specified location. Default: {}
   */
  val jsBundleDir: MapProperty<String, File> =
      objects.mapProperty(String::class.java, File::class.java).convention(emptyMap())

  /** ANT-style excludes for the bundle command. Default: ["android / **", "ios / **"] */
  val inputExcludes: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("android/**", "ios/**"))

  /**
   * Toggles the VM Cleanup step. If enabled, before the bundle task we will clean up all the
   * unnecessary files. If disabled, the developers will have to manually cleanup the files.
   * Default: true
   */
  val enableVmCleanup: Property<Boolean> = objects.property(Boolean::class.java).convention(true)

  /** Extra args that will be passed to the [bundleCommand] Default: [] */
  val extraPackagerArgs: ListProperty<String> =
      objects.listProperty(String::class.java).convention(emptyList())

  /**
   * Allows to disable dev mode for certain variants. That's useful if you have a production variant
   * (say `canary`) where you don't want dev mode to be enabled. Default: []
   */
  val devDisabledInVariants: ListProperty<String> =
      objects.listProperty(String::class.java).convention(emptyList())

  /**
   * Functional interface to disable dev mode only on specific [BaseVariant] Default: will check
   * [devDisabledInVariants] or return True for Release variants and False for Debug variants.
   */
  var disableDevForVariant: (BaseVariant) -> Boolean = { variant ->
    variant.name in devDisabledInVariants.get() || variant.isRelease
  }

  /**
   * Variant Name to Boolean map that allows to toggle the bundle command for a specific variant.
   * Default: {}
   */
  // todo maybe lambda as for hermes?
  val bundleIn: MapProperty<String, Boolean> =
      objects.mapProperty(String::class.java, Boolean::class.java).convention(emptyMap())

  /**
   * Functional interface to toggle the bundle command only on specific [BaseVariant] Default: will
   * check [bundleIn] or return True for Release variants and False for Debug variants.
   */
  var bundleForVariant: (BaseVariant) -> Boolean = { variant ->
    if (bundleIn.getting(variant.name).isPresent) bundleIn.getting(variant.name).get()
    else if (bundleIn.getting(variant.buildType.name).isPresent)
        bundleIn.getting(variant.buildType.name).get()
    else variant.isRelease
  }

  /** Hermes Config */

  /**
   * The command to use to invoke hermesc (the hermes compiler). Default is "", the plugin will
   * autodetect it.
   */
  val hermesCommand: Property<String> = objects.property(String::class.java).convention("")

  /** Toggle Hermes for the whole build. Default: false */
  val enableHermes: Property<Boolean> = objects.property(Boolean::class.java).convention(false)

  /**
   * Functional interface to selectively enabled Hermes only on specific [BaseVariant] Default: will
   * return [enableHermes] for all the variants.
   */
  var enableHermesForVariant: (BaseVariant) -> Boolean = { enableHermes.get() }

  /**
   * Functional interface specify flags for Hermes on specific [BaseVariant] Default: will return
   * [hermesFlagsRelease] for Release variants and [hermesFlagsDebug] for Debug variants.
   */
  var hermesFlagsForVariant: (BaseVariant) -> List<String> = { variant ->
    if (variant.isRelease) hermesFlagsRelease.get() else hermesFlagsDebug.get()
  }

  /**
   * Functional interface to delete debug files only on specific [BaseVariant] Default: will return
   * True for Release variants and False for Debug variants.
   */
  var deleteDebugFilesForVariant: (BaseVariant) -> Boolean = { variant -> variant.isRelease }

  /** Flags to pass to Hermes for Debug variants. Default: [] */
  val hermesFlagsDebug: ListProperty<String> =
      objects.listProperty(String::class.java).convention(emptyList())

  /** Flags to pass to Hermes for Release variants. Default: ["-O", "-output-source-map"] */
  val hermesFlagsRelease: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("-O", "-output-source-map"))

  /**
   * The path to the Compose Source Map script. Default:
   * "node_modules/react-native/scripts/compose-source-maps.js"
   */
  val composeSourceMapsPath: Property<String> =
      objects
          .property(String::class.java)
          .convention("node_modules/react-native/scripts/compose-source-maps.js")

  /** Codegen Config */

  /**
   * The path to the react-native-codegen NPM package folder.
   *
   * Default: ${rootProject.dir}/../node_modules/react-native-codegen
   */
  val codegenDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/react-native-codegen"))

  /**
   * The path to the react-native NPM package folder.
   *
   * Default: ${rootProject.dir}/../node_modules/react-native-codegen
   */
  val reactNativeDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/react-native"))

  /**
   * The root directory for all JS files for the app.
   *
   * Default: [root] (i.e. ${rootProject.dir}/../)
   */
  val jsRootDir: DirectoryProperty = objects.directoryProperty().convention(root.get())

  /**
   * The library name that will be used for the codegen artifacts.
   *
   * Default: <UpperCamelVersionOfProjectPath>Spec (e.g. for :example:project it will be
   * ExampleProjectSpec).
   */
  val libraryName: Property<String> =
      objects.property(String::class.java).convention(projectPathToLibraryName(project.path))

  /**
   * Java package name to use for any codegen artifacts produced during build time. Default:
   * com.facebook.fbreact.specs
   */
  val codegenJavaPackageName: Property<String> =
      objects.property(String::class.java).convention("com.facebook.fbreact.specs")

  /**
   * Whether the Java Generator (based on Javapoet) should be used or not. Please note that this is
   * currently deprecated as the Java generator is not supported anymore. Default: false
   */
  @Deprecated(
      level = DeprecationLevel.ERROR,
      message =
          "Please note that this is deprecated as the Java generator is not supported and react-native-codegen should be used instead.")
  val useJavaGenerator: Property<Boolean> = objects.property(Boolean::class.java).convention(false)

  /**
   * The `reactRoot` property was confusing and should not be used.
   *
   * You should instead use either:
   * - [root] to point to your root project (where the package.json lives)
   * - [reactNativeDir] to point to the NPM package of react native.
   *
   * A valid configuration would look like:
   *
   * ```
   * react {
   *    root = rootProject.file("..")
   *    reactNativeDir = rootProject.file("../node_modules/react-native")
   * }
   * ```
   *
   * Please also note that those are the default value and you most likely don't need those at all.
   */
  @Deprecated(
      "reactRoot was confusing and has been replace with root " +
          "to point to your root project and reactNativeDir to point to " +
          "the folder of the react-native NPM package",
      replaceWith = ReplaceWith("reactNativeRoot"))
  val reactRoot: DirectoryProperty = objects.directoryProperty()
}
