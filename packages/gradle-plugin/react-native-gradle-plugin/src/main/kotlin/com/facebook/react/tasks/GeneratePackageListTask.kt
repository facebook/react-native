/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformAndroidJson
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
    val model =
        JsonUtils.fromAutolinkingConfigJson(autolinkInputFile.get().asFile)
            ?: error(
                """
        RNGP - Autolinking: Could not parse autolinking config file:
        ${autolinkInputFile.get().asFile.absolutePath}
        
        The file is either missing or not containing valid JSON so the build won't succeed. 
      """
                    .trimIndent())

    val packageName =
        model.project?.android?.packageName
            ?: error(
                "RNGP - Autolinking: Could not find project.android.packageName in react-native config output! Could not autolink packages without this field.")

    val androidPackages = filterAndroidPackages(model)
    val packageImports = composePackageImports(packageName, androidPackages)
    val packageClassInstance = composePackageInstance(packageName, androidPackages)
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
      packages: Map<String, ModelAutolinkingDependenciesPlatformAndroidJson>
  ) =
      packages.entries.joinToString("\n") { (name, dep) ->
        val packageImportPath =
            requireNotNull(dep.packageImportPath) {
              "RNGP - Autolinking: Missing `packageImportPath` in `config` for dependency $name. This is required to generate the autolinking package list."
            }
        "// $name\n${interpolateDynamicValues(packageImportPath, packageName)}"
      }

  internal fun composePackageInstance(
      packageName: String,
      packages: Map<String, ModelAutolinkingDependenciesPlatformAndroidJson>
  ) =
      if (packages.isEmpty()) {
        ""
      } else {
        ",\n      " +
            packages.entries.joinToString(",\n      ") { (name, dep) ->
              val packageInstance =
                  requireNotNull(dep.packageInstance) {
                    "RNGP - Autolinking: Missing `packageInstance` in `config` for dependency $name. This is required to generate the autolinking package list."
                  }
              interpolateDynamicValues(packageInstance, packageName)
            }
      }

  internal fun filterAndroidPackages(
      model: ModelAutolinkingConfigJson?
  ): Map<String, ModelAutolinkingDependenciesPlatformAndroidJson> {
    val packages = model?.dependencies?.values ?: emptyList()
    return packages
        .filter { it.platforms?.android != null }
        // The pure C++ dependencies won't have a .java/.kt file to import
        .filterNot { it.platforms?.android?.isPureCxxDependency == true }
        .associate { it.name to checkNotNull(it.platforms?.android) }
  }

  internal fun composeFileContent(packageImports: String, packageClassInstance: String): String =
      generatedFileContentsTemplate
          .replace("{{ packageImports }}", packageImports)
          .replace("{{ packageClassInstances }}", packageClassInstance)

  companion object {
    const val GENERATED_FILENAME = "com/facebook/react/PackageList.java"

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
            
            public class PackageList {
              private Application application;
              private ReactNativeHost reactNativeHost;
              private MainPackageConfig mConfig;
            
              public PackageList(ReactNativeHost reactNativeHost) {
                this(reactNativeHost, null);
              }
            
              public PackageList(Application application) {
                this(application, null);
              }
            
              public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
                this.reactNativeHost = reactNativeHost;
                mConfig = config;
              }
            
              public PackageList(Application application, MainPackageConfig config) {
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
