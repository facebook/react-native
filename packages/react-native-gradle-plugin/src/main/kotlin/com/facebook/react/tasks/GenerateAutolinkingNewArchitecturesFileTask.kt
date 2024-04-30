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

abstract class GenerateAutolinkingNewArchitecturesFileTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:InputFile abstract val autolinkInputFile: RegularFileProperty

  @get:OutputDirectory abstract val generatedOutputDirectory: DirectoryProperty

  @TaskAction
  fun taskAction() {
    val model = JsonUtils.fromAutolinkingConfigJson(autolinkInputFile.get().asFile)

    val packages = model?.dependencies?.values ?: emptyList()

    val cmakeFileContent = generateCmakeFileContent(packages)
    val cppFileContent = generateCppFileContent(packages)

    val outputDir = generatedOutputDirectory.get().asFile
    outputDir.mkdirs()
    File(outputDir, CMAKE_FILENAME).apply { writeText(cmakeFileContent) }
    File(outputDir, CPP_FILENAME).apply { writeText(cppFileContent) }
    File(outputDir, H_FILENAME).apply { writeText(hTemplate) }
  }

  internal fun generateCmakeFileContent(
      packages: Collection<ModelAutolinkingDependenciesJson>
  ): String {
    val libraryIncludes =
        packages.joinToString("\n") { dep ->
          var addDirectoryString = ""
          if (dep.platforms?.android?.libraryName != null &&
              dep.platforms.android.cmakeListsPath != null) {
            // If user provided a custom cmakeListsPath, let's honor it.
            val nativeFolderPath =
                dep.platforms.android.cmakeListsPath.replace("CMakeLists.txt", "")
            addDirectoryString +=
                "add_subdirectory($nativeFolderPath ${dep.platforms.android.libraryName}_autolinked_build)"
          }
          if (dep.platforms?.android?.cxxModuleCMakeListsPath != null) {
            // If user provided a custom cxxModuleCMakeListsPath, let's honor it.
            val nativeFolderPath =
                dep.platforms.android.cxxModuleCMakeListsPath.replace("CMakeLists.txt", "")
            addDirectoryString +=
                "\nadd_subdirectory($nativeFolderPath ${dep.platforms.android.libraryName}_cxxmodule_autolinked_build)"
          }
          addDirectoryString
        }

    val libraryModules =
        packages.joinToString("\n  ") { dep ->
          var autolinkedLibraries = ""
          if (dep.platforms?.android?.libraryName != null) {
            autolinkedLibraries += "$CODEGEN_LIB_PREFIX${dep.platforms.android.libraryName}"
          }
          if (dep.platforms?.android?.cxxModuleCMakeListsModuleName != null) {
            autolinkedLibraries += "\n${dep.platforms.android.cxxModuleCMakeListsModuleName}"
          }
          autolinkedLibraries
        }

    return CMAKE_TEMPLATE.replace("{{ libraryIncludes }}", libraryIncludes)
        .replace("{{ libraryModules }}", libraryModules)
  }

  internal fun generateCppFileContent(
      packages: Collection<ModelAutolinkingDependenciesJson>
  ): String {
    val packagesWithLibraryNames = packages.filter { it.platforms?.android?.libraryName != null }

    val cppIncludes =
        packagesWithLibraryNames.joinToString("\n") { dep ->
          var include = "#include <${dep.platforms?.android?.libraryName}.h>"
          if (dep.platforms?.android?.componentDescriptors != null &&
              dep.platforms.android.componentDescriptors.isNotEmpty()) {
            include +=
                "\n#include <${COMPONENT_INCLUDE_PATH}/${dep.platforms.android.libraryName}/${COMPONENT_DESCRIPTOR_FILENAME}>"
          }
          if (dep.platforms?.android?.cxxModuleHeaderName != null) {
            include += "\n#include <${dep.platforms.android.cxxModuleHeaderName}.h>"
          }
          include
        }

    val cppTurboModuleJavaProviders =
        packagesWithLibraryNames.joinToString("\n") { dep ->
          val libraryName = dep.platforms?.android?.libraryName
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
            .filter { it.platforms?.android?.cxxModuleHeaderName != null }
            .joinToString("\n") { dep ->
              val cxxModuleHeaderName = dep.platforms?.android?.cxxModuleHeaderName
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
            .filter {
              it.platforms?.android?.componentDescriptors != null &&
                  it.platforms.android.componentDescriptors.isNotEmpty()
            }
            .joinToString("\n") {
              it.platforms?.android?.componentDescriptors?.joinToString("\n") {
                "providerRegistry->add(concreteComponentDescriptorProvider<$it>());"
              } ?: ""
            }

    return CPP_TEMPLATE.replace("{{ rncliCppIncludes }}", cppIncludes)
        .replace("{{ rncliCppTurboModuleJavaProviders }}", cppTurboModuleJavaProviders)
        .replace("{{ rncliCppTurboModuleCxxProviders }}", cppTurboModuleCxxProviders)
        .replace("{{ rncliCppComponentDescriptors }}", cppComponentDescriptors)
  }

  companion object {
    const val CMAKE_FILENAME = "Android-autolinking.cmake"

    // This needs to be changed to not be `rncli.h`, but requires change to CMake pipeline
    const val H_FILENAME = "rncli.h"
    const val CPP_FILENAME = "rncli.cpp"

    const val CODEGEN_LIB_PREFIX = "react_codegen_"

    const val COMPONENT_DESCRIPTOR_FILENAME = "ComponentDescriptors.h"
    const val COMPONENT_INCLUDE_PATH = "react/renderer/components"

    // language=cmake
    val CMAKE_TEMPLATE =
        """
      # This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin)
      cmake_minimum_required(VERSION 3.13)
      set(CMAKE_VERBOSE_MAKEFILE on)
      
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
      
      #include "rncli.h"
      {{ rncliCppIncludes }}
      
      namespace facebook {
      namespace react {
      
      std::shared_ptr<TurboModule> rncli_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {
      {{ rncliCppTurboModuleJavaProviders }}
        return nullptr;
      }
      
      std::shared_ptr<TurboModule> rncli_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker) {
      {{ rncliCppTurboModuleCxxProviders }}
        return nullptr;
      }
      
      void rncli_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry) {
      {{ rncliCppComponentDescriptors }}
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
      
      std::shared_ptr<TurboModule> rncli_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params);
      std::shared_ptr<TurboModule> rncli_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker);
      void rncli_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry);
      
      } // namespace react
      } // namespace facebook
      """
            .trimIndent()
  }
}
