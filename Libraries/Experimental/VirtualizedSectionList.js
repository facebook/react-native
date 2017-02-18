/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule VirtualizedSectionList
 * @flow
 */
'use strict';

const React = require('React');
const View = require('View');
const VirtualizedList = require('VirtualizedList');

const invariant = require('invariant');
const warning = require('warning');

import type {Viewable} from 'ViewabilityHelper';

type Item = any;
type SectionItem = any;

type Section = {
  // Must be provided directly on each section.
  data: Array<SectionItem>,
  key: string,

  // Optional props will override list-wide props just for this section.
  ItemComponent?: ?ReactClass<{item: SectionItem, index: number}>,
  SeparatorComponent?: ?ReactClass<*>,
  keyExtractor?: (item: SectionItem) => string,

  // TODO: support more optional/override props
  // FooterComponent?: ?ReactClass<*>,
  // HeaderComponent?: ?ReactClass<*>,
  // onViewableItemsChanged?: ({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,

  // TODO: support recursive sections
  // SectionHeaderComponent?: ?ReactClass<{section: Section}>,
  // sections?: ?Array<Section>;
}

type RequiredProps = {
  sections: Array<Section>,
};
type OptionalProps = {
  ItemComponent?: ?ReactClass<{item: Item, index: number}>,
  SectionHeaderComponent?: ?ReactClass<{section: Section}>,
  SectionSeparatorComponent?: ?ReactClass<*>,
  SeparatorComponent?: ?ReactClass<*>,
  /**
   * Warning: Virtualization can drastically improve memory consumption for long lists, but trashes
   * the state of items when they scroll out of the render window, so make sure all relavent data is
   * stored outside of the recursive `ItemComponent` instance tree.
   */
  enableVirtualization?: ?boolean,
  horizontal?: ?boolean,
  keyExtractor?: (item: Item, index: number) => string,
  onEndReached?: ({distanceFromEnd: number}) => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop. Called for all items from all sections.
   */
  onViewableItemsChanged?: ({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,
};
type Props = RequiredProps & OptionalProps;

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList extends React.PureComponent {
  props: Props;

  state: {
    childProps: Object,
  };

  static defaultProps: OptionalProps = {
    keyExtractor: (item: Item, index: number) => item.key || String(index),
  };

  _keyExtractor = (item: Item, index: number) => {
    const info = this._subExtractor(index);
    return info && info.key;
  };

  _subExtractor(
    index: number,
  ): ?{
    section: Section,
    key: string, // Key of the section or combined key for section + item
    index: ?number, // Relative index within the section
  } {
    let itemIndex = index;
    const defaultKeyExtractor = this.props.keyExtractor;
    for (let ii = 0; ii < this.props.sections.length; ii++) {
      const section = this.props.sections[ii];
      const keyExtractor = section.keyExtractor || defaultKeyExtractor;
      const key = keyExtractor(section, ii);
      itemIndex -= 1; // The section itself is an item
      if (itemIndex >= section.data.length) {
        itemIndex -= section.data.length;
      } else if (itemIndex === -1) {
        return {section, key, index: null};
      } else {
        return {
          section,
          key: key + ':' + keyExtractor(section.data[itemIndex], itemIndex),
          index: itemIndex,
        };
      }
    }
  }

  _convertViewable = (viewable: Viewable): ?Viewable => {
    invariant(viewable.index != null, 'Received a broken Viewable');
    const info = this._subExtractor(viewable.index);
    if (!info) {
      return null;
    }
    const keyExtractor = info.section.keyExtractor || this.props.keyExtractor;
    return {
      ...viewable,
      index: info.index,
      key: keyExtractor(viewable.item, info.index),
      section: info.section,
    };
  };

  _onViewableItemsChanged = (
    {viewableItems, changed}: {viewableItems: Array<Viewable>, changed: Array<Viewable>}
  ) => {
    if (this.props.onViewableItemsChanged) {
      this.props.onViewableItemsChanged({
        viewableItems: viewableItems.map(this._convertViewable, this).filter(Boolean),
        changed: changed.map(this._convertViewable, this).filter(Boolean),
      });
    }
  }

  _isItemSticky = (item, index) => {
    const info = this._subExtractor(index);
    return info && info.index == null;
  };

  _renderItem = ({item, index}: {item: Item, index: number}) => {
    const info = this._subExtractor(index);
    if (!info) {
      return null;
    } else if (info.index == null) {
      return <this.props.SectionHeaderComponent section={info.section} />;
    } else {
      const ItemComponent = info.section.ItemComponent || this.props.ItemComponent;
      const SeparatorComponent = info.section.SeparatorComponent || this.props.SeparatorComponent;
      const {SectionSeparatorComponent} = this.props;
      const [shouldRenderSectionSeparator, shouldRenderItemSeparator] =
        this._shouldRenderSeparators(index, info);
      return (
        <View>
          <ItemComponent item={item} index={info.index} />
          {shouldRenderItemSeparator ? <SeparatorComponent /> : null}
          {shouldRenderSectionSeparator ? <SectionSeparatorComponent /> : null}
        </View>
      );
    }
  };

  _shouldRenderSeparators(index: number, info?: ?Object): [boolean, boolean] {
    info = info || this._subExtractor(index);
    if (!info) {
      return [false, false];
    }
    const SeparatorComponent = info.section.SeparatorComponent || this.props.SeparatorComponent;
    const {SectionSeparatorComponent} = this.props;
    const lastItemIndex = this.state.childProps.getItemCount() - 1;
    let shouldRenderSectionSeparator = false;
    if (SectionSeparatorComponent) {
      shouldRenderSectionSeparator =
        info.index === info.section.data.length - 1 && index < lastItemIndex;
    }
    const shouldRenderItemSeparator = SeparatorComponent && !shouldRenderSectionSeparator &&
      index < lastItemIndex;
    return [shouldRenderSectionSeparator, shouldRenderItemSeparator];
  }

  _shouldItemUpdate = (prev, next) => {
    const {shouldItemUpdate} = this.props;
    if (!shouldItemUpdate || shouldItemUpdate(prev, next)) {
      return true;
    }
    if (prev.index !== next.index) {
      const [secSepPrev, itSepPrev] = this._shouldRenderSeparators(prev.index);
      const [secSepNext, itSepNext] = this._shouldRenderSeparators(next.index);
      if (secSepPrev !== secSepNext || itSepPrev !== itSepNext) {
        return true;
      }
    }
  }

  _computeState(props: Props) {
    const itemCount = props.sections.reduce((v, section) => v + section.data.length + 1, 0);
    return {
      childProps: {
        ...props,
        ItemComponent: this._renderItem,
        SeparatorComponent: undefined, // Rendered with ItemComponent
        data: props.sections,
        getItemCount: () => itemCount,
        getItem,
        isItemSticky: this._isItemSticky,
        keyExtractor: this._keyExtractor,
        onViewableItemsChanged:
          props.onViewableItemsChanged ? this._onViewableItemsChanged : undefined,
        shouldItemUpdate: this._shouldItemUpdate,
      },
    };
  }

  constructor(props: Props, context: Object) {
    super(props, context);
    warning(
      !props.stickySectionHeadersEnabled,
      'VirtualizedSectionList: Sticky headers only supported with legacyImplementation for now.'
    );
    this.state = this._computeState(props);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState(this._computeState(nextProps));
  }

  render() {
    return <VirtualizedList {...this.state.childProps} />;
  }
}

function getItem(sections: ?Array<Item>, index: number): ?Item {
  if (!sections) {
    return null;
  }
  let itemIdx = index - 1;
  for (let ii = 0; ii < sections.length; ii++) {
    if (itemIdx === -1) {
      return sections[ii]; // The section itself is the item
    } else if (itemIdx < sections[ii].data.length) {
      return sections[ii].data[itemIdx];
    } else {
      itemIdx -= (sections[ii].data.length + 1);
    }
  }
  return null;
}

module.exports = VirtualizedSectionList;
