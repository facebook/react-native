/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputProps.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/iostextinput/propsConversions.h>
#include <react/renderer/components/textinput/baseConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

TextInputProps::TextInputProps(
    const PropsParserContext& context,
    const TextInputProps& sourceProps,
    const RawProps& rawProps)
    : BaseTextInputProps(context, sourceProps, rawProps),
      traits(convertRawProp(context, rawProps, sourceProps.traits, {})),
      selection(convertRawProp(
          context,
          rawProps,
          "selection",
          sourceProps.selection,
          std::optional<Selection>())),
      inputAccessoryViewID(convertRawProp(
          context,
          rawProps,
          "inputAccessoryViewID",
          sourceProps.inputAccessoryViewID,
          {})),
      inputAccessoryViewButtonLabel(convertRawProp(
          context,
          rawProps,
          "inputAccessoryViewButtonLabel",
          sourceProps.inputAccessoryViewButtonLabel,
          {})),
      onKeyPressSync(convertRawProp(
          context,
          rawProps,
          "onKeyPressSync",
          sourceProps.onKeyPressSync,
          {})),
      onChangeSync(convertRawProp(
          context,
          rawProps,
          "onChangeSync",
          sourceProps.onChangeSync,
          {})){};

} // namespace facebook::react
