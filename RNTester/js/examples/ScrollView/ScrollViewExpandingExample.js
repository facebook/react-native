/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  View,
} = require('react-native');

const LOREM = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse laoreet lorem at molestie accumsan. Mauris blandit purus sapien, ac faucibus lorem elementum a. Fusce sed odio eget arcu varius sodales vel et elit. Etiam scelerisque nunc eu aliquet cursus. Aliquam erat volutpat. Praesent fringilla tellus at neque scelerisque, sed egestas lorem lacinia. In hac habitasse platea dictumst. Mauris sed ex ut felis ultricies scelerisque a ac erat. Suspendisse sapien mauris, sodales ac mollis ac, gravida at velit. Nam dapibus a nisl in aliquam. Quisque eu velit velit. In iaculis nisi purus, non tristique erat posuere eget. Aenean bibendum massa ac turpis scelerisque ultrices. Morbi nulla erat, commodo sit amet ultrices ac, faucibus vel mi.

Quisque turpis ex, finibus ac fermentum in, venenatis vel nisl. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec vitae blandit mi. Nullam quis dignissim ligula, sed vestibulum nibh. Fusce ligula diam, imperdiet ac est eu, consectetur laoreet risus. Sed luctus justo dui, molestie cursus quam finibus ac. Aenean nisl urna, dapibus id pellentesque vel, semper sed massa. Curabitur purus odio, facilisis in posuere eu, rutrum nec est. Sed scelerisque feugiat ante, vitae placerat nibh faucibus eget. Sed dignissim quam a turpis tincidunt bibendum egestas volutpat erat. Maecenas eleifend augue a ultricies tempus. Sed faucibus turpis id scelerisque gravida. Proin sed consequat ante, et vehicula nibh.

Vestibulum quis fermentum purus. Nunc sed sollicitudin risus. Aliquam malesuada lorem sed nibh placerat ultricies. Nam mattis nisi sit amet tortor gravida, ut condimentum justo commodo. Curabitur ac mauris ex. Maecenas in nulla ac erat cursus ultrices eu id odio. Sed aliquet lorem nunc, vitae finibus lacus aliquam vel. Nunc et odio sit amet sem hendrerit ullamcorper nec vel odio. Sed suscipit, risus ut lobortis posuere, lacus odio ultrices orci, in luctus sem erat non odio. Mauris pretium fringilla diam a blandit. Nam ut ligula dapibus, sollicitudin magna at, malesuada leo. Vestibulum malesuada vestibulum ultricies. Curabitur varius quam ut erat venenatis pellentesque. Sed dignissim nisl eu luctus rutrum. Vestibulum vel sodales dolor, ac sagittis nunc.

Phasellus interdum arcu quis vehicula malesuada. Curabitur bibendum neque sed tincidunt feugiat. Suspendisse id lorem nibh. Sed sit amet ipsum sapien. Donec pretium neque sem, viverra feugiat diam mollis vel. Nam arcu nisl, lacinia vel mi eget, commodo eleifend tellus. Etiam pretium non lorem quis fermentum. Vivamus ut mauris vitae odio blandit elementum at rutrum mi. Vivamus id neque accumsan, mattis erat ac, rhoncus leo. Sed tristique nibh ut maximus rutrum. Nunc turpis metus, molestie sed iaculis a, dapibus et tellus. Donec malesuada ipsum sit amet nisi vehicula volutpat. Nulla facilisi. Nam a efficitur mi. Nunc lacus diam, eleifend pellentesque tincidunt et, bibendum sit amet urna.

Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer vestibulum, tellus vel rutrum lacinia, elit odio malesuada orci, id molestie felis arcu a ex. Proin eleifend bibendum massa, facilisis ultricies quam ultricies sit amet. Sed consequat imperdiet suscipit. Vestibulum rutrum est at sem sollicitudin, id volutpat enim semper. Etiam aliquet eleifend lorem ornare maximus. Morbi venenatis arcu id accumsan molestie. Morbi eu nisi lectus. Nam ac metus non odio placerat posuere. Aliquam consectetur facilisis magna. Nunc mollis mauris nulla, et sagittis erat tincidunt eu.

Nulla ut varius odio. Ut laoreet sollicitudin nunc, sit amet congue quam vehicula nec. Donec eget dictum turpis. Donec sed est luctus, consequat lorem vel, auctor leo. Proin viverra ex a velit ullamcorper, quis sollicitudin purus luctus. Proin laoreet ut lorem in cursus. Cras imperdiet turpis ut nisi pulvinar consequat. Sed turpis velit, pharetra sit amet mollis vel, imperdiet vitae enim. Phasellus eget vehicula turpis. Fusce vehicula quam non justo luctus, ut bibendum sem feugiat. Ut id egestas sem. Duis efficitur sem rutrum, mattis elit id, porta lectus. Ut eu volutpat eros. Nulla tincidunt erat ac neque porttitor blandit ut quis enim.

Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Etiam nisi nulla, ullamcorper at urna et, aliquet porttitor turpis. Ut justo nulla, elementum mattis porttitor eget, ullamcorper mollis est. Praesent quis tortor at justo pretium aliquet. Aliquam gravida magna quis ullamcorper venenatis. Etiam ac luctus turpis. Vestibulum scelerisque sem mauris, nec lacinia leo volutpat vitae. Pellentesque ut justo est. Fusce at ante laoreet, tempus tellus sit amet, dignissim felis. Phasellus vitae quam risus. Duis condimentum aliquet diam vel consequat. Fusce ut massa finibus, elementum nisi sit amet, porta arcu. Nunc eget tortor quis ante finibus viverra auctor varius sapien. Nunc facilisis cursus risus non fringilla. Praesent malesuada, augue nec tempor elementum, massa sapien pellentesque dui, et suscipit tortor neque vel purus.

Cras euismod at turpis quis maximus. Etiam fermentum eu orci ac auctor. Praesent egestas, purus in blandit tincidunt, nunc massa ornare tortor, a posuere mauris lacus ac nisi. Fusce vitae dictum nibh. Curabitur quis urna mauris. Phasellus et magna vitae felis elementum faucibus ut vitae erat. Quisque mollis vulputate vehicula.

Etiam efficitur nisi sapien, non ultricies nibh condimentum id. Vivamus in lorem semper lorem congue ultrices. Aenean gravida malesuada consequat. Donec id ultrices mauris. Donec pretium eu neque ut venenatis. Integer elementum velit vel placerat dictum. Donec hendrerit dapibus nibh, a efficitur enim sollicitudin eu. Sed et turpis interdum, auctor velit ut, efficitur ex. Etiam sed pretium dui.

Aliquam sagittis nulla ligula, quis vestibulum sapien consequat at. Maecenas non magna eu ligula interdum faucibus. Duis suscipit posuere eros volutpat hendrerit. Nullam at magna lorem. Morbi convallis sapien sit amet ipsum hendrerit ullamcorper. Phasellus in urna lacinia, feugiat augue porttitor, malesuada nunc. In ultrices aliquam arcu, non elementum nibh scelerisque at.

Proin facilisis purus sit amet augue suscipit volutpat. Sed et purus fermentum, gravida nisi a, condimentum libero. Sed leo purus, vehicula ac porta id, mattis vitae libero. Quisque maximus a risus sit amet blandit. Donec vestibulum tortor sed lectus dignissim, in dictum massa tincidunt. Pellentesque fringilla dignissim commodo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi sodales, est sit amet iaculis dapibus, neque massa laoreet magna, in suscipit elit diam at nulla.

Pellentesque ac neque orci. Proin aliquet elit dictum mauris dictum convallis. Aenean gravida ac dui sit amet dapibus. In at metus in nisl bibendum semper. Donec non congue diam. Fusce sem tortor, mattis commodo felis quis, interdum commodo justo. Vivamus convallis velit vel mauris rutrum, id pretium tellus ornare. Morbi faucibus, diam at iaculis scelerisque, metus augue mattis purus, id tincidunt odio enim nec diam. Pellentesque nec lorem pharetra, vestibulum libero et, porta sapien. Nulla accumsan pharetra viverra. Vestibulum ac gravida risus, ac rutrum ante. Integer nisl libero, mollis nec cursus vitae, tincidunt quis lorem. Vestibulum efficitur nisi vel mauris venenatis bibendum. Curabitur elementum, tellus at placerat dictum, neque felis condimentum elit, ac efficitur velit urna eu nisl. Maecenas sed nisi risus.

Quisque pharetra libero ut nisi ultricies, nec tempus mauris rhoncus. Proin eget sem libero. Nullam lacinia nisl sed nulla dapibus pulvinar. Ut varius iaculis turpis, non varius magna consequat quis. Integer eu nisl erat. Praesent pulvinar fringilla porttitor. Vestibulum fringilla laoreet augue, et elementum massa cursus quis. Suspendisse eros purus, eleifend in magna sit amet, gravida porttitor ligula. Sed id mattis justo. Aenean accumsan, dolor eu auctor cursus, lacus nulla ultricies ex, aliquam varius dui quam ac enim. Donec non consequat mauris, vel elementum augue. Vestibulum magna metus, euismod sollicitudin sem et, commodo consectetur dui. Aliquam dapibus tristique dolor nec ultricies. Morbi id nunc finibus, consequat ante eu, blandit justo. Nullam volutpat finibus felis, non semper nunc faucibus eget. Curabitur luctus, quam a egestas ullamcorper, nibh dui pulvinar tortor, sed aliquam turpis lacus nec orci.

Suspendisse et tempor turpis, sed pulvinar metus. Fusce condimentum, felis non eleifend ullamcorper, enim mi dapibus orci, eu gravida felis est in justo. Nunc in pulvinar nulla, at mattis enim. Pellentesque pellentesque posuere velit sit amet laoreet. Aliquam erat volutpat. Mauris dapibus odio ac enim consequat, a facilisis tortor fringilla. Vivamus blandit, neque a faucibus placerat, est orci suscipit quam, ut convallis nibh velit sit amet sem. Integer quis iaculis erat.

Mauris mattis tempus purus, quis venenatis erat imperdiet in. Donec est odio, tristique vel pharetra eget, sagittis at eros. Donec aliquam ultrices ligula, convallis malesuada sapien feugiat tincidunt. Aliquam iaculis eros nec lacus malesuada euismod. Duis euismod urna rhoncus, tincidunt nisl et, pretium metus. Integer nec sem odio. Cras mattis ullamcorper libero vitae facilisis. Nullam a blandit elit, a congue nisi. Etiam interdum maximus interdum. Vivamus bibendum tellus sodales tellus efficitur, at gravida urna placerat. Phasellus eget tempus orci. Donec eget risus dignissim, rutrum nulla nec, ultricies tellus. Vivamus vitae commodo arcu.

Aliquam erat volutpat. Integer porttitor tortor feugiat imperdiet luctus. Curabitur et viverra justo. Suspendisse vehicula mauris eget augue tempor, in tempor libero tristique. Sed quis justo scelerisque, faucibus tortor vel, eleifend libero. Nulla ultricies fermentum mauris, a tempor mauris consectetur eu. Phasellus felis odio, mollis eu semper viverra, scelerisque nec tortor. Cras in metus sed est tincidunt faucibus a vel lectus. Aenean placerat sit amet orci vel elementum. Nunc auctor nisi ullamcorper malesuada egestas. Phasellus pulvinar facilisis aliquet.

Sed vel libero maximus, ullamcorper nulla a, venenatis ligula. Donec at egestas ipsum, vel commodo urna. Maecenas sit amet sapien odio. Vivamus tempus sem quis massa dignissim vehicula. Aliquam nec sapien eget lectus elementum ornare. Integer imperdiet eu dolor aliquam tincidunt. Proin velit arcu, imperdiet nec finibus quis, fermentum id odio. Sed eget velit ipsum. Nunc sed pretium nisl. Vivamus nibh purus, interdum in metus eget, tristique porttitor sapien. Vivamus laoreet rhoncus odio, ac feugiat velit hendrerit id. Ut vitae faucibus augue, volutpat lobortis urna. Sed molestie nisi non lorem molestie bibendum.

Mauris vulputate metus venenatis, finibus augue vel, elementum neque. Donec laoreet, nunc sit amet elementum facilisis, ex mi porta erat, non venenatis nibh lectus eu nulla. Etiam euismod, dolor quis vulputate pulvinar, mi magna pretium tellus, eu interdum est ante eget leo. Aenean egestas mi viverra accumsan pharetra. Nullam aliquam eros consectetur ornare varius. Nam porttitor lacus dolor, a lobortis mauris porta ultrices. Suspendisse potenti.

Fusce pretium, libero ac dapibus sollicitudin, enim arcu interdum libero, suscipit euismod velit lectus tempor arcu. Sed venenatis lorem et nulla pretium, et ullamcorper sapien malesuada. Mauris ut dictum orci. Morbi eu lectus faucibus, rutrum dui nec, scelerisque ex. Donec vitae erat metus. Aliquam turpis diam, sodales nec commodo pretium, ornare nec metus. Proin elementum, est efficitur malesuada viverra, odio dui luctus orci, a elementum tortor enim quis arcu. Nullam molestie libero ac accumsan auctor. Aliquam consequat odio pretium orci ultricies, a ullamcorper tellus bibendum. Etiam tortor quam, fringilla nec lacus et, tincidunt ultrices mauris. Morbi lacus felis, pellentesque aliquam nisl ut, imperdiet congue lectus. Aliquam non scelerisque enim, vitae tincidunt nulla. Integer odio nisl, viverra sit amet malesuada nec, consectetur consequat turpis.

Maecenas quis turpis vehicula, efficitur lorem eu, tempor lectus. Suspendisse porttitor ex vel nunc imperdiet iaculis. Maecenas dictum vel nisl ac ultricies. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam ac lectus porttitor, posuere nisi sed, ultricies est. Curabitur ullamcorper, dui ut vestibulum rhoncus, nibh velit pulvinar eros, vel bibendum felis quam id nibh. Integer ut purus cursus quam molestie pulvinar. Phasellus dictum nisi eu augue molestie commodo.
`;

type Props = $ReadOnly<{||}>;
type State = {
  count: number,
  horizontal: boolean,
  isExpanded: { [key: number]: boolean },
  maintainVisibleContentPosition?: { minIndexForVisible: number } | null
};

class ScrollViewExpandingExample extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      count: 20,
      isExpanded: {},
      horizontal: false,
      maintainVisibleContentPosition: null
    };
  }

  makeItems: (nItems: number, styles: any) => Array<any> = (
    nItems: number,
    styles,
  ): Array<any> => {
    const items = [];
    for (let i = 0; i < nItems; i++) {
      const onPress = () => {
        this.state.isExpanded[i] = !this.state.isExpanded[i];
        this.setState(this.state);
      };

      const onLongPress = () => {
        this.state.count = this.state.count + 100;
        this.setState(this.state);
      };

      items[i] = (
        <TouchableOpacity
          key={i}
          style={styles}
          onPress={onPress}
          onLongPress={onLongPress}>
          <Text>{this.state.isExpanded[i] ? LOREM : `Item ${i}`}</Text>
        </TouchableOpacity>
      );
    }
    return items;
  };

  render(): React.Node {
    // One of the items is a horizontal scroll view
    const items = this.makeItems(this.state.count, styles.itemWrapper);

    const onMaintainVisibleContentPositionSwitchChange = () => {
      this.state.maintainVisibleContentPosition = this.state
        .maintainVisibleContentPosition
        ? null
        : {minIndexForVisible: 0};
      this.setState(this.state);
    };

    const onHorizontalSwitchChange = () => {
      this.state.horizontal = !this.state.horizontal;
      this.setState(this.state);
    };

    return (
      <>
        <View style={{flexDirection: 'row'}}>
          <Text>Maintain visible content position (index: 0)</Text>
          <Switch
            value={this.state.maintainVisibleContentPosition != null}
            onValueChange={onMaintainVisibleContentPositionSwitchChange}
          />
        </View>
        <View style={{flexDirection: 'row'}}>
          <Text>Horizontal ScrollView?</Text>
          <Switch
            value={this.state.horizontal}
            onValueChange={onHorizontalSwitchChange}
          />
        </View>
        <ScrollView
          horizontal={this.state.horizontal}
          maintainVisibleContentPosition={
            this.state.maintainVisibleContentPosition
          }
          style={styles.verticalScrollView}>
          {items}
        </ScrollView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  verticalScrollView: {
    margin: 10,
  },
  itemWrapper: {
    backgroundColor: '#dddddd',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 5,
    borderColor: '#a52a2a',
    padding: 30,
    margin: 5,
  },
  horizontalItemWrapper: {
    padding: 50,
  },
  horizontalPagingItemWrapper: {
    width: 200,
  },
});

exports.title = '<ScrollViewExpandingExample>';
exports.description =
  'Component that enables keeps scroll position through layout changes.';
exports.simpleExampleContainer = true;
exports.examples = [
  {
    title: 'Expandable scroll view',
    render: function(): React.Element<typeof ScrollViewExpandingExample> {
      return <ScrollViewExpandingExample />;
    },
  },
];
