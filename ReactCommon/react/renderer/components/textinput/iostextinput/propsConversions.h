/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iostextinput/primitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

static TextInputTraits convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    TextInputTraits const &sourceTraits,
    TextInputTraits const &defaultTraits) {
  auto traits = TextInputTraits{};

  traits.multiline = convertRawProp(
      context,
      rawProps,
      "multiline",
      sourceTraits.multiline,
      defaultTraits.multiline);
  traits.autocapitalizationType = convertRawProp(
      context,
      rawProps,
      "autoCapitalize",
      sourceTraits.autocapitalizationType,
      defaultTraits.autocapitalizationType);
  traits.autoCorrect = convertRawProp(
      context,
      rawProps,
      "autoCorrect",
      sourceTraits.autoCorrect,
      defaultTraits.autoCorrect);
  traits.contextMenuHidden = convertRawProp(
      context,
      rawProps,
      "contextMenuHidden",
      sourceTraits.contextMenuHidden,
      defaultTraits.contextMenuHidden);
  traits.editable = convertRawProp(
      context,
      rawProps,
      "editable",
      sourceTraits.editable,
      defaultTraits.editable);
  traits.enablesReturnKeyAutomatically = convertRawProp(
      context,
      rawProps,
      "enablesReturnKeyAutomatically",
      sourceTraits.enablesReturnKeyAutomatically,
      defaultTraits.enablesReturnKeyAutomatically);
  traits.keyboardAppearance = convertRawProp(
      context,
      rawProps,
      "keyboardAppearance",
      sourceTraits.keyboardAppearance,
      defaultTraits.keyboardAppearance);
  traits.spellCheck = convertRawProp(
      context,
      rawProps,
      "spellCheck",
      sourceTraits.spellCheck,
      defaultTraits.spellCheck);
  traits.caretHidden = convertRawProp(
      context,
      rawProps,
      "caretHidden",
      sourceTraits.caretHidden,
      defaultTraits.caretHidden);
  traits.clearButtonMode = convertRawProp(
      context,
      rawProps,
      "clearButtonMode",
      sourceTraits.clearButtonMode,
      defaultTraits.clearButtonMode);
  traits.scrollEnabled = convertRawProp(
      context,
      rawProps,
      "scrollEnabled",
      sourceTraits.scrollEnabled,
      defaultTraits.scrollEnabled);
  traits.secureTextEntry = convertRawProp(
      context,
      rawProps,
      "secureTextEntry",
      sourceTraits.secureTextEntry,
      defaultTraits.secureTextEntry);
  traits.blurOnSubmit = convertRawProp(
      context,
      rawProps,
      "blurOnSubmit",
      sourceTraits.blurOnSubmit,
      defaultTraits.blurOnSubmit);
  traits.clearTextOnFocus = convertRawProp(
      context,
      rawProps,
      "clearTextOnFocus",
      sourceTraits.clearTextOnFocus,
      defaultTraits.clearTextOnFocus);
  traits.keyboardType = convertRawProp(
      context,
      rawProps,
      "keyboardType",
      sourceTraits.keyboardType,
      defaultTraits.keyboardType);
  traits.showSoftInputOnFocus = convertRawProp(
      context,
      rawProps,
      "showSoftInputOnFocus",
      sourceTraits.showSoftInputOnFocus,
      defaultTraits.showSoftInputOnFocus);
  traits.returnKeyType = convertRawProp(
      context,
      rawProps,
      "returnKeyType",
      sourceTraits.returnKeyType,
      defaultTraits.returnKeyType);
  traits.selectTextOnFocus = convertRawProp(
      context,
      rawProps,
      "selectTextOnFocus",
      sourceTraits.selectTextOnFocus,
      defaultTraits.selectTextOnFocus);
  traits.textContentType = convertRawProp(
      context,
      rawProps,
      "textContentType",
      sourceTraits.textContentType,
      defaultTraits.textContentType);
  traits.passwordRules = convertRawProp(
      context,
      rawProps,
      "passwordRules",
      sourceTraits.passwordRules,
      defaultTraits.passwordRules);

  return traits;
}

} // namespace react
} // namespace facebook
