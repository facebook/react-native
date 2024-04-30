/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.model.ModelAutolinkingDependenciesJson
import com.facebook.react.utils.JsonUtils
import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

abstract class GeneratePackageListTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:InputFile abstract val autolinkInputFile: RegularFileProperty

  @get:OutputDirectory abstract val generatedOutputDirectory: DirectoryProperty

  @TaskAction
  fun taskAction() {
    val model = JsonUtils.fromAutolinkingConfigJson(autolinkInputFile.get().asFile)

    val packageName =
        model?.project?.android?.packageName
            ?: error(
                "RNGP - Autolinking: Could not find project.android.packageName in react-native config output! Could not autolink packages without this field.")
    val packages = model.dependencies?.values ?: emptyList()

    val packageImports = composePackageImports(packageName, packages)
    val packageClassInstance = composePackageInstance(packageName, packages)
    val generatedFileContents = composeFileContent(packageImports, packageClassInstance)

    val outputDir = generatedOutputDirectory.get().asFile
    outputDir.mkdirs()
    File(outputDir, GENERATED_FILENAME).apply {
      parentFile.mkdirs()
      writeText(generatedFileContents)
    }
  }

  internal fun composePackageImports(
      packageName: String,
      packages: Collection<ModelAutolinkingDependenciesJson>
  ) =
      packages.joinToString("\n") { entry ->
        val packageImportPath =
            requireNotNull(entry.platforms?.android?.packageImportPath) {
              "RNGP - Autolinking: Missing `packageImportPath` in `config` for dependency ${entry.name}. This is required to generate the autolinking package list."
            }
        "// ${entry.name}\n${interpolateDynamicValues(packageImportPath, packageName)}"
      }

  internal fun composePackageInstance(
      packageName: String,
      packages: Collection<ModelAutolinkingDependenciesJson>
  ) =
      if (packages.isEmpty()) {
        ""
      } else {
        ",\n      " +
            packages.joinToString(",\n      ") { entry ->
              val packageInstance =
                  requireNotNull(entry.platforms?.android?.packageInstance) {
                    "RNGP - Autolinking: Missing `packageInstance` in `config` for dependency ${entry.name}. This is required to generate the autolinking package list."
                  }
              interpolateDynamicValues(packageInstance, packageName)
            }
      }

  internal fun composeFileContent(packageImports: String, packageClassInstance: String): String =
      generatedFileContentsTemplate
          .replace("{{ packageImports }}", packageImports)
          .replace("{{ packageClassInstances }}", packageClassInstance)

  companion object {
    const val GENERATED_FILENAME = "com/facebook/react/PackageList2.java"

    /**
     * Before adding the package replacement mechanism, BuildConfig and R classes were imported
     * automatically into the scope of the file. We want to replace all non-FQDN references to those
     * classes with the package name of the MainApplication.
     *
     *     We want to match "R" or "BuildConfig":
     *     - new Package(R.string…),
     *     - Module.configure(BuildConfig);
     *     ^ hence including (BuildConfig|R)
     *     but we don't want to match "R":
     *     - new Package(getResources…),
     *     - new PackageR…,
     *     - new Royal…,
     *     ^ hence excluding \w before and after matches
     *     and "BuildConfig" that has FQDN reference:
     *     - Module.configure(com.acme.BuildConfig);
     *     ^ hence excluding . before the match.
     */
    internal fun interpolateDynamicValues(input: String, packageName: String): String =
        input.replace(Regex("([^.\\w])(BuildConfig|R)(\\W)")) { match ->
          val (prefix, className, suffix) = match.destructured
          "${prefix}${packageName}.${className}${suffix}"
        }

    // language=java
    val generatedFileContentsTemplate =
        """
            package com.facebook.react;
            
            import android.app.Application;
            import android.content.Context;
            import android.content.res.Resources;
            
            import com.facebook.react.ReactPackage;
            import com.facebook.react.shell.MainPackageConfig;
            import com.facebook.react.shell.MainReactPackage;
            import java.util.Arrays;
            import java.util.ArrayList;
            
            {{ packageImports }}
            
            public class PackageList2 {
              private Application application;
              private ReactNativeHost reactNativeHost;
              private MainPackageConfig mConfig;
            
              public PackageList2(ReactNativeHost reactNativeHost) {
                this(reactNativeHost, null);
              }
            
              public PackageList2(Application application) {
                this(application, null);
              }
            
              public PackageList2(ReactNativeHost reactNativeHost, MainPackageConfig config) {
                this.reactNativeHost = reactNativeHost;
                mConfig = config;
              }
            
              public PackageList2(Application application, MainPackageConfig config) {
                this.reactNativeHost = null;
                this.application = application;
                mConfig = config;
              }
            
              private ReactNativeHost getReactNativeHost() {
                return this.reactNativeHost;
              }
            
              private Resources getResources() {
                return this.getApplication().getResources();
              }
            
              private Application getApplication() {
                if (this.reactNativeHost == null) return this.application;
                return this.reactNativeHost.getApplication();
              }
            
              private Context getApplicationContext() {
                return this.getApplication().getApplicationContext();
              }
            
              public ArrayList<ReactPackage> getPackages() {
                return new ArrayList<>(Arrays.<ReactPackage>asList(
                  new MainReactPackage(mConfig){{ packageClassInstances }}
                ));
              }
            }
            """
            .trimIndent()
  }
}
