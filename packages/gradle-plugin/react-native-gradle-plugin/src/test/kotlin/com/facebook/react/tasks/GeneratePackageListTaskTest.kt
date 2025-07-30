/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelAutolinkingDependenciesJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformAndroidJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformJson
import com.facebook.react.tests.createTestTask
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GeneratePackageListTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun generatePackageListTask_groupIsSetCorrectly() {
    val task = createTestTask<GeneratePackageListTask> {}
    assertThat(task.group).isEqualTo("react")
  }

  @Test
  fun generatePackageListTask_staticInputs_areSetCorrectly() {
    val outputFolder = tempFolder.newFolder("build")
    val inputFile = tempFolder.newFile("config.json")

    val task =
        createTestTask<GeneratePackageListTask> {
          it.generatedOutputDirectory.set(outputFolder)
          it.autolinkInputFile.set(inputFile)
        }

    assertThat(task.inputs.files.singleFile).isEqualTo(inputFile)
    assertThat(task.outputs.files.singleFile).isEqualTo(outputFolder)
  }

  @Test
  fun composePackageImports_withNoPackages_returnsEmpty() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"
    val result = task.composePackageImports(packageName, emptyMap())
    assertThat(result).isEqualTo("")
  }

  @Test
  fun composePackageImports_withPackages_returnsImportCorrectly() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"

    val result = task.composePackageImports(packageName, testDependencies)
    assertThat(result)
        .isEqualTo(
            """
      // @react-native/a-package
      import com.facebook.react.aPackage;
      // @react-native/another-package
      import com.facebook.react.anotherPackage;
    """
                .trimIndent())
  }

  @Test
  fun composePackageInstance_withNoPackages_returnsEmpty() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"
    val result = task.composePackageInstance(packageName, emptyMap())
    assertThat(result).isEqualTo("")
  }

  @Test
  fun composePackageInstance_withPackages_returnsImportCorrectly() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"

    val result = task.composePackageInstance(packageName, testDependencies)
    assertThat(result)
        .isEqualTo(
            """
      ,
            new APackage(),
            new AnotherPackage()
    """
                .trimIndent())
  }

  @Test
  fun interpolateDynamicValues_withNoBuildConfigOrROccurrencies_doesNothing() {
    val packageName = "com.facebook.react"
    val input = "com.facebook.react.aPackage"
    val output = GeneratePackageListTask.interpolateDynamicValues(input, packageName)
    assertThat(output).isEqualTo(input)
  }

  @Test
  fun interpolateDynamicValues_withR_doesQualifyThem() {
    val packageName = "com.facebook.react"
    val input = "new APackageWithR(R.string.value)"
    val output = GeneratePackageListTask.interpolateDynamicValues(input, packageName)
    assertThat(output).isEqualTo("new APackageWithR(com.facebook.react.R.string.value)")
  }

  @Test
  fun interpolateDynamicValues_withBuildConfig_doesQualifyThem() {
    val packageName = "com.facebook.react"
    val input = "new APackageWithBuildConfigInTheName(BuildConfig.VALUE)"
    val output = GeneratePackageListTask.interpolateDynamicValues(input, packageName)
    assertThat(output)
        .isEqualTo("new APackageWithBuildConfigInTheName(com.facebook.react.BuildConfig.VALUE)")
  }

  @Test
  fun filterAndroidPackages_withNull_returnsEmpty() {
    val task = createTestTask<GeneratePackageListTask>()
    val result = task.filterAndroidPackages(null)
    assertThat(result)
        .isEqualTo(emptyMap<String, ModelAutolinkingDependenciesPlatformAndroidJson>())
  }

  @Test
  fun filterAndroidPackages_withEmptyObject_returnsEmpty() {
    val task = createTestTask<GeneratePackageListTask>()
    val result = task.filterAndroidPackages(ModelAutolinkingConfigJson("1000.0.0", null, null))
    assertThat(result)
        .isEqualTo(emptyMap<String, ModelAutolinkingDependenciesPlatformAndroidJson>())
  }

  @Test
  fun filterAndroidPackages_withNoAndroidObject_returnsEmpty() {
    val task = createTestTask<GeneratePackageListTask>()
    val result =
        task.filterAndroidPackages(
            ModelAutolinkingConfigJson(
                reactNativeVersion = "1000.0.0",
                dependencies =
                    mapOf(
                        "a-dependency" to
                            ModelAutolinkingDependenciesJson(
                                root = "./a/directory",
                                name = "a-dependency",
                                platforms =
                                    ModelAutolinkingDependenciesPlatformJson(android = null))),
                project = null))
    assertThat(result)
        .isEqualTo(emptyMap<String, ModelAutolinkingDependenciesPlatformAndroidJson>())
  }

  @Test
  fun filterAndroidPackages_withValidAndroidObject_returnsIt() {
    val task = createTestTask<GeneratePackageListTask>()
    val android =
        ModelAutolinkingDependenciesPlatformAndroidJson(
            sourceDir = "./a/directory/android",
            packageImportPath = "import com.facebook.react.aPackage;",
            packageInstance = "new APackage()",
            buildTypes = emptyList(),
        )

    val result =
        task.filterAndroidPackages(
            ModelAutolinkingConfigJson(
                reactNativeVersion = "1000.0.0",
                dependencies =
                    mapOf(
                        "a-dependency" to
                            ModelAutolinkingDependenciesJson(
                                root = "./a/directory",
                                name = "a-dependency",
                                platforms =
                                    ModelAutolinkingDependenciesPlatformJson(android = android))),
                project = null))
    assertThat(result.entries.size).isEqualTo(1)
    assertThat(result["a-dependency"]).isEqualTo(android)
  }

  @Test
  fun filterAndroidPackages_withIsPureCxxDependencyObject_returnsIt() {
    val task = createTestTask<GeneratePackageListTask>()
    val android =
        ModelAutolinkingDependenciesPlatformAndroidJson(
            sourceDir = "./a/directory/android",
            packageImportPath = "import com.facebook.react.aPackage;",
            packageInstance = "new APackage()",
            buildTypes = emptyList(),
            isPureCxxDependency = true)

    val result =
        task.filterAndroidPackages(
            ModelAutolinkingConfigJson(
                reactNativeVersion = "1000.0.0",
                dependencies =
                    mapOf(
                        "a-pure-cxx-dependency" to
                            ModelAutolinkingDependenciesJson(
                                root = "./a/directory",
                                name = "a-pure-cxx-dependency",
                                platforms =
                                    ModelAutolinkingDependenciesPlatformJson(android = android))),
                project = null))
    assertThat(result)
        .isEqualTo(emptyMap<String, ModelAutolinkingDependenciesPlatformAndroidJson>())
  }

  @Test
  fun composeFileContent_withNoPackages_returnsValidFile() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"
    val imports = task.composePackageImports(packageName, emptyMap())
    val instance = task.composePackageInstance(packageName, emptyMap())
    val result = task.composeFileContent(imports, instance)
    // language=java
    assertThat(result)
        .isEqualTo(
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



    @SuppressWarnings("deprecation")
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
          new MainReactPackage(mConfig)
        ));
      }
    }
    """
                .trimIndent())
  }

  @Test
  fun composeFileContent_withPackages_returnsValidFile() {
    val task = createTestTask<GeneratePackageListTask>()
    val packageName = "com.facebook.react"
    val imports = task.composePackageImports(packageName, testDependencies)
    val instance = task.composePackageInstance(packageName, testDependencies)
    val result = task.composeFileContent(imports, instance)
    // language=java
    assertThat(result)
        .isEqualTo(
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

    // @react-native/a-package
    import com.facebook.react.aPackage;
    // @react-native/another-package
    import com.facebook.react.anotherPackage;
    
    @SuppressWarnings("deprecation")
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
          new MainReactPackage(mConfig),
          new APackage(),
          new AnotherPackage()
        ));
      }
    }
    """
                .trimIndent())
  }

  private val testDependencies =
      mapOf(
          "@react-native/a-package" to
              ModelAutolinkingDependenciesPlatformAndroidJson(
                  sourceDir = "./a/directory",
                  packageImportPath = "import com.facebook.react.aPackage;",
                  packageInstance = "new APackage()",
                  buildTypes = emptyList(),
                  libraryName = "aPackage",
                  componentDescriptors = emptyList(),
                  cmakeListsPath = "./a/directory/CMakeLists.txt",
              ),
          "@react-native/another-package" to
              ModelAutolinkingDependenciesPlatformAndroidJson(
                  sourceDir = "./another/directory",
                  packageImportPath = "import com.facebook.react.anotherPackage;",
                  packageInstance = "new AnotherPackage()",
                  buildTypes = emptyList(),
                  libraryName = "anotherPackage",
                  componentDescriptors = emptyList(),
                  cmakeListsPath = "./another/directory/CMakeLists.txt",
              ))
}
