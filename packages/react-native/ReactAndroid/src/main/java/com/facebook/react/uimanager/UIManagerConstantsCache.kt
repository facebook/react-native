/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.facebook.common.logging.FLog
import com.facebook.react.BuildConfig
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.Future
import org.json.JSONArray
import org.json.JSONObject

internal object UIManagerConstantsCache {
  private const val TAG = "UIManagerConstantsCache"
  private const val CACHE_SCHEMA_VERSION = 3
  private const val CACHE_FILE_NAME = "uimanager_constants_cache_v3.json"

  private val cacheExecutor: ExecutorService =
      Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "UIManagerConstantsCache").apply { isDaemon = true }
      }
  private val preloadLock = Any()
  @Volatile private var preloadFuture: Future<PreparedCache?>? = null

  @JvmStatic
  fun maybePreload(context: Context) {
    if (!isCachingEnabled()) {
      return
    }
    ensurePreload(context.applicationContext)
  }

  fun getCachedConstants(
      context: Context,
      customDirectEvents: MutableMap<String, Any>,
      bundleSourceUrl: String?,
  ): NativeMap? {
    val prepared = awaitPreload(context.applicationContext) ?: return null
    val currentIdentity =
        createCacheIdentity(context.applicationContext, bundleSourceUrl) ?: return null
    if (prepared.cacheIdentity != currentIdentity) {
      return null
    }
    prepared.customDirectEvents.forEach { (name, value) -> customDirectEvents[name] = value }
    return prepared.constantsNativeMap
  }

  fun getCachedConstantsForViewManager(
      context: Context,
      viewManagerName: String,
      customDirectEvents: MutableMap<String, Any>,
      bundleSourceUrl: String?,
  ): NativeMap? {
    val prepared = awaitPreload(context.applicationContext) ?: return null
    val currentIdentity =
        createCacheIdentity(context.applicationContext, bundleSourceUrl) ?: return null
    if (prepared.cacheIdentity != currentIdentity) {
      return null
    }
    prepared.customDirectEvents.forEach { (name, value) -> customDirectEvents[name] = value }
    return prepared.lazyViewManagerNativeMaps[viewManagerName]
  }

  fun saveConstants(
      context: Context,
      constants: Map<String, Any?>,
      customDirectEvents: Map<String, Any?>,
      bundleSourceUrl: String?,
  ) {
    if (!isCachingEnabled()) {
      return
    }
    val appContext = context.applicationContext
    val cacheIdentity = createCacheIdentity(appContext, bundleSourceUrl) ?: return
    val constantsCopy = deepCopyMap(constants)
    val eventsCopy = deepCopyMap(customDirectEvents)

    maybePreload(appContext)
    cacheExecutor.execute {
      runCatching {
        val cacheDocument = readCacheDocument(appContext) ?: CacheDocument()
        cacheDocument.cacheIdentity = cacheIdentity
        cacheDocument.constants = constantsCopy
        cacheDocument.customDirectEvents.clear()
        cacheDocument.customDirectEvents.putAll(eventsCopy)
        writeCacheDocument(appContext, cacheDocument)
        invalidatePreload()
      }
          .onFailure { throwable ->
            FLog.w(TAG, "Unable to persist UIManager constants cache", throwable)
          }
    }
  }

  fun saveConstantsForViewManager(
      context: Context,
      viewManagerName: String,
      constants: Map<String, Any?>,
      customDirectEvents: Map<String, Any?>,
      bundleSourceUrl: String?,
  ) {
    if (!isCachingEnabled()) {
      return
    }
    val appContext = context.applicationContext
    val cacheIdentity = createCacheIdentity(appContext, bundleSourceUrl) ?: return
    val constantsCopy = deepCopyMap(constants)
    val eventsCopy = deepCopyMap(customDirectEvents)

    maybePreload(appContext)
    cacheExecutor.execute {
      runCatching {
        val cacheDocument = readCacheDocument(appContext) ?: CacheDocument()
        cacheDocument.cacheIdentity = cacheIdentity
        cacheDocument.lazyViewManagerConstants[viewManagerName] = constantsCopy
        cacheDocument.customDirectEvents.putAll(eventsCopy)
        writeCacheDocument(appContext, cacheDocument)
        invalidatePreload()
      }
          .onFailure { throwable ->
            FLog.w(TAG, "Unable to persist lazy ViewManager constants cache", throwable)
          }
    }
  }

  private fun ensurePreload(context: Context): Future<PreparedCache?> {
    synchronized(preloadLock) {
      preloadFuture?.let { return it }
      val future = cacheExecutor.submit<PreparedCache?> { loadPreparedCache(context) }
      preloadFuture = future
      return future
    }
  }

  private fun awaitPreload(context: Context): PreparedCache? =
      runCatching { ensurePreload(context).get() }
          .onFailure { throwable ->
            FLog.w(TAG, "Unable to preload UIManager constants cache", throwable)
          }
          .getOrNull()

  private fun loadPreparedCache(context: Context): PreparedCache? {
    if (!isCachingEnabled()) {
      return null
    }
    val cacheDocument = readCacheDocument(context) ?: return null
    val cacheIdentity = cacheDocument.cacheIdentity ?: return null

    val constantsNativeMap =
        runCatching { Arguments.makeNativeMap(deepCopyMap(cacheDocument.constants)) }
            .onFailure { throwable ->
              FLog.w(TAG, "Unable to prepare UIManager constants NativeMap from cache", throwable)
            }
            .getOrNull() ?: return null

    val lazyViewManagerNativeMaps = LinkedHashMap<String, NativeMap>()
    cacheDocument.lazyViewManagerConstants.forEach { (viewManagerName, constantsMap) ->
      runCatching { Arguments.makeNativeMap(deepCopyMap(constantsMap)) }
          .onSuccess { nativeMap -> lazyViewManagerNativeMaps[viewManagerName] = nativeMap }
          .onFailure { throwable ->
            FLog.w(TAG, "Unable to prepare cached constants for $viewManagerName", throwable)
          }
    }

    return PreparedCache(
        constantsNativeMap,
        cacheDocument.customDirectEvents,
        lazyViewManagerNativeMaps,
        cacheIdentity,
    )
  }

  private fun readCacheDocument(context: Context): CacheDocument? {
    val cacheFile = getCacheFile(context)
    if (!cacheFile.exists()) {
      return null
    }
    return runCatching {
          val root = JSONObject(cacheFile.readText())
          if (root.optInt("schemaVersion", -1) != CACHE_SCHEMA_VERSION) {
            return null
          }
          val cacheIdentity = CacheIdentity.fromJson(root.optJSONObject("cacheIdentity")) ?: return null
          val constants = toMap(root.optJSONObject("constants") ?: JSONObject())
          val customDirectEvents =
              LinkedHashMap(toMap(root.optJSONObject("customDirectEvents") ?: JSONObject()))
          val lazyViewManagersRoot = root.optJSONObject("lazyViewManagerConstants") ?: JSONObject()
          val lazyViewManagers = LinkedHashMap<String, Map<String, Any>>()
          lazyViewManagersRoot.keys().forEach { viewManagerName ->
            val value = lazyViewManagersRoot.optJSONObject(viewManagerName)
            if (value != null) {
              lazyViewManagers[viewManagerName] = toMap(value)
            }
          }
          CacheDocument(cacheIdentity, constants, customDirectEvents, lazyViewManagers)
        }
        .onFailure { throwable ->
          FLog.w(TAG, "Unable to read cached UIManager constants", throwable)
        }
        .getOrNull()
  }

  private fun writeCacheDocument(context: Context, cacheDocument: CacheDocument) {
    val root =
        JSONObject().apply {
          put("schemaVersion", CACHE_SCHEMA_VERSION)
          put("buildType", BuildConfig.BUILD_TYPE)
          put("cacheIdentity", cacheDocument.cacheIdentity?.toJson())
          put("constants", toJsonObject(cacheDocument.constants))
          put("customDirectEvents", toJsonObject(cacheDocument.customDirectEvents))
          val lazyViewManagers = JSONObject()
          cacheDocument.lazyViewManagerConstants.forEach { (viewManagerName, constantsMap) ->
            lazyViewManagers.put(viewManagerName, toJsonObject(constantsMap))
          }
          put("lazyViewManagerConstants", lazyViewManagers)
        }

    val cacheFile = getCacheFile(context)
    val cacheDirectory = cacheFile.parentFile
    if (cacheDirectory != null && !cacheDirectory.exists()) {
      cacheDirectory.mkdirs()
    }
    cacheFile.writeText(root.toString())
  }

  private fun getCacheFile(context: Context): File =
      File(context.filesDir, "react-native/$CACHE_FILE_NAME")

  private fun invalidatePreload() {
    synchronized(preloadLock) { preloadFuture = null }
  }

  private fun isCachingEnabled(): Boolean =
      ReactNativeFeatureFlags.useNativeViewConfigsInBridgelessMode()

  private fun createCacheIdentity(context: Context, bundleSourceUrl: String?): CacheIdentity? {
    if (bundleSourceUrl.isNullOrBlank()) {
      return null
    }

    val packageInfo = getPackageInfo(context) ?: return null
    val bundleUri = runCatching { Uri.parse(bundleSourceUrl) }.getOrNull()
    val bundleName = extractBundleName(bundleUri, bundleSourceUrl)
    val bundleFileMetadata = resolveBundleFileMetadata(bundleSourceUrl)
    val bundleVersion =
        bundleUri?.let { extractBundleVersion(it) }
            ?: bundleFileMetadata?.let { metadata -> "file:${metadata.size}:${metadata.lastModified}" }
            ?: "${packageInfo.versionName ?: "unknown"}:${packageInfo.longVersionCodeCompat}:${packageInfo.lastUpdateTime}"

    return CacheIdentity(
        packageName = context.packageName,
        appVersionName = packageInfo.versionName ?: "",
        appVersionCode = packageInfo.longVersionCodeCompat,
        appLastUpdateTime = packageInfo.lastUpdateTime,
        bundleSourceUrl = bundleSourceUrl,
        bundleName = bundleName,
        bundleVersion = bundleVersion,
        bundleFileSize = bundleFileMetadata?.size ?: -1L,
        bundleFileLastModified = bundleFileMetadata?.lastModified ?: -1L,
    )
  }

  private fun getPackageInfo(context: Context): PackageInfo? =
      runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              context.packageManager.getPackageInfo(
                  context.packageName,
                  PackageManager.PackageInfoFlags.of(0),
              )
            } else {
              @Suppress("DEPRECATION")
              context.packageManager.getPackageInfo(context.packageName, 0)
            }
          }
          .onFailure { throwable -> FLog.w(TAG, "Unable to read package info", throwable) }
          .getOrNull()

  private fun extractBundleName(bundleUri: Uri?, bundleSourceUrl: String): String =
      bundleUri?.pathSegments?.lastOrNull()
          ?: bundleUri?.lastPathSegment
          ?: File(bundleSourceUrl).name.takeIf { it.isNotBlank() }
          ?: bundleSourceUrl

  private fun extractBundleVersion(bundleUri: Uri): String? {
    val keys = arrayOf("bundleVersion", "version", "v", "rev", "revision", "hash")
    keys.forEach { key ->
      bundleUri.getQueryParameter(key)?.takeIf { it.isNotBlank() }?.let { return it }
    }
    return null
  }

  private fun resolveBundleFileMetadata(bundleSourceUrl: String?): BundleFileMetadata? {
    val bundleFile = resolveBundleFile(bundleSourceUrl) ?: return null
    if (!bundleFile.exists() || !bundleFile.isFile) {
      return null
    }
    return BundleFileMetadata(bundleFile.length(), bundleFile.lastModified())
  }

  private fun resolveBundleFile(bundleSourceUrl: String?): File? {
    if (bundleSourceUrl.isNullOrBlank()) {
      return null
    }

    val bundleUri = runCatching { Uri.parse(bundleSourceUrl) }.getOrNull()
    when (bundleUri?.scheme?.lowercase()) {
      "file" -> bundleUri.path?.let { path -> return File(path) }
      null -> {
        if (bundleSourceUrl.startsWith("/")) {
          return File(bundleSourceUrl)
        }
      }
      else -> return null
    }

    return null
  }

  private fun toJsonObject(map: Map<String, Any?>): JSONObject {
    val json = JSONObject()
    map.forEach { (key, value) -> json.put(key, toJsonValue(value)) }
    return json
  }

  private fun toJsonArray(list: List<Any?>): JSONArray {
    val array = JSONArray()
    list.forEach { value -> array.put(toJsonValue(value)) }
    return array
  }

  private fun toJsonValue(value: Any?): Any? =
      when (value) {
        null -> JSONObject.NULL
        is Map<*, *> -> {
          val map = LinkedHashMap<String, Any?>()
          value.forEach { (k, v) -> if (k is String) map[k] = v }
          toJsonObject(map)
        }
        is List<*> -> toJsonArray(value)
        is Boolean, is Int, is Long, is Double, is Float, is String -> value
        else -> value.toString()
      }

  private fun toMap(jsonObject: JSONObject): Map<String, Any> {
    val map = LinkedHashMap<String, Any>()
    jsonObject.keys().forEach { key ->
      val value = fromJsonValue(jsonObject.opt(key))
      if (value != null) {
        map[key] = value
      }
    }
    return map
  }

  private fun toList(jsonArray: JSONArray): List<Any> {
    val list = ArrayList<Any>(jsonArray.length())
    for (index in 0 until jsonArray.length()) {
      val value = fromJsonValue(jsonArray.opt(index))
      if (value != null) {
        list.add(value)
      }
    }
    return list
  }

  private fun fromJsonValue(value: Any?): Any? =
      when (value) {
        null, JSONObject.NULL -> null
        is JSONObject -> toMap(value)
        is JSONArray -> toList(value)
        else -> value
      }

  @Suppress("UNCHECKED_CAST")
  private fun deepCopyValue(value: Any?): Any? =
      when (value) {
        is Map<*, *> -> {
          val map = LinkedHashMap<String, Any>()
          value.forEach { (key, item) ->
            if (key is String) {
              val copied = deepCopyValue(item)
              if (copied != null) {
                map[key] = copied
              }
            }
          }
          map
        }
        is List<*> -> value.mapNotNull { item -> deepCopyValue(item) }
        is String, is Boolean, is Int, is Long, is Double, is Float -> value
        null -> null
        else -> value.toString()
      }

  private fun deepCopyMap(source: Map<String, Any?>): Map<String, Any> {
    val map = LinkedHashMap<String, Any>(source.size)
    source.forEach { (key, value) ->
      val copied = deepCopyValue(value)
      if (copied != null) {
        map[key] = copied
      }
    }
    return map
  }

  private data class PreparedCache(
      val constantsNativeMap: NativeMap,
      val customDirectEvents: Map<String, Any>,
      val lazyViewManagerNativeMaps: Map<String, NativeMap>,
      val cacheIdentity: CacheIdentity,
  )

  private data class CacheDocument(
      var cacheIdentity: CacheIdentity? = null,
      var constants: Map<String, Any> = emptyMap(),
      val customDirectEvents: MutableMap<String, Any> = LinkedHashMap(),
      val lazyViewManagerConstants: MutableMap<String, Map<String, Any>> = LinkedHashMap(),
  )

  private data class CacheIdentity(
      val packageName: String,
      val appVersionName: String,
      val appVersionCode: Long,
      val appLastUpdateTime: Long,
      val bundleSourceUrl: String,
      val bundleName: String,
      val bundleVersion: String,
      val bundleFileSize: Long,
      val bundleFileLastModified: Long,
  ) {
    fun toJson(): JSONObject =
        JSONObject().apply {
          put("packageName", packageName)
          put("appVersionName", appVersionName)
          put("appVersionCode", appVersionCode)
          put("appLastUpdateTime", appLastUpdateTime)
          put("bundleSourceUrl", bundleSourceUrl)
          put("bundleName", bundleName)
          put("bundleVersion", bundleVersion)
          put("bundleFileSize", bundleFileSize)
          put("bundleFileLastModified", bundleFileLastModified)
        }

    companion object {
      fun fromJson(jsonObject: JSONObject?): CacheIdentity? {
        if (jsonObject == null) {
          return null
        }

        val packageName = jsonObject.optString("packageName", "")
        val appVersionName = jsonObject.optString("appVersionName", "")
        val appVersionCode = jsonObject.optLong("appVersionCode", -1)
        val appLastUpdateTime = jsonObject.optLong("appLastUpdateTime", -1)
        val bundleSourceUrl = jsonObject.optString("bundleSourceUrl", "")
        val bundleName = jsonObject.optString("bundleName", "")
        val bundleVersion = jsonObject.optString("bundleVersion", "")
        val bundleFileSize = jsonObject.optLong("bundleFileSize", -1)
        val bundleFileLastModified = jsonObject.optLong("bundleFileLastModified", -1)

        if (
            packageName.isEmpty() ||
                appVersionCode < 0 ||
                appLastUpdateTime < 0 ||
                bundleSourceUrl.isEmpty() ||
                bundleName.isEmpty() ||
                bundleVersion.isEmpty() ||
                bundleFileSize < -1 ||
                bundleFileLastModified < -1
        ) {
          return null
        }

        return CacheIdentity(
            packageName = packageName,
            appVersionName = appVersionName,
            appVersionCode = appVersionCode,
            appLastUpdateTime = appLastUpdateTime,
            bundleSourceUrl = bundleSourceUrl,
            bundleName = bundleName,
            bundleVersion = bundleVersion,
            bundleFileSize = bundleFileSize,
            bundleFileLastModified = bundleFileLastModified,
        )
      }
    }
  }

  private data class BundleFileMetadata(val size: Long, val lastModified: Long)

  @get:Suppress("DEPRECATION")
  private val PackageInfo.longVersionCodeCompat: Long
    get() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          longVersionCode
        } else {
          versionCode.toLong()
        }
}
