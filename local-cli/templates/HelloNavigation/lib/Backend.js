'use strict';

// This file just a dummy example of a HTTP API to talk to the backend.
// The state of the "database" that would normally live on the server
// is simply held here in memory.

const backendStateForLoggedInPerson = {
  chats: [
    {
      name: 'Claire',
      messages: [
        {
          name: 'Claire',
          text: 'I ❤️ React Native!',
        },
      ],
    },
    {
      name: 'John',
      messages: [
        {
          name: 'John',
          text: 'I ❤️ React Native!',
        },
      ],
    }
  ],
};

/**
 * Randomly simulate network failures.
 * It is useful to enable this during development to make sure our app works
 * in real-world conditions.
 */
function isNetworkFailure() {
  const chanceOfFailure = 0;  // 0..1
  return Math.random() < chanceOfFailure;
}

/**
 * Helper for the other functions in this file.
 * Simulates a short delay and then returns a provided value or failure.
 * This is just a dummy example. Normally we'd make a HTTP request,
 * see http://facebook.github.io/react-native/docs/network.html
 */
function _makeSimulatedNetworkRequest(getValue) {
  const durationMs = 400;
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (isNetworkFailure()) {
        reject(new Error('Network failure'));
      } else {
        getValue(resolve, reject);
      }
    }, durationMs);
  });
}

/**
 * Fetch a list of all chats for the logged in person.
 */
async function fetchChatList() {
  return _makeSimulatedNetworkRequest((resolve, reject) => {
    resolve(backendStateForLoggedInPerson.chats.map(chat => chat.name));
  });
}

/**
 * Fetch a single chat.
 */
async function fetchChat(name) {
  return _makeSimulatedNetworkRequest((resolve, reject) => {
    resolve(
      backendStateForLoggedInPerson.chats.find(
        chat => chat.name === name
      )
    );
  });
}

/**
 * Send given message to given person.
 */
async function sendMessage({name, message}) {
  return _makeSimulatedNetworkRequest((resolve, reject) => {
    const chatForName = backendStateForLoggedInPerson.chats.find(
      chat => chat.name === name
    );
    if (chatForName) {
      chatForName.messages.push({
        name: 'Me',
        text: message,
      });
      resolve();
    } else {
      reject(new Error('Uknown person: ' + name));
    }
  });
}

const Backend = {
  fetchChatList,
  fetchChat,
  sendMessage,
};

export default Backend;

// In case you are looking into using Redux for state management,
// this is how network requests are done in the f8 app which uses Redux:
// - To load some data, a Component fires a Redux action, such as loadSession()
// - That action makes the HTTP requests and then dispatches a redux action
//   {type: 'LOADED_SESSIONS', results}
// - Then all reducers get called and one of them updates a part of the application
//   state by storing the results
// - Redux re-renders the connected Components
// See https://github.com/fbsamples/f8app/search?utf8=%E2%9C%93&q=loaded_sessions
