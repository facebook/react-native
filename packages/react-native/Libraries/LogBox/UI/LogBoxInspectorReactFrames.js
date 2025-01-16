/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type LogBoxLog from '../Data/LogBoxLog';

import View from '../../Components/View/View';
import openFileInEditor from '../../Core/Devtools/openFileInEditor';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import Platform from '../../Utilities/Platform';
import LogBoxButton from './LogBoxButton';
import LogBoxInspectorSection from './LogBoxInspectorSection';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

type Props = $ReadOnly<{
  log: LogBoxLog,
}>;

const BEFORE_SLASH_RE = /^(.*)[\\/]/;

// Taken from React https://github.com/facebook/react/blob/206d61f72214e8ae5b935f0bf8628491cb7f0797/packages/react-devtools-shared/src/backend/describeComponentFrame.js#L27-L41
function getPrettyFileName(path: string) {
  let fileName = path.replace(BEFORE_SLASH_RE, '');

  // In DEV, include code for a common special case:
  // prefer "folder/index.js" instead of just "index.js".
  if (/^index\./.test(fileName)) {
    const match = path.match(BEFORE_SLASH_RE);
    if (match) {
      const pathBeforeSlash = match[1];
      if (pathBeforeSlash) {
        const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
        // Note the below string contains a zero width space after the "/" character.
        // This is to prevent browsers like Chrome from formatting the file name as a link.
        // (Since this is a source link, it would not work to open the source file anyway.)
        fileName = folderName + '/​' + fileName;
      }
    }
  }

  return fileName;
}
function LogBoxInspectorReactFrames(props: Props): React.Node {
  const [collapsed, setCollapsed] = React.useState(true);
  if (
    props.log.getAvailableComponentStack() == null ||
    props.log.getAvailableComponentStack().length < 1
  ) {
    return null;
  }

  function getStackList() {
    if (collapsed) {
      return props.log.getAvailableComponentStack().slice(0, 3);
    } else {
      return props.log.getAvailableComponentStack();
    }
  }

  function getCollapseMessage() {
    if (props.log.getAvailableComponentStack().length <= 3) {
      return;
    }

    const count = props.log.getAvailableComponentStack().length - 3;
    if (collapsed) {
      return `See ${count} more components`;
    } else {
      return `Collapse ${count} components`;
    }
  }

  return (
    <LogBoxInspectorSection heading="Component Stack">
      {getStackList().map((frame, index) => (
        <View
          // Unfortunately we don't have a unique identifier for stack traces.
          key={index}
          style={componentStyles.frameContainer}>
          <LogBoxButton
            backgroundColor={{
              default: 'transparent',
              pressed: LogBoxStyle.getBackgroundColor(1),
            }}
            onPress={
              // Older versions of DevTools do not provide full path.
              // This will not work on Windows, remove check once the
              // DevTools return the full file path.
              frame.fileName.startsWith('/')
                ? () =>
                    openFileInEditor(frame.fileName, frame.location?.row ?? 1)
                : null
            }
            style={componentStyles.frame}>
            <View style={componentStyles.component}>
              <Text style={componentStyles.frameName}>
                <Text style={componentStyles.bracket}>{'<'}</Text>
                {frame.content}
                <Text style={componentStyles.bracket}>{' />'}</Text>
              </Text>
            </View>
            <Text style={componentStyles.frameLocation}>
              {getPrettyFileName(frame.fileName)}
              {frame.location ? `:${frame.location.row}` : ''}
            </Text>
          </LogBoxButton>
        </View>
      ))}
      <View style={componentStyles.collapseContainer}>
        <LogBoxButton
          backgroundColor={{
            default: 'transparent',
            pressed: LogBoxStyle.getBackgroundColor(1),
          }}
          onPress={() => setCollapsed(!collapsed)}
          style={componentStyles.collapseButton}>
          <Text style={componentStyles.collapse}>{getCollapseMessage()}</Text>
        </LogBoxButton>
      </View>
    </LogBoxInspectorSection>
  );
}

const componentStyles = StyleSheet.create({
  collapseContainer: {
    marginLeft: 15,
    flexDirection: 'row',
  },
  collapseButton: {
    borderRadius: 5,
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  frameContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  frame: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  component: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  frameName: {
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  bracket: {
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
    color: LogBoxStyle.getTextColor(0.4),
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  frameLocation: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10,
  },
});

export default LogBoxInspectorReactFrames;
