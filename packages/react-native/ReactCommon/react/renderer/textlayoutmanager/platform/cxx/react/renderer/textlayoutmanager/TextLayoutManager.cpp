/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#ifdef RCT_USE_PANGO

#include <pango/pango.h>
#include <pango/pangoft2.h>

#include <algorithm>
#include <cmath>
#include <string>

namespace facebook::react {

namespace {

PangoWeight toPangoWeight(std::optional<FontWeight> fontWeight) {
  if (!fontWeight.has_value()) {
    return PANGO_WEIGHT_NORMAL;
  }
  switch (fontWeight.value()) {
    case FontWeight::Weight100:
      return PANGO_WEIGHT_THIN;
    case FontWeight::Weight200:
      return PANGO_WEIGHT_ULTRALIGHT;
    case FontWeight::Weight300:
      return PANGO_WEIGHT_LIGHT;
    case FontWeight::Weight400:
      return PANGO_WEIGHT_NORMAL;
    case FontWeight::Weight500:
      return PANGO_WEIGHT_MEDIUM;
    case FontWeight::Weight600:
      return PANGO_WEIGHT_SEMIBOLD;
    case FontWeight::Weight700:
      return PANGO_WEIGHT_BOLD;
    case FontWeight::Weight800:
      return PANGO_WEIGHT_ULTRABOLD;
    case FontWeight::Weight900:
      return PANGO_WEIGHT_HEAVY;
    default:
      return PANGO_WEIGHT_NORMAL;
  }
}

PangoStyle toPangoStyle(std::optional<FontStyle> fontStyle) {
  if (!fontStyle.has_value()) {
    return PANGO_STYLE_NORMAL;
  }
  switch (fontStyle.value()) {
    case FontStyle::Normal:
      return PANGO_STYLE_NORMAL;
    case FontStyle::Italic:
      return PANGO_STYLE_ITALIC;
    case FontStyle::Oblique:
      return PANGO_STYLE_OBLIQUE;
    default:
      return PANGO_STYLE_NORMAL;
  }
}

PangoAlignment toPangoAlignment(std::optional<TextAlignment> alignment) {
  if (!alignment.has_value()) {
    return PANGO_ALIGN_LEFT;
  }
  switch (alignment.value()) {
    case TextAlignment::Natural:
    case TextAlignment::Left:
      return PANGO_ALIGN_LEFT;
    case TextAlignment::Center:
      return PANGO_ALIGN_CENTER;
    case TextAlignment::Right:
      return PANGO_ALIGN_RIGHT;
    case TextAlignment::Justified:
      return PANGO_ALIGN_LEFT;
    default:
      return PANGO_ALIGN_LEFT;
  }
}

PangoEllipsizeMode toPangoEllipsizeMode(EllipsizeMode mode) {
  switch (mode) {
    case EllipsizeMode::Clip:
      return PANGO_ELLIPSIZE_NONE;
    case EllipsizeMode::Head:
      return PANGO_ELLIPSIZE_START;
    case EllipsizeMode::Tail:
      return PANGO_ELLIPSIZE_END;
    case EllipsizeMode::Middle:
      return PANGO_ELLIPSIZE_MIDDLE;
    default:
      return PANGO_ELLIPSIZE_NONE;
  }
}

PangoFontDescription* createFontDescription(
    const TextAttributes& textAttributes) {
  auto* fontDesc = pango_font_description_new();

  if (!textAttributes.fontFamily.empty()) {
    pango_font_description_set_family(
        fontDesc, textAttributes.fontFamily.c_str());
  }

  if (!std::isnan(textAttributes.fontSize)) {
    pango_font_description_set_absolute_size(
        fontDesc, static_cast<int>(textAttributes.fontSize * PANGO_SCALE));
  } else {
    pango_font_description_set_absolute_size(fontDesc, 14 * PANGO_SCALE);
  }

  pango_font_description_set_weight(
      fontDesc, toPangoWeight(textAttributes.fontWeight));
  pango_font_description_set_style(
      fontDesc, toPangoStyle(textAttributes.fontStyle));

  return fontDesc;
}

std::string applyTextTransform(
    const std::string& text,
    std::optional<TextTransform> textTransform) {
  if (!textTransform.has_value() ||
      textTransform.value() == TextTransform::None ||
      textTransform.value() == TextTransform::Unset) {
    return text;
  }

  std::string result = text;
  switch (textTransform.value()) {
    case TextTransform::Uppercase:
      std::transform(result.begin(), result.end(), result.begin(), ::toupper);
      break;
    case TextTransform::Lowercase:
      std::transform(result.begin(), result.end(), result.begin(), ::tolower);
      break;
    case TextTransform::Capitalize:
      if (!result.empty()) {
        result[0] = static_cast<char>(::toupper(result[0]));
      }
      break;
    default:
      break;
  }
  return result;
}

struct PangoLayoutSetup {
  PangoLayout* layout;
  std::string concatenatedText;
  std::vector<int> attachmentByteOffsets;
};

PangoLayoutSetup createPangoLayout(
    PangoContext* pangoContext,
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    float maxWidth) {
  auto* layout = pango_layout_new(pangoContext);

  // Set width
  if (!std::isnan(maxWidth) && maxWidth > 0) {
    pango_layout_set_width(layout, static_cast<int>(maxWidth * PANGO_SCALE));
  }

  // Set alignment
  pango_layout_set_alignment(
      layout,
      toPangoAlignment(attributedString.getBaseTextAttributes().alignment));

  // Set ellipsize mode
  pango_layout_set_ellipsize(
      layout, toPangoEllipsizeMode(paragraphAttributes.ellipsizeMode));

  // Set max lines
  if (paragraphAttributes.maximumNumberOfLines > 0) {
    pango_layout_set_height(layout, -paragraphAttributes.maximumNumberOfLines);
  }

  // Set justify
  if (attributedString.getBaseTextAttributes().alignment.has_value() &&
      attributedString.getBaseTextAttributes().alignment.value() ==
          TextAlignment::Justified) {
    pango_layout_set_justify(layout, TRUE);
  }

  // Set default font description from base text attributes
  auto* baseFontDesc =
      createFontDescription(attributedString.getBaseTextAttributes());
  pango_layout_set_font_description(layout, baseFontDesc);
  pango_font_description_free(baseFontDesc);

  if (attributedString.isEmpty()) {
    // For empty text, just set empty text with the font description
    // already set above. pango_layout_get_size() will return {0, lineHeight}.
    pango_layout_set_text(layout, "", 0);
    return {layout, "", {}};
  }

  // Build concatenated text and attribute list from fragments
  std::string concatenatedText;
  std::vector<int> attachmentByteOffsets;
  auto* attrList = pango_attr_list_new();

  for (const auto& fragment : attributedString.getFragments()) {
    auto startByte = static_cast<int>(concatenatedText.size());

    if (fragment.isAttachment()) {
      // Use U+FFFC (OBJECT REPLACEMENT CHARACTER) for attachments
      concatenatedText += "\xEF\xBF\xBC"; // U+FFFC in UTF-8
      attachmentByteOffsets.push_back(startByte);
    } else {
      auto transformedText = applyTextTransform(
          fragment.string, fragment.textAttributes.textTransform);
      concatenatedText += transformedText;
    }

    auto endByte = static_cast<int>(concatenatedText.size());

    // Create font description for this fragment
    auto* fontDesc = createFontDescription(fragment.textAttributes);
    auto* fontAttr = pango_attr_font_desc_new(fontDesc);
    fontAttr->start_index = static_cast<guint>(startByte);
    fontAttr->end_index = static_cast<guint>(endByte);
    pango_attr_list_insert(attrList, fontAttr);
    pango_font_description_free(fontDesc);

    // Letter spacing
    if (!std::isnan(fragment.textAttributes.letterSpacing)) {
      auto* spacingAttr = pango_attr_letter_spacing_new(
          static_cast<int>(
              fragment.textAttributes.letterSpacing * PANGO_SCALE));
      spacingAttr->start_index = static_cast<guint>(startByte);
      spacingAttr->end_index = static_cast<guint>(endByte);
      pango_attr_list_insert(attrList, spacingAttr);
    }

    // Line height (as absolute height)
    if (!std::isnan(fragment.textAttributes.lineHeight)) {
      auto* lineHeightAttr = pango_attr_line_height_new_absolute(
          static_cast<int>(fragment.textAttributes.lineHeight * PANGO_SCALE));
      lineHeightAttr->start_index = static_cast<guint>(startByte);
      lineHeightAttr->end_index = static_cast<guint>(endByte);
      pango_attr_list_insert(attrList, lineHeightAttr);
    }
  }

  pango_layout_set_text(
      layout,
      concatenatedText.c_str(),
      static_cast<int>(concatenatedText.size()));
  pango_layout_set_attributes(layout, attrList);
  pango_attr_list_unref(attrList);

  return {
      layout, std::move(concatenatedText), std::move(attachmentByteOffsets)};
}

} // namespace

TextLayoutManager::TextLayoutManager(
    const std::shared_ptr<const ContextContainer>& /*contextContainer*/)
    : textMeasureCache_(kSimpleThreadSafeCacheSizeCap),
      lineMeasureCache_(kSimpleThreadSafeCacheSizeCap) {
  fontMap_ = pango_ft2_font_map_new();
  pangoContext_ = pango_font_map_create_context(fontMap_);
}

TextLayoutManager::~TextLayoutManager() {
  if (pangoContext_ != nullptr) {
    g_object_unref(pangoContext_);
  }
  if (fontMap_ != nullptr) {
    g_object_unref(fontMap_);
  }
}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
  const auto& attributedString = attributedStringBox.getValue();

  auto cacheKey = TextMeasureCacheKey{
      attributedString, paragraphAttributes, layoutConstraints};

  return textMeasureCache_.get(cacheKey, [&]() {
    std::lock_guard<std::mutex> lock(pangoMutex_);

    auto setup = createPangoLayout(
        pangoContext_,
        attributedString,
        paragraphAttributes,
        layoutConstraints.maximumSize.width);

    int pangoWidth = 0;
    int pangoHeight = 0;
    pango_layout_get_size(setup.layout, &pangoWidth, &pangoHeight);

    auto size = Size{
        static_cast<Float>(pangoWidth) / PANGO_SCALE,
        static_cast<Float>(pangoHeight) / PANGO_SCALE};

    // Build attachment frames
    TextMeasurement::Attachments attachments;
    for (size_t i = 0; i < setup.attachmentByteOffsets.size(); i++) {
      PangoRectangle cursorPos;
      pango_layout_get_cursor_pos(
          setup.layout, setup.attachmentByteOffsets[i], &cursorPos, nullptr);
      attachments.push_back(
          TextMeasurement::Attachment{
              .frame =
                  {.origin =
                       {.x = static_cast<Float>(cursorPos.x) / PANGO_SCALE,
                        .y = static_cast<Float>(cursorPos.y) / PANGO_SCALE},
                   .size = {.width = 0, .height = 0}},
              .isClipped = false});
    }

    g_object_unref(setup.layout);

    return TextMeasurement{
        .size = layoutConstraints.clamp(size),
        .attachments = std::move(attachments)};
  });
}

LinesMeasurements TextLayoutManager::measureLines(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const Size& size) const {
  const auto& attributedString = attributedStringBox.getValue();

  auto cacheKey =
      LineMeasureCacheKey{attributedString, paragraphAttributes, size};

  return lineMeasureCache_.get(cacheKey, [&]() {
    std::lock_guard<std::mutex> lock(pangoMutex_);

    auto setup = createPangoLayout(
        pangoContext_, attributedString, paragraphAttributes, size.width);

    LinesMeasurements lines;
    auto* iter = pango_layout_get_iter(setup.layout);

    do {
      auto* layoutLine = pango_layout_iter_get_line_readonly(iter);
      PangoRectangle logicalRect;
      pango_layout_iter_get_line_extents(iter, nullptr, &logicalRect);
      int baseline = pango_layout_iter_get_baseline(iter);

      Float ascender =
          static_cast<Float>(baseline - logicalRect.y) / PANGO_SCALE;
      Float descender =
          static_cast<Float>(logicalRect.y + logicalRect.height - baseline) /
          PANGO_SCALE;
      Float lineCapHeight = ascender;
      Float lineXHeight = ascender * 0.5f;

      // Get text for this line
      auto lineStartIndex = static_cast<size_t>(layoutLine->start_index);
      auto lineLength = static_cast<size_t>(layoutLine->length);
      std::string lineText;
      if (lineStartIndex < setup.concatenatedText.size()) {
        lineText = setup.concatenatedText.substr(
            lineStartIndex,
            std::min(
                lineLength, setup.concatenatedText.size() - lineStartIndex));
      }

      auto frame = Rect{
          .origin =
              {.x = static_cast<Float>(logicalRect.x) / PANGO_SCALE,
               .y = static_cast<Float>(logicalRect.y) / PANGO_SCALE},
          .size = {
              .width = static_cast<Float>(logicalRect.width) / PANGO_SCALE,
              .height = static_cast<Float>(logicalRect.height) / PANGO_SCALE}};

      lines.emplace_back(
          std::move(lineText),
          frame,
          descender,
          lineCapHeight,
          ascender,
          lineXHeight);
    } while (pango_layout_iter_next_line(iter));

    pango_layout_iter_free(iter);
    g_object_unref(setup.layout);

    return lines;
  });
}

} // namespace facebook::react

#else // !RCT_USE_PANGO

namespace facebook::react {

TextLayoutManager::TextLayoutManager(
    const std::shared_ptr<const ContextContainer>& /*contextContainer*/)
    : textMeasureCache_(kSimpleThreadSafeCacheSizeCap) {}

TextLayoutManager::~TextLayoutManager() = default;

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const TextLayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
  TextMeasurement::Attachments attachments;
  for (const auto& fragment : attributedStringBox.getValue().getFragments()) {
    if (fragment.isAttachment()) {
      attachments.push_back(
          TextMeasurement::Attachment{
              .frame =
                  {.origin = {.x = 0, .y = 0},
                   .size = {.width = 0, .height = 0}},
              .isClipped = false});
    }
  }
  return TextMeasurement{
      .size =
          {.width = layoutConstraints.minimumSize.width,
           .height = layoutConstraints.minimumSize.height},
      .attachments = attachments};
}

} // namespace facebook::react

#endif // RCT_USE_PANGO
