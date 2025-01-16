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

abstract class GenerateAutolinkingNewArchitecturesFileTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:InputFile abstract val autolinkInputFile: RegularFileProperty

  @get:OutputDirectory abstract val generatedOutputDirectory: DirectoryProperty

  @TaskAction
  fun taskAction() {
    val model = JsonUtils.fromAutolinkingConfigJson(autolinkInputFile.get().asFile)

    val packages = filterAndroidPackages(model)
    val cmakeFileContent = generateCmakeFileContent(packages)
    val cppFileContent = generateCppFileContent(packages)

    val outputDir = generatedOutputDirectory.get().asFile
    outputDir.mkdirs()
    File(outputDir, CMAKE_FILENAME).apply { writeText(cmakeFileContent) }
    File(outputDir, CPP_FILENAME).apply { writeText(cppFileContent) }
    File(outputDir, H_FILENAME).apply { writeText(hTemplate) }
  }

  internal fun filterAndroidPackages(
      model: ModelAutolinkingConfigJson?
  ): List<ModelAutolinkingDependenciesPlatformAndroidJson> =
      model?.dependencies?.values?.mapNotNull { it.platforms?.android } ?: emptyList()

  internal fun generateCmakeFileContent(
      packages: List<ModelAutolinkingDependenciesPlatformAndroidJson>
  ): String {
    val libraryIncludes =
        packages.joinToString("\n") { dep ->
          var addDirectoryString = ""
          val libraryName = dep.libraryName
          val cmakeListsPath = dep.cmakeListsPath
          val cxxModuleCMakeListsPath = dep.cxxModuleCMakeListsPath
          if (libraryName != null && cmakeListsPath != null) {
            // If user provided a custom cmakeListsPath, let's honor it.
            val nativeFolderPath = sanitizeCmakeListsPath(cmakeListsPath)
            addDirectoryString +=
                "add_subdirectory(\"$nativeFolderPath\" ${libraryName}_autolinked_build)"
          }
          if (cxxModuleCMakeListsPath != null) {
            // If user provided a custom cxxModuleCMakeListsPath, let's honor it.
            val nativeFolderPath = sanitizeCmakeListsPath(cxxModuleCMakeListsPath)
            addDirectoryString +=
                "\nadd_subdirectory(\"$nativeFolderPath\" ${libraryName}_cxxmodule_autolinked_build)"
          }
          addDirectoryString
        }

    val libraryModules =
        packages.joinToString("\n  ") { dep ->
          var autolinkedLibraries = ""
          if (dep.libraryName != null) {
            autolinkedLibraries += "$CODEGEN_LIB_PREFIX${dep.libraryName}"
          }
          if (dep.cxxModuleCMakeListsModuleName != null) {
            autolinkedLibraries += "\n${dep.cxxModuleCMakeListsModuleName}"
          }
          autolinkedLibraries
        }

    return CMAKE_TEMPLATE.replace("{{ libraryIncludes }}", libraryIncludes)
        .replace("{{ libraryModules }}", libraryModules)
  }

  internal fun generateCppFileContent(
      packages: List<ModelAutolinkingDependenciesPlatformAndroidJson>
  ): String {
    val packagesWithLibraryNames = packages.filter { android -> android.libraryName != null }

    val cppIncludes =
        packagesWithLibraryNames.joinToString("\n") { dep ->
          var include = "#include <${dep.libraryName}.h>"
          if (dep.componentDescriptors.isNotEmpty()) {
            include +=
                "\n#include <${COMPONENT_INCLUDE_PATH}/${dep.libraryName}/${COMPONENT_DESCRIPTOR_FILENAME}>"
          }
          if (dep.cxxModuleHeaderName != null) {
            include += "\n#include <${dep.cxxModuleHeaderName}.h>"
          }
          include
        }

    val cppTurboModuleJavaProviders =
        packagesWithLibraryNames.joinToString("\n") { dep ->
          val libraryName = dep.libraryName
          // language=cpp
          """  
      auto module_$libraryName = ${libraryName}_ModuleProvider(moduleName, params);
      if (module_$libraryName != nullptr) {
      return module_$libraryName;
      }
      """
              .trimIndent()
        }

    val cppTurboModuleCxxProviders =
        packagesWithLibraryNames
            .filter { it.cxxModuleHeaderName != null }
            .joinToString("\n") { dep ->
              val cxxModuleHeaderName = dep.cxxModuleHeaderName
              // language=cpp
              """
      if (moduleName == $cxxModuleHeaderName::kModuleName) {
      return std::make_shared<$cxxModuleHeaderName>(jsInvoker);
      }
      """
                  .trimIndent()
            }

    val cppComponentDescriptors =
        packagesWithLibraryNames
            .filter { it.componentDescriptors.isNotEmpty() }
            .joinToString("\n") {
              it.componentDescriptors.joinToString("\n") {
                "providerRegistry->add(concreteComponentDescriptorProvider<$it>());"
              }
            }

    return CPP_TEMPLATE.replace("{{ autolinkingCppIncludes }}", cppIncludes)
        .replace("{{ autolinkingCppTurboModuleJavaProviders }}", cppTurboModuleJavaProviders)
        .replace("{{ autolinkingCppTurboModuleCxxProviders }}", cppTurboModuleCxxProviders)
        .replace("{{ autolinkingCppComponentDescriptors }}", cppComponentDescriptors)
  }

  companion object {
    const val CMAKE_FILENAME = "Android-autolinking.cmake"

    const val H_FILENAME = "autolinking.h"
    const val CPP_FILENAME = "autolinking.cpp"

    const val CODEGEN_LIB_PREFIX = "react_codegen_"

    const val COMPONENT_DESCRIPTOR_FILENAME = "ComponentDescriptors.h"
    const val COMPONENT_INCLUDE_PATH = "react/renderer/components"

    internal fun sanitizeCmakeListsPath(cmakeListsPath: String): String =
        cmakeListsPath.replace("CMakeLists.txt", "").replace(" ", "\\ ")

    // language=cmake
    val CMAKE_TEMPLATE =
        """
      # This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin)
      cmake_minimum_required(VERSION 3.13)
      set(CMAKE_VERBOSE_MAKEFILE on)
      
      # We set REACTNATIVE_MERGED_SO so libraries/apps can selectively decide to depend on either libreactnative.so
      # or link against a old prefab target (this is needed for React Native 0.76 on).
      set(REACTNATIVE_MERGED_SO true)
      
      {{ libraryIncludes }}
      
      set(AUTOLINKED_LIBRARIES
        {{ libraryModules }}
      )
      """
            .trimIndent()

    // language=cpp
    val CPP_TEMPLATE =
        """
      /**
       * This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin).
       *
       * Do not edit this file as changes may cause incorrect behavior and will be lost
       * once the code is regenerated.
       *
       */
      
      #include "autolinking.h"
      {{ autolinkingCppIncludes }}
      
      namespace facebook {
      namespace react {
      
      std::shared_ptr<TurboModule> autolinking_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {
      {{ autolinkingCppTurboModuleJavaProviders }}
        return nullptr;
      }
      
      std::shared_ptr<TurboModule> autolinking_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker) {
      {{ autolinkingCppTurboModuleCxxProviders }}
        return nullptr;
      }
      
      void autolinking_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry) {
      {{ autolinkingCppComponentDescriptors }}
        return;
      }
      
      } // namespace react
      } // namespace facebook
      """
            .trimIndent()

    // language=cpp
    val hTemplate =
        """
      /**
       * This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin).
       *
       * Do not edit this file as changes may cause incorrect behavior and will be lost
       * once the code is regenerated.
       *
       */
      
      #pragma once
      
      #include <ReactCommon/CallInvoker.h>
      #include <ReactCommon/JavaTurboModule.h>
      #include <ReactCommon/TurboModule.h>
      #include <jsi/jsi.h>
      #include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
      
      namespace facebook {
      namespace react {
      
      std::shared_ptr<TurboModule> autolinking_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params);
      std::shared_ptr<TurboModule> autolinking_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker);
      void autolinking_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry);
      
      } // namespace react
      } // namespace facebook
      """
            .trimIndent()
  }
}
