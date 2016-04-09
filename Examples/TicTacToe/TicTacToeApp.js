/**
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

var Cell = React.createClass({
  cellStyle() {
    switch (this.props.player) {
      case 1:
        return styles.cellX;
      case 2:
        return styles.cellO;
      default:
        return null;
    }
  },

  textStyle() {
    switch (this.props.player) {
      case 1:
        return styles.cellTextX;
      case 2:
        return styles.cellTextO;
      default:
        return {};
    }
  },

  textContents() {
    switch (this.props.player) {
      case 1:
        return 'X';
      case 2:
        return 'O';
      default:
        return '';
    }
  },

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
});

var GameEndOverlay = React.createClass({
  render() {
    var board = this.props.board;

    var tie = board.tie();
    var winner = board.winner();
    if (!winner && !tie) {
      return <View />;
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
});

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

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  title: {
    fontFamily: 'Chalkduster',
    fontSize: 39,
    marginBottom: 20,
  },
  board: {
    padding: 5,
    backgroundColor: '#47525d',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
  },

  // CELL

  cell: {
    width: 80,
    height: 80,
    borderRadius: 5,
    backgroundColor: '#7b8994',
    margin: 5,
    flex: 1,
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
    borderRadius: 5,
    fontSize: 50,
    fontFamily: 'AvenirNext-Bold',
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
    fontSize: 40,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    fontFamily: 'AvenirNext-DemiBold',
    textAlign: 'center',
  },
  newGame: {
    backgroundColor: '#887765',
    padding: 20,
    borderRadius: 5,
  },
  newGameText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'AvenirNext-DemiBold',
  },
});

AppRegistry.registerComponent('TicTacToeApp', () => TicTacToeApp);

module.exports = TicTacToeApp;
