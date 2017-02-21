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
 * @providesModule SectionList
 * @flow
 */
'use strict';

const MetroListView = require('MetroListView');
const React = require('React');
const VirtualizedSectionList = require('VirtualizedSectionList');

import type {Viewable} from 'ViewabilityHelper';

type Item = any;
type SectionItem = any;

type SectionBase = {
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
  // SectionHeaderComponent?: ?ReactClass<{section: SectionBase}>,
  // sections?: ?Array<Section>;
};

type RequiredProps<SectionT: SectionBase> = {
  sections: Array<SectionT>,
};

type OptionalProps<SectionT: SectionBase> = {
  /**
   * Rendered after the last item in the last section.
   */
  FooterComponent?: ?ReactClass<*>,
  /**
   * Default renderer for every item in every section.
   */
  ItemComponent?: ?ReactClass<{item: Item, index: number}>,
  /**
   * Rendered at the top of each section. In the future, a sticky option will be added.
   */
  SectionHeaderComponent?: ?ReactClass<{section: SectionT}>,
  /**
   * Rendered at the bottom of every Section, except the very last one, in place of the normal
   * SeparatorComponent.
   */
  SectionSeparatorComponent?: ?ReactClass<*>,
  /**
   * Rendered at the bottom of every Item except the very last one in the last section.
   */
  SeparatorComponent?: ?ReactClass<*>,
  /**
   * Warning: Virtualization can drastically improve memory consumption for long lists, but trashes
   * the state of items when they scroll out of the render window, so make sure all relavent data is
   * stored outside of the recursive `ItemComponent` instance tree.
   */
  enableVirtualization?: ?boolean,
  keyExtractor?: (item: Item) => string,
  onEndReached?: ({distanceFromEnd: number}) => void,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?Function,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?: ({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean,
  /**
   * This is an optional optimization to minimize re-rendering items.
   */
  shouldItemUpdate?: (
    prevProps: {item: Item, index: number},
    nextProps: {item: Item, index: number}
  ) => boolean,
};

type Props<SectionT> = RequiredProps<SectionT> & OptionalProps<SectionT>;

/**
 * A performant interface for rendering sectioned lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Viewability callbacks.
 *  - Footer support.
 *  - Separator support.
 *  - Heterogeneous data and item support.
 *  - Pull to Refresh.
 *
 * If you don't need section support and want a simpler interface, use FlatList.
 */
class SectionList<SectionT: SectionBase> extends React.Component<void, Props<SectionT>, void> {
  props: Props<SectionT>;

  render() {
    if (this.props.legacyImplementation) {
      return <MetroListView {...this.props} items={this.props.sections} />;
    } else {
      return <VirtualizedSectionList {...this.props} />;
    }
  }
}

module.exports = SectionList;
