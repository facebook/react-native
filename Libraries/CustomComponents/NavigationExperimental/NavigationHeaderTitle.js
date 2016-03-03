/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
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
 * @providesModule NavigationHeaderTitle
 * @flow
 */
'use strict';

const React = require('react-native');

const {
  Platform,
  StyleSheet,
  View,
  Text,
} = React;

type Props = {
  children: ReactElement;
  style: any;
  textStyle: any;
}

const NavigationHeaderTitle = ({ children, style, textStyle }: Props) => (
  <View style={[ styles.title, style ]}>
    <Text style={[ styles.titleText, textStyle ]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16
  },

  titleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, .9)',
    textAlign: Platform.OS === 'ios' ? 'center' : 'left'
  }
});

NavigationHeaderTitle.propTypes = {
  children: React.PropTypes.string.isRequired,
  style: View.propTypes.style,
  textStyle: Text.propTypes.style
};

module.exports = NavigationHeaderTitle;
