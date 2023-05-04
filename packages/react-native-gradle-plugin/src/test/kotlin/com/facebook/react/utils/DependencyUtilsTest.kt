/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createProject
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.mavenRepoFromURI
import com.facebook.react.utils.DependencyUtils.mavenRepoFromUrl
import com.facebook.react.utils.DependencyUtils.readVersionString
import java.net.URI
import org.gradle.api.artifacts.repositories.MavenArtifactRepository
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class DependencyUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun configureRepositories_withProjectPropertySet_configuresMavenLocalCorrectly() {
    val localMaven = tempFolder.newFolder("m2")
    val localMavenURI = localMaven.toURI()
    val project = createProject()
    project.extensions.extraProperties.set("REACT_NATIVE_MAVEN_LOCAL_REPO", localMaven.absolutePath)

    configureRepositories(project, tempFolder.root)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == localMavenURI
        })
  }

  @Test
  fun configureRepositories_containsSnapshotRepo() {
    val repositoryURI = URI.create("https://oss.sonatype.org/content/repositories/snapshots/")
    val project = createProject()

    configureRepositories(project, tempFolder.root)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_containsJscLocalMavenRepo() {
    val projectFolder = tempFolder.newFolder()
    val reactNativeDir = tempFolder.newFolder("react-native")
    val jscAndroidDir = tempFolder.newFolder("jsc-android")
    val repositoryURI = URI.create("file://${jscAndroidDir}/dist")
    val project = createProject(projectFolder)

    configureRepositories(project, reactNativeDir)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_containsMavenCentral() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()

    configureRepositories(project, tempFolder.root)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_containsGoogleRepo() {
    val repositoryURI = URI.create("https://dl.google.com/dl/android/maven2/")
    val project = createProject()

    configureRepositories(project, tempFolder.root)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_containsJitPack() {
    val repositoryURI = URI.create("https://www.jitpack.io")
    val project = createProject()

    configureRepositories(project, tempFolder.root)

    assertNotNull(
        project.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_withProjectPropertySet_hasHigherPriorityThanMavenCentral() {
    val localMaven = tempFolder.newFolder("m2")
    val localMavenURI = localMaven.toURI()
    val mavenCentralURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()
    project.extensions.extraProperties.set("REACT_NATIVE_MAVEN_LOCAL_REPO", localMaven.absolutePath)

    configureRepositories(project, tempFolder.root)

    val indexOfLocalRepo =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == localMavenURI
        }
    val indexOfMavenCentral =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == mavenCentralURI
        }
    assertTrue(indexOfLocalRepo < indexOfMavenCentral)
  }

  @Test
  fun configureRepositories_snapshotRepoHasHigherPriorityThanMavenCentral() {
    val repositoryURI = URI.create("https://oss.sonatype.org/content/repositories/snapshots/")
    val mavenCentralURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()

    configureRepositories(project, tempFolder.root)

    val indexOfSnapshotRepo =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == repositoryURI
        }
    val indexOfMavenCentral =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == mavenCentralURI
        }
    assertTrue(indexOfSnapshotRepo < indexOfMavenCentral)
  }

  @Test
  fun configureRepositories_appliesToAllProjects() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()

    configureRepositories(appProject, tempFolder.root)

    assertNotNull(
        appProject.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
    assertNotNull(
        libProject.repositories.firstOrNull {
          it is MavenArtifactRepository && it.url == repositoryURI
        })
  }

  @Test
  fun configureRepositories_withPreviousExclusionRulesOnMavenCentral_appliesCorrectly() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()

    // Let's emulate a library which set an `excludeGroup` on `com.facebook.react` for Central.
    libProject.repositories.mavenCentral { repo ->
      repo.content { content -> content.excludeGroup("com.facebook.react") }
    }

    configureRepositories(appProject, tempFolder.root)

    // We need to make sure we have Maven Central defined twice, one by the library,
    // and another is the override by RNGP.
    assertEquals(
        2,
        libProject.repositories.count { it is MavenArtifactRepository && it.url == repositoryURI })
  }

  @Test
  fun configureDependencies_withEmptyVersion_doesNothing() {
    val project = createProject()

    configureDependencies(project, "")

    assertTrue(project.configurations.first().resolutionStrategy.forcedModules.isEmpty())
  }

  @Test
  fun configureDependencies_withVersionString_appliesResolutionStrategy() {
    val project = createProject()

    configureDependencies(project, "1.2.3")

    val forcedModules = project.configurations.first().resolutionStrategy.forcedModules
    assertTrue(forcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
    assertTrue(forcedModules.any { it.toString() == "com.facebook.react:hermes-android:1.2.3" })
  }

  @Test
  fun configureDependencies_withVersionString_appliesOnAllProjects() {
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()
    appProject.plugins.apply("com.android.application")
    libProject.plugins.apply("com.android.library")

    configureDependencies(appProject, "1.2.3")

    val appForcedModules = appProject.configurations.first().resolutionStrategy.forcedModules
    val libForcedModules = libProject.configurations.first().resolutionStrategy.forcedModules
    assertTrue(appForcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
    assertTrue(appForcedModules.any { it.toString() == "com.facebook.react:hermes-android:1.2.3" })
    assertTrue(libForcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
    assertTrue(libForcedModules.any { it.toString() == "com.facebook.react:hermes-android:1.2.3" })
  }

  @Test
  fun readVersionString_withCorrectVersionString_returnsIt() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
        VERSION_NAME=1000.0.0
        ANOTHER_PROPERTY=true
      """
                  .trimIndent())
        }

    val versionString = readVersionString(propertiesFile)

    assertEquals("1000.0.0", versionString)
  }

  @Test
  fun readVersionString_withNightlyVersionString_returnsSnapshotVersion() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
        VERSION_NAME=0.0.0-20221101-2019-cfe811ab1
        ANOTHER_PROPERTY=true
      """
                  .trimIndent())
        }

    val versionString = readVersionString(propertiesFile)

    assertEquals("0.0.0-20221101-2019-cfe811ab1-SNAPSHOT", versionString)
  }

  @Test
  fun readVersionString_withMissingVersionString_returnsEmpty() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
        ANOTHER_PROPERTY=true
      """
                  .trimIndent())
        }

    val versionString = readVersionString(propertiesFile)
    assertEquals("", versionString)
  }

  @Test
  fun readVersionString_withEmptyVersionString_returnsEmpty() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
        VERSION_NAME=
        ANOTHER_PROPERTY=true
      """
                  .trimIndent())
        }

    val versionString = readVersionString(propertiesFile)
    assertEquals("", versionString)
  }

  @Test
  fun mavenRepoFromUrl_worksCorrectly() {
    val process = createProject()
    val mavenRepo = process.mavenRepoFromUrl("https://hello.world")

    assertEquals(URI.create("https://hello.world"), mavenRepo.url)
  }

  @Test
  fun mavenRepoFromURI_worksCorrectly() {
    val process = createProject()
    val repoFolder = tempFolder.newFolder("maven-repo")
    val mavenRepo = process.mavenRepoFromURI(repoFolder.toURI())

    assertEquals(repoFolder.toURI(), mavenRepo.url)
  }
}
