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
 * @providesModule NavigationTicTacToeExample
 * @flow
 */
'use strict';

const React = require('react');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');

type GameGrid = Array<Array<?string>>;

const evenOddPlayerMap = ['O', 'X'];
const rowLetterMap = ['a', 'b', 'c'];

function parseGame(game: string): GameGrid {
  const gameTurns = game ? game.split('-') : [];
  const grid = Array(3);
  for (let i = 0; i < 3; i++) {
    const row = Array(3);
    for (let j = 0; j < 3; j++) {
      const turnIndex = gameTurns.indexOf(rowLetterMap[i] + j);
      if (turnIndex === -1) {
        row[j] = null;
      } else {
        row[j] = evenOddPlayerMap[turnIndex % 2];
      }
    }
    grid[i] = row;
  }
  return grid;
}

function playTurn(game: string, row: number, col: number): string {
  const turn = rowLetterMap[row] + col;
  return game ? (game + '-' + turn) : turn;
}

function getWinner(gameString: string): ?string {
  const game = parseGame(gameString);
  for (let i = 0; i < 3; i++) {
    if (game[i][0] !== null && game[i][0] === game[i][1] &&
        game[i][0] === game[i][2]) {
      return game[i][0];
    }
  }
  for (let i = 0; i < 3; i++) {
    if (game[0][i] !== null && game[0][i] === game[1][i] &&
        game[0][i] === game[2][i]) {
      return game[0][i];
    }
  }
  if (game[0][0] !== null && game[0][0] === game[1][1] &&
      game[0][0] === game[2][2]) {
    return game[0][0];
  }
  if (game[0][2] !== null && game[0][2] === game[1][1] &&
      game[0][2] === game[2][0]) {
    return game[0][2];
  }
  return null;
}

function isGameOver(gameString: string): boolean {
  if (getWinner(gameString)) {
    return true;
  }
  const game = parseGame(gameString);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (game[i][j] === null) {
        return false;
      }
    }
  }
  return true;
}

class Cell extends React.Component {
  props: any;
  cellStyle() {
    switch (this.props.player) {
      case 'X':
        return styles.cellX;
      case 'O':
        return styles.cellO;
      default:
        return null;
    }
  }
  textStyle() {
    switch (this.props.player) {
      case 'X':
        return styles.cellTextX;
      case 'O':
        return styles.cellTextO;
      default:
        return {};
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
            {this.props.player}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

function GameEndOverlay(props) {
  if (!isGameOver(props.game)) {
    return <View />;
  }
  const winner = getWinner(props.game);
  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayMessage}>
        {winner ? winner + ' wins!' : 'It\'s a tie!'}
      </Text>
      <TouchableHighlight
        onPress={() => props.onNavigate(GameActions.Reset())}
        underlayColor="transparent"
        activeOpacity={0.5}>
        <View style={styles.newGame}>
          <Text style={styles.newGameText}>New Game</Text>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function TicTacToeGame(props) {
  const rows = parseGame(props.game).map((cells, row) =>
    <View key={'row' + row} style={styles.row}>
      {cells.map((player, col) =>
        <Cell
          key={'cell' + col}
          player={player}
          onPress={() => props.onNavigate(GameActions.Turn(row, col))}
        />
      )}
    </View>
  );
  return (
    <View style={styles.container}>
      <Text
        style={styles.closeButton}
        onPress={props.onExampleExit}>
        Close
      </Text>
      <Text style={styles.title}>EXTREME T3</Text>
      <View style={styles.board}>
        {rows}
      </View>
      <GameEndOverlay
        game={props.game}
        onNavigate={props.onNavigate}
      />
    </View>
  );
}

const GameActions = {
  Turn: (row, col) => ({type: 'TicTacToeTurnAction', row, col }),
  Reset: (row, col) => ({type: 'TicTacToeResetAction' }),
};

function GameReducer(lastGame: ?string, action: Object): string {
  if (!lastGame) {
    lastGame = '';
  }
  if (action.type === 'TicTacToeResetAction') {
    return '';
  }
  if (!isGameOver(lastGame) && action.type === 'TicTacToeTurnAction') {
    return playTurn(lastGame, action.row, action.col);
  }
  return lastGame;
}

type AppState = {
  game: string,
};

class NavigationTicTacToeExample extends React.Component {
  _handleAction: Function;
  state: AppState;
  constructor() {
    super();
    this._handleAction = this._handleAction.bind(this);
    this.state = {
      game: ''
    };
  }
  _handleAction(action: Object) {
    const newState = GameReducer(this.state.game, action);
    if (newState !== this.state.game) {
      this.setState({
        game: newState,
      });
    }
  }
  render() {
    return (
      <TicTacToeGame
        game={this.state && this.state.game}
        onExampleExit={this.props.onExampleExit}
        onNavigate={this._handleAction}
      />
    );
  }
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    left: 10,
    top: 30,
    fontSize: 14,
  },
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
  cellText: {
    fontSize: 50,
    fontFamily: 'AvenirNext-Bold',
  },
  cellTextX: {
    color: '#19a9e5',
  },
  cellTextO: {
    color: '#b9dc2f',
  },
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
    backgroundColor: '#887766',
    padding: 20,
    borderRadius: 5,
  },
  newGameText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'AvenirNext-DemiBold',
  },
});

module.exports = NavigationTicTacToeExample;
