/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');

/**
 * Initializes store, and optionally authenticates current user.
 * @param {string?} email
 * @param {string?} password
 * @returns {Promise<firebase.firestore.Firestore>} Reference to store instance
 */
async function initializeStore(email, password) {
  const PROJECT_ID = 'react-native-1583841384889';
  const apiKey = [
    'AIzaSyCm',
    '5hN3nVNY',
    'tF9zkSHa',
    'oFpeVe3g',
    'LceuC0Q',
  ].join('');
  const app = firebase.initializeApp({
    apiKey,
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`,
    messagingSenderId: '329254200967',
    appId: '1:329254200967:web:c465681d024115bc303a22',
    measurementId: 'G-ZKSZ7SCLHK',
  });

  if (email && password) {
    await app
      .auth()
      .signInWithEmailAndPassword(email, password)
      .catch(error => console.log(error));
  }

  return app.firestore();
}

/**
 * Initializes 'binary-sizes' collection using the initial commit's data.
 * @param {firebase.firestore.Firestore} firestore Reference to store instance
 */
function initializeBinarySizesCollection(firestore) {
  return getBinarySizesCollection(firestore)
    .doc('a15603d8f1ecdd673d80be318293cee53eb4475d')
    .set({
      'android-hermes-arm64-v8a': 0,
      'android-hermes-armeabi-v7a': 0,
      'android-hermes-x86': 0,
      'android-hermes-x86_64': 0,
      'android-jsc-arm64-v8a': 0,
      'android-jsc-armeabi-v7a': 0,
      'android-jsc-x86': 0,
      'android-jsc-x86_64': 0,
      'ios-universal': 0,
      timestamp: new Date('Thu Jan 29 17:10:49 2015 -0800'),
    });
}

/**
 * Returns 'binary-sizes' collection.
 * @param {firebase.firestore.Firestore} firestore Reference to store instance
 */
function getBinarySizesCollection(firestore) {
  const BINARY_SIZES_COLLECTION = 'binary-sizes';
  return firestore.collection(BINARY_SIZES_COLLECTION);
}

/**
 * Creates or updates the specified entry.
 * @param {firebase.firestore.CollectionReference<firebase.firestore.DocumentData>} collection
 * @param {string} sha The Git SHA used to identify the entry
 * @param {firebase.firestore.UpdateData} data The data to be inserted/updated
 * @returns {Promise<void>}
 */
function createOrUpdateDocument(collection, sha, data) {
  const stampedData = {
    ...data,
    timestamp: firebase.firestore.Timestamp.now(),
  };
  const docRef = collection.doc(sha);
  return docRef.update(stampedData).catch(async error => {
    if (error.code === 'not-found') {
      await docRef.set(stampedData).catch(setError => console.log(setError));
    } else {
      console.log(error);
    }
  });
}

/**
 * Returns the latest document in collection.
 * @param {firebase.firestore.CollectionReference<firebase.firestore.DocumentData>} collection
 * @returns {Promise<firebase.firestore.DocumentData | undefined>}
 */
function getLatestDocument(collection) {
  return collection
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        return undefined;
      }

      const doc = snapshot.docs[0];
      return {
        ...doc.data(),
        commit: doc.id,
      };
    })
    .catch(error => {
      console.log(error);
      return undefined;
    });
}

/**
 * Example usage:
 *
 *     const datastore = require('./datastore');
 *     const store = datastore.initializeStore();
 *     const binarySizes = datastore.getBinarySizesCollection(store);
 *     console.log(await getLatestDocument(binarySizes));
 *     console.log(await createOrUpdateDocument(binarySizes, 'some-id', {data: 0}));
 *
 *     // Documentation says that we don't need to call `terminate()` but the script
 *     // will just hang around until the connection times out if we don't.
 *     firestore.terminate();
 */
module.exports = {
  initializeStore,
  initializeBinarySizesCollection,
  getBinarySizesCollection,
  createOrUpdateDocument,
  getLatestDocument,
};
