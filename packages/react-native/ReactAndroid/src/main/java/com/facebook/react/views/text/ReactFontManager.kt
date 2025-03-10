/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.content.res.AssetManager
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.os.Build
import android.util.SparseArray
import androidx.annotation.Nullable
import androidx.annotation.RequiresApi
import androidx.core.content.res.ResourcesCompat
import com.facebook.infer.annotation.Nullsafe
import androidx.arch.core.util.Function
import com.facebook.react.common.ReactConstants
import java.io.IOException
import java.util.ArrayList
import java.util.HashMap

/**
 * Responsible for loading and caching Typeface objects.
 *
 * @deprecated This class is deprecated and it will be deleted in the near future. Please use
 * [com.facebook.react.common.assets.ReactFontManager] instead.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactFontManager private constructor() {

  public companion object {
    public var createAssetTypefaceOverride: Function<CreateTypefaceObject, Typeface>? = null

    // NOTE: Indices in `EXTENSIONS` correspond to the `TypeFace` style constants.
    private val EXTENSIONS = arrayOf("", "_bold", "_italic", "_bold_italic")
    private val FILE_EXTENSIONS = arrayOf(".ttf", ".otf")
    private const val FONTS_ASSET_PATH = "fonts/"

    private var sReactFontManagerInstance: ReactFontManager? = null

    @JvmStatic
    public fun getInstance(): ReactFontManager {
      return sReactFontManagerInstance ?: ReactFontManager().also { sReactFontManagerInstance = it }
    }

    private fun createAssetTypeface(
        fontFamilyName: String,
        style: Int,
        assetManager: AssetManager
    ): Typeface {
      createAssetTypefaceOverride?.let { override ->
        return override.apply(CreateTypefaceObject(fontFamilyName, style, assetManager))
      }

      // This is the original RN logic for getting the typeface.
      val extension = EXTENSIONS[style]
      for (fileExtension in FILE_EXTENSIONS) {
        val fileName = StringBuilder()
            .append(FONTS_ASSET_PATH)
            .append(fontFamilyName)
            .append(extension)
            .append(fileExtension)
            .toString()
        try {
          return Typeface.createFromAsset(assetManager, fileName)
        } catch (e: RuntimeException) {
          // If the typeface asset does not exist, try another extension.
          continue
        }
      }
      return Typeface.create(fontFamilyName, style)
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun createAssetTypefaceWithFallbacks(
        fontFamilyNames: Array<String>,
        style: Int,
        assetManager: AssetManager
    ): Typeface {
      val fontFamilies = ArrayList<FontFamily>()

      // Iterate over the list of fontFamilyNames, constructing new FontFamily objects
      // for use in the CustomFallbackBuilder below.
      for (fontFamilyName in fontFamilyNames) {
        for (fileExtension in FILE_EXTENSIONS) {
          val fileName = StringBuilder()
              .append(FONTS_ASSET_PATH)
              .append(fontFamilyName)
              .append(fileExtension)
              .toString()
          try {
            val font = Font.Builder(assetManager, fileName).build()
            val family = FontFamily.Builder(font).build()
            fontFamilies.add(family)
          } catch (e: RuntimeException) {
            // If the typeface asset does not exist, try another extension.
            continue
          } catch (e: IOException) {
            // If the font asset does not exist, try another extension.
            continue
          }
        }
      }

      // If there's some problem constructing fonts, fall back to the default behavior.
      if (fontFamilies.isEmpty()) {
        return createAssetTypeface(fontFamilyNames[0], style, assetManager)
      }

      val fallbackBuilder = Typeface.CustomFallbackBuilder(fontFamilies[0])
      for (i in 1 until fontFamilies.size) {
        fallbackBuilder.addCustomFallback(fontFamilies[i])
      }
      return fallbackBuilder.build()
    }
  }

  private val mFontCache = HashMap<String, AssetFontFamily>()
  private val mCustomTypefaceCache = HashMap<String, Typeface>()

  public fun getTypeface(fontFamilyName: String, style: Int, assetManager: AssetManager): Typeface {
    return getTypeface(fontFamilyName, TypefaceStyle(style), assetManager)
  }

  public fun getTypeface(
      fontFamilyName: String,
      weight: Int,
      italic: Boolean,
      assetManager: AssetManager
  ): Typeface {
    return getTypeface(fontFamilyName, TypefaceStyle(weight, italic), assetManager)
  }

  public fun getTypeface(
      fontFamilyName: String,
      style: Int,
      weight: Int,
      assetManager: AssetManager
  ): Typeface {
    return getTypeface(fontFamilyName, TypefaceStyle(style, weight), assetManager)
  }

  public fun getTypeface(
      fontFamilyName: String,
      typefaceStyle: TypefaceStyle,
      assetManager: AssetManager
  ): Typeface {
    mCustomTypefaceCache[fontFamilyName]?.let { customTypeface ->
      // Apply `typefaceStyle` because custom fonts configure variants using `app:fontStyle` and
      // `app:fontWeight` in their resource XML configuration file.
      return typefaceStyle.apply(customTypeface)
    }

    var assetFontFamily = mFontCache[fontFamilyName]
    if (assetFontFamily == null) {
      assetFontFamily = AssetFontFamily()
      mFontCache[fontFamilyName] = assetFontFamily
    }

    val style = typefaceStyle.getNearestStyle()

    var assetTypeface = assetFontFamily.getTypefaceForStyle(style)
    if (assetTypeface == null) {
      assetTypeface = createAssetTypeface(fontFamilyName, style, assetManager)
      assetFontFamily.setTypefaceForStyle(style, assetTypeface)
    }
    // Do not apply `typefaceStyle` because asset font files already incorporate the style.
    return assetTypeface
  }

  /*
   * This method allows you to load custom fonts from res/font folder as provided font family name.
   * Fonts may be one of .ttf, .otf or XML (https://developer.android.com/guide/topics/ui/look-and-feel/fonts-in-xml).
   * To support multiple font styles or weights, you must provide a font in XML format.
   *
   * ReactFontManager.getInstance().addCustomFont(this, "Srisakdi", R.font.srisakdi);
   */
  public fun addCustomFont(context: Context, fontFamily: String, fontId: Int) {
    ResourcesCompat.getFont(context, fontId)?.let { font ->
      mCustomTypefaceCache[fontFamily] = font
    }
  }

  /**
   * Equivalent method to [addCustomFont] which accepts a Typeface object.
   */
  public fun addCustomFont(fontFamily: String, font: Typeface?) {
    font?.let { mCustomTypefaceCache[fontFamily] = it }
  }

  /**
   * Add additional font family, or replace the exist one in the font memory cache.
   *
   * @param style see [Typeface.DEFAULT], [Typeface.BOLD], [Typeface.ITALIC], [Typeface.BOLD_ITALIC]
   */
  public fun setTypeface(fontFamilyName: String, style: Int, typeface: Typeface?) {
    typeface?.let { font ->
      var assetFontFamily = mFontCache[fontFamilyName]
      if (assetFontFamily == null) {
        assetFontFamily = AssetFontFamily()
        mFontCache[fontFamilyName] = assetFontFamily
      }
      assetFontFamily.setTypefaceForStyle(style, font)
    }
  }

  public class TypefaceStyle {
    public companion object {
      public const val BOLD: Int = 700
      public const val NORMAL: Int = 400
      private const val MIN_WEIGHT: Int = 1
      private const val MAX_WEIGHT: Int = 1000
    }

    private val mItalic: Boolean
    private val mWeight: Int

    public constructor(weight: Int, italic: Boolean) {
      mItalic = italic
      mWeight = if (weight == ReactConstants.UNSET) NORMAL else weight
    }

    public constructor(style: Int) {
      var styleValue = if (style == ReactConstants.UNSET) Typeface.NORMAL else style

      mItalic = (styleValue and Typeface.ITALIC) != 0
      mWeight = if ((styleValue and Typeface.BOLD) != 0) BOLD else NORMAL
    }

    /**
     * If `weight` is supplied, it will be combined with the italic bit from `style`. Otherwise, any
     * existing weight bit in `style` will be used.
     */
    public constructor(style: Int, weight: Int) {
      var styleValue = if (style == ReactConstants.UNSET) Typeface.NORMAL else style

      mItalic = (styleValue and Typeface.ITALIC) != 0
      mWeight = when {
        weight != ReactConstants.UNSET -> weight
        (styleValue and Typeface.BOLD) != 0 -> BOLD
        else -> NORMAL
      }
    }

    public fun getNearestStyle(): Int {
      return if (mWeight < BOLD) {
        if (mItalic) Typeface.ITALIC else Typeface.NORMAL
      } else {
        if (mItalic) Typeface.BOLD_ITALIC else Typeface.BOLD
      }
    }

    public fun apply(typeface: Typeface): Typeface {
      return if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        Typeface.create(typeface, getNearestStyle())
      } else {
        Typeface.create(typeface, mWeight, mItalic)
      }
    }
  }

  /** Responsible for caching typefaces for each custom font family. */
  private class AssetFontFamily {
    private val mTypefaceSparseArray = SparseArray<Typeface>(4)

    fun getTypefaceForStyle(style: Int): Typeface? {
      return mTypefaceSparseArray.get(style)
    }

    fun setTypefaceForStyle(style: Int, typeface: Typeface) {
      mTypefaceSparseArray.put(style, typeface)
    }
  }
}
