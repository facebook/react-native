/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.nodejsresolver

import groovy.lang.Closure
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import org.gradle.api.GradleException
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.assertThrows

class NodeJsResolverGradlePluginTest {
  private lateinit var projectDir: File
  private lateinit var resolveNodeJsPackage: Closure<*>

  @BeforeEach
  fun setup() {
    val resource = this::class.java.classLoader.getResource("package.json")
    assertNotNull(resource)
    projectDir = File(resource.toURI()).parentFile
    val project = ProjectBuilder.builder().withProjectDir(projectDir).build()
    project.plugins.apply("com.facebook.react.nodejsresolver")
    assert(project.extensions.extraProperties.has("resolveNodeJsPackage"))
    resolveNodeJsPackage =
        project.extensions.extraProperties.get("resolveNodeJsPackage") as Closure<*>
  }

  @Test
  fun `resolves top-level packages as expected, with one argument`() {
    assertEquals(resolveNodeJsPackage.call("foo"), File(projectDir, "node_modules/foo"))
    assertEquals(resolveNodeJsPackage.call("bar"), File(projectDir, "node_modules/bar"))
  }

  @Test
  fun `does not resolve an isolated package from the top level`() {
    val exception = assertThrows<GradleException> { resolveNodeJsPackage.call("baz") }
    assertEquals(
        exception.message,
        "Failed to find the package 'baz'. Ensure you have installed node_modules.")
  }

  @Test
  fun `can resolve foo's isolated dependencies when starting from foo`() {
    val fooDir = resolveNodeJsPackage.call("foo")
    assertEquals(
        resolveNodeJsPackage.call("baz", fooDir),
        File(projectDir, "node_modules/foo/node_modules/baz"))
  }

  @Test
  fun `prefers closer bar to hosted bar when starting from foo`() {
    val fooDir = resolveNodeJsPackage.call("foo")
    assertEquals(
        resolveNodeJsPackage.call("bar", fooDir),
        File(projectDir, "node_modules/foo/node_modules/bar"))
  }

  @Test
  fun `can resolve a hoisted dependency starting from foo or root`() {
    val fooDir = resolveNodeJsPackage.call("foo")
    assertEquals(resolveNodeJsPackage.call("quux"), File(projectDir, "node_modules/quux"))
    assertEquals(resolveNodeJsPackage.call("quux", fooDir), File(projectDir, "node_modules/quux"))
  }
}
