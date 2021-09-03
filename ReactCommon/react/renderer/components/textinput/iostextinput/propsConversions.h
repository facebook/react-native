/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iostextinput/primitives.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

static TextInputTraits convertRawProp(
    RawProps const &rawProps,
    TextInputTraits const &sourceTraits,
    TextInputTraits const &defaultTraits) {
  auto traits = TextInputTraits{};

  traits.multiline = convertRawProp(
      rawProps, "multiline", sourceTraits.multiline, defaultTraits.multiline);
  traits.autocapitalizationType = convertRawProp(
      rawProps,
      "autoCapitalize",
      sourceTraits.autocapitalizationType,
      defaultTraits.autocapitalizationType);
  traits.autoCorrect = convertRawProp(
      rawProps,
      "autoCorrect",
      sourceTraits.autoCorrect,
      defaultTraits.autoCorrect);
  traits.contextMenuHidden = convertRawProp(
      rawProps,
      "contextMenuHidden",
      sourceTraits.contextMenuHidden,
      defaultTraits.contextMenuHidden);
  traits.editable = convertRawProp(
      rawProps, "editable", sourceTraits.editable, defaultTraits.editable);
  traits.enablesReturnKeyAutomatically = convertRawProp(
      rawProps,
      "enablesReturnKeyAutomatically",
      sourceTraits.enablesReturnKeyAutomatically,
      defaultTraits.enablesReturnKeyAutomatically);
  traits.keyboardAppearance = convertRawProp(
      rawProps,
      "keyboardAppearance",
      sourceTraits.keyboardAppearance,
      defaultTraits.keyboardAppearance);
  traits.spellCheck = convertRawProp(
      rawProps,
      "spellCheck",
      sourceTraits.spellCheck,
      defaultTraits.spellCheck);
  traits.caretHidden = convertRawProp(
      rawProps,
      "caretHidden",
      sourceTraits.caretHidden,
      defaultTraits.caretHidden);
  traits.clearButtonMode = convertRawProp(
      rawProps,
      "clearButtonMode",
      sourceTraits.clearButtonMode,
      defaultTraits.clearButtonMode);
  traits.scrollEnabled = convertRawProp(
      rawProps,
      "scrollEnabled",
      sourceTraits.scrollEnabled,
      defaultTraits.scrollEnabled);
  traits.secureTextEntry = convertRawProp(
      rawProps,
      "secureTextEntry",
      sourceTraits.secureTextEntry,
      defaultTraits.secureTextEntry);
  traits.blurOnSubmit = convertRawProp(
      rawProps,
      "blurOnSubmit",
      sourceTraits.blurOnSubmit,
      defaultTraits.blurOnSubmit);
  traits.clearTextOnFocus = convertRawProp(
      rawProps,
      "clearTextOnFocus",
      sourceTraits.clearTextOnFocus,
      defaultTraits.clearTextOnFocus);
  traits.keyboardType = convertRawProp(
      rawProps,
      "keyboardType",
      sourceTraits.keyboardType,
      defaultTraits.keyboardType);
  traits.showSoftInputOnFocus = convertRawProp(
      rawProps,
      "showSoftInputOnFocus",
      sourceTraits.showSoftInputOnFocus,
      defaultTraits.showSoftInputOnFocus);
  traits.returnKeyType = convertRawProp(
      rawProps,
      "returnKeyType",
      sourceTraits.returnKeyType,
      defaultTraits.returnKeyType);
  traits.selectTextOnFocus = convertRawProp(
      rawProps,
      "selectTextOnFocus",
      sourceTraits.selectTextOnFocus,
      defaultTraits.selectTextOnFocus);
  traits.textContentType = convertRawProp(
      rawProps,
      "textContentType",
      sourceTraits.textContentType,
      defaultTraits.textContentType);
  traits.passwordRules = convertRawProp(
      rawProps,
      "passwordRules",
      sourceTraits.passwordRules,
      defaultTraits.passwordRules);

  return traits;
}

} // namespace react
} // namespace facebook
