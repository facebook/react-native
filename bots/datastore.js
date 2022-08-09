/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {initializeApp} = require('firebase/app');
const {getAuth, signInWithEmailAndPassword} = require('firebase/auth');
const firestore = require('firebase/firestore');

/**
 * Initializes store, and optionally authenticates current user.
 *
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
  const firebaseApp = initializeApp({
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
    await signInWithEmailAndPassword(
      getAuth(firebaseApp),
      email,
      password,
    ).catch(error => console.log(error));
  }

  return firestore.getFirestore(firebaseApp);
}

/**
 * Initializes 'binary-sizes' collection using the initial commit's data.
 *
 * @param {firebase.firestore.Firestore} db Reference to store instance
 */
function initializeBinarySizesCollection(db) {
  const collectionRef = getBinarySizesCollection(db);
  const docRef = firestore.doc(
    collectionRef,
    'a15603d8f1ecdd673d80be318293cee53eb4475d',
  );
  firestore.setDoc(docRef, {
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
 *
 * @param {firebase.firestore.Firestore} db Reference to store instance
 */
function getBinarySizesCollection(db) {
  const BINARY_SIZES_COLLECTION = 'binary-sizes';
  return firestore.collection(db, BINARY_SIZES_COLLECTION);
}

/**
 * Creates or updates the specified entry.
 *
 * @param {firebase.firestore.CollectionReference<firebase.firestore.DocumentData>} collection
 * @param {string} sha The Git SHA used to identify the entry
 * @param {firebase.firestore.UpdateData} data The data to be inserted/updated
 * @param {string} branch The Git branch where this data was computed for
 * @returns {Promise<void>}
 */
function createOrUpdateDocument(collectionRef, sha, data, branch) {
  const stampedData = {
    ...data,
    timestamp: firestore.Timestamp.now(),
    branch,
  };
  const docRef = firestore.doc(collectionRef, sha);
  return firestore.updateDoc(docRef, stampedData).catch(async error => {
    if (error.code === 'not-found') {
      await firestore
        .setDoc(docRef, stampedData)
        .catch(setError => console.log(setError));
    } else {
      console.log(error);
    }
  });
}

/**
 * Returns the latest document in collection.
 *
 * @param {firebase.firestore.CollectionReference<firebase.firestore.DocumentData>} collection
 * @param {string} branch The Git branch for the data
 * @returns {Promise<firebase.firestore.DocumentData | undefined>}
 */
async function getLatestDocument(collectionRef, branch) {
  try {
    const querySnapshot = await firestore.getDocs(
      firestore.query(
        collectionRef,
        firestore.orderBy('timestamp', 'desc'),
        firestore.where('branch', '==', branch),
        firestore.limit(1),
      ),
    );
    if (querySnapshot.empty) {
      return undefined;
    }

    const doc = querySnapshot.docs[0];
    return {
      ...doc.data(),
      commit: doc.id,
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * Terminates the supplied store.
 *
 * Documentation says that we don't need to call `terminate()` but the script
 * will just hang around until the connection times out if we don't.
 *
 * @param {Promise<firebase.firestore.Firestore>} db
 */
async function terminateStore(db) {
  await firestore.terminate(db);
}

/**
 * Example usage:
 *
 *     const datastore = require('./datastore');
 *     const store = datastore.initializeStore();
 *     const binarySizes = datastore.getBinarySizesCollection(store);
 *     console.log(await getLatestDocument(binarySizes));
 *     console.log(await createOrUpdateDocument(binarySizes, 'some-id', {data: 0}));
 *     terminateStore(store);
 *
 */
module.exports = {
  initializeStore,
  initializeBinarySizesCollection,
  getBinarySizesCollection,
  createOrUpdateDocument,
  getLatestDocument,
  terminateStore,
};
