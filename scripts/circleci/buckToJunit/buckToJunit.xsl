<?xml version="1.0"?>
<!--
Copyright (C) 2015 The Android Open Source Project
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:func="com.google.gerrit" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="func" version="2.0">
  <xsl:output method="xml" omit-xml-declaration="no" indent="yes" encoding="UTF-8"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="/tests">
    <xsl:result-document method="xml">
    <testsuites>
      <xsl:apply-templates/>
    </testsuites>
    </xsl:result-document>
  </xsl:template>

  <xsl:template match="test">
      <xsl:variable name="testCount" select="count(testresult)"/>
      <xsl:variable name="nonEmptyStacks" select="count(testresult[stacktrace != ''])"/>
      <xsl:variable name="failures"
          select="count(testresult[contains(stacktrace, 'java.lang.AssertionError')])"/>
      <xsl:variable name="errors" select="$nonEmptyStacks - $failures"/>
      <testsuite failures="{$failures}" time="{func:toMS(@time)}" errors="{$errors}" skipped="0"
          tests="{$testCount}" name="{@name}">
        <xsl:apply-templates/>
      </testsuite>
  </xsl:template>

  <xsl:template match="testresult">
    <testcase time="{func:toMS(@time)}" classname="{../@name}" name="{@name}">
      <xsl:apply-templates/>
    </testcase>
  </xsl:template>

  <xsl:template match="message"/>

  <xsl:template match="stacktrace[. != '']">
    <failure message="{../message}" type="{substring-before(., ':')}">
      <xsl:value-of select="."/>
    </failure>
  </xsl:template>

  <xsl:function name="func:toMS">
    <xsl:param name="sec" as="xs:decimal"/>
    <xsl:value-of select="$sec div 1000"/>
  </xsl:function>
</xsl:stylesheet>