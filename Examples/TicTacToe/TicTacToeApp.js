/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @providesModule TicTacToeApp
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var Platform = require('Platform');

var {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

class Board {
  grid: Array<Array<number>>;
  turn: number;

  constructor() {
    var size = 3;
    var grid = Array(size);
    for (var i = 0; i < size; i++) {
      var row = Array(size);
      for (var j = 0; j < size; j++) {
        row[j] = 0;
      }
      grid[i] = row;
    }
    this.grid = grid;

    this.turn = 1;
  }

  mark(row: number, col: number, player: number): Board {
    this.grid[row][col] = player;
    return this;
  }

  hasMark(row: number, col: number): boolean {
    return this.grid[row][col] !== 0;
  }

  winner(): ?number {
    for (var i = 0; i < 3; i++) {
      if (this.grid[i][0] !== 0 && this.grid[i][0] === this.grid[i][1] &&
          this.grid[i][0] === this.grid[i][2]) {
        return this.grid[i][0];
      }
    }

    for (var i = 0; i < 3; i++) {
      if (this.grid[0][i] !== 0 && this.grid[0][i] === this.grid[1][i] &&
          this.grid[0][i] === this.grid[2][i]) {
        return this.grid[0][i];
      }
    }

    if (this.grid[0][0] !== 0 && this.grid[0][0] === this.grid[1][1] &&
        this.grid[0][0] === this.grid[2][2]) {
      return this.grid[0][0];
    }

    if (this.grid[0][2] !== 0 && this.grid[0][2] === this.grid[1][1] &&
        this.grid[0][2] === this.grid[2][0]) {
      return this.grid[0][2];
    }

    return null;
  }

  tie(): boolean {
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (this.grid[i][j] === 0) {
          return false;
        }
      }
    }
    return this.winner() === null;
  }
}

class Cell extends React.Component {
  cellStyle() {
    switch (this.props.player) {
      case 1:
        return styles.cellX;
      case 2:
        return styles.cellO;
      default:
        return null;
    }
  }

  textStyle() {
    switch (this.props.player) {
      case 1:
        return styles.cellTextX;
      case 2:
        return styles.cellTextO;
      default:
        return {};
    }
  }

  textContents() {
    switch (this.props.player) {
      case 1:
        return 'X';
      case 2:
        return 'O';
      default:
        return '';
    }
  }

  render() {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        underlayColor="transparent"
        activeOpacity={0.5}>
        <View style={[styles.cell, this.cellStyle()]}>
          <Text style={[styles.cellText, this.textStyle()]}>
            {this.textContents()}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

class GameEndOverlay extends React.Component {
  render() {
    var board = this.props.board;

    var tie = board.tie();
    var winner = board.winner();
    if (!winner && !tie) {
      return null;
    }

    var message;
    if (tie) {
      message = 'It\'s a tie!';
    } else {
      message = (winner === 1 ? 'X' : 'O') + ' wins!';
    }

    return (
      <View style={styles.overlay}>
        <Text style={styles.overlayMessage}>{message}</Text>
        <TouchableHighlight
          onPress={this.props.onRestart}
          underlayColor="transparent"
          activeOpacity={0.5}>
          <View style={styles.newGame}>
            <Text style={styles.newGameText}>New Game</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

var TicTacToeApp = React.createClass({
  getInitialState() {
    return { board: new Board(), player: 1 };
  },

  restartGame() {
    this.setState(this.getInitialState());
  },

  nextPlayer(): number {
    return this.state.player === 1 ? 2 : 1;
  },

  handleCellPress(row: number, col: number) {
    if (this.state.board.hasMark(row, col)) {
      return;
    }

    this.setState({
      board: this.state.board.mark(row, col, this.state.player),
      player: this.nextPlayer(),
    });
  },

  render() {
    var rows = this.state.board.grid.map((cells, row) =>
      <View key={'row' + row} style={styles.row}>
        {cells.map((player, col) =>
          <Cell
            key={'cell' + col}
            player={player}
            onPress={this.handleCellPress.bind(this, row, col)}
          />
        )}
      </View>
    );

    return (
      <View style={styles.container}>
        <Text style={styles.title}>EXTREME T3</Text>
        <View style={styles.board}>
          {rows}
        </View>
        <GameEndOverlay
          board={this.state.board}
          onRestart={this.restartGame}
        />
      </View>
    );
  }
});

var TITLE_SIZE = Platform.isTVOS ? 117 : 39;
var TITLE_FONT = Platform.isTVOS ? 'Helvetica' : 'Chalkduster';
var TITLE_MARGIN_BOTTOM = Platform.isTVOS ? 60 : 20;

var BOARD_BORDER_RADIUS = Platform.isTVOS ? 30 : 10;
var BOARD_PADDING = Platform.isTVOS ? 15 : 5;

var CELL_BORDER_RADIUS = Platform.isTVOS ? 15 : 5;
var CELL_MARGIN_SIZE = Platform.isTVOS ? 15 : 5;

var CELL_SIZE = Platform.isTVOS ? 240 : 80;
var CELL_FONT = Platform.isTVOS ? 'Helvetica-Bold' : 'AvenirNext-Bold';
var CELL_FONT_SIZE = Platform.isTVOS ? 150 : 50;

var OVERLAY_FONT = Platform.isTVOS ? 'Helvetica-Bold' : 'AvenirNext-DemiBold';
var OVERLAY_FONT_SIZE = Platform.isTVOS ? 120: 40;
var OVERLAY_MARGIN_SIZE = Platform.isTVOS ? 60 : 20;

var NEW_GAME_FONT = Platform.isTVOS ? 'Helvetica-Bold' : 'AvenirNext-DemiBold';
var NEW_GAME_FONT_SIZE = Platform.isTVOS ? 60 : 20;
var NEW_GAME_PADDING_SIZE = Platform.isTVOS ? 60 : 20;
var NEW_GAME_BORDER_RADIUS = Platform.isTVOS ? 15 : 5;

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  title: {
    fontFamily: TITLE_FONT,
    fontSize: TITLE_SIZE,
    marginBottom: TITLE_MARGIN_BOTTOM,
  },
  board: {
    padding: BOARD_PADDING,
    backgroundColor: '#47525d',
    borderRadius: BOARD_BORDER_RADIUS,
  },
  row: {
    flexDirection: 'row',
  },

  // CELL

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_BORDER_RADIUS,
    backgroundColor: '#7b8994',
    margin: CELL_MARGIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellX: {
    backgroundColor: '#72d0eb',
  },
  cellO: {
    backgroundColor: '#7ebd26',
  },

  // CELL TEXT

  cellText: {
    fontSize: CELL_FONT_SIZE,
    fontFamily: CELL_FONT,
  },
  cellTextX: {
    color: '#19a9e5',
  },
  cellTextO: {
    color: '#b9dc2f',
  },

  // GAME OVER

  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(221, 221, 221, 0.5)',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayMessage: {
    fontSize: OVERLAY_FONT_SIZE,
    marginBottom: OVERLAY_MARGIN_SIZE,
    marginLeft: OVERLAY_MARGIN_SIZE,
    marginRight: OVERLAY_MARGIN_SIZE,
    fontFamily: OVERLAY_FONT,
    textAlign: 'center',
  },
  newGame: {
    backgroundColor: '#887765',
    padding: NEW_GAME_PADDING_SIZE,
    borderRadius: NEW_GAME_BORDER_RADIUS,
  },
  newGameText: {
    color: 'white',
    fontSize: NEW_GAME_FONT_SIZE,
    fontFamily: NEW_GAME_FONT,
  },
});

AppRegistry.registerComponent('TicTacToeApp', () => TicTacToeApp);

module.exports = TicTacToeApp;
