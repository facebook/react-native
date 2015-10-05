/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var TOKEN    = '<<SignedSource::*O*zOeWoEQle#+L!plEphiEmie@IsG>>',
    OLDTOKEN = '<<SignedSource::*O*zOeWoEQle#+L!plEphiEmie@I>>',
    TOKENS   = [TOKEN, OLDTOKEN],
    PATTERN  = new RegExp('@'+'generated (?:SignedSource<<([a-f0-9]{32})>>)');

exports.SIGN_OK = {message:'ok'};
exports.SIGN_UNSIGNED = new Error('unsigned');
exports.SIGN_INVALID = new Error('invalid');

// Thrown by sign(). Primarily for unit tests.
exports.TokenNotFoundError = new Error(
  'Code signing placeholder not found (expected to find \''+TOKEN+'\')');

var md5_hash_hex;

// MD5 hash function for Node.js. To port this to other platforms, provide an
// alternate code path for defining the md5_hash_hex function.
var crypto = require('crypto');
md5_hash_hex = function md5_hash_hex(data, input_encoding) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(data, input_encoding);
  return md5sum.digest('hex');
};

// Returns the signing token to be embedded, generally in a header comment,
// in the file you wish to be signed.
//
// @return str  to be embedded in to-be-signed file
function signing_token() {
  return '@'+'generated '+TOKEN;
}
exports.signing_token = signing_token;

// Determine whether a file is signed. This does NOT verify the signature.
//
// @param  str  File contents as a string.
// @return bool True if the file has a signature.
function is_signed(file_data) {
  return !!PATTERN.exec(file_data);
}
exports.is_signed = is_signed;

// Sign a source file which you have previously embedded a signing token
// into. Signing modifies only the signing token, so the semantics of the
// file will not change if you've put it in a comment.
//
// @param  str File contents as a string (with embedded token).
// @return str Signed data.
function sign(file_data) {
  var first_time = file_data.indexOf(TOKEN) !== -1;
  if (!first_time) {
    if (is_signed(file_data))
      file_data = file_data.replace(PATTERN, signing_token());
    else
      throw exports.TokenNotFoundError;
  }
  var signature = md5_hash_hex(file_data, 'utf8');
  var signed_data = file_data.replace(TOKEN, 'SignedSource<<'+signature+'>>');
  return { first_time: first_time,  signed_data: signed_data };
}
exports.sign = sign;

// Verify a file's signature.
//
// @param  str  File contents as a string.
// @return      Returns SIGN_OK if the data contains a valid signature,
//              SIGN_UNSIGNED if it contains no signature, or SIGN_INVALID if
//              it contains an invalid signature.
function verify_signature(file_data) {
  var match = PATTERN.exec(file_data);
  if (!match)
    return exports.SIGN_UNSIGNED;
  // Replace the signature with the TOKEN, then hash and see if it matches
  // the value in the file.  For backwards compatibility, also try with
  // OLDTOKEN if that doesn't match.
  var k, token, with_token, actual_md5, expected_md5 = match[1];
  for (k in TOKENS) {
    token = TOKENS[k];
    with_token = file_data.replace(PATTERN, '@'+'generated '+token);
    actual_md5 = md5_hash_hex(with_token, 'utf8');
    if (expected_md5 === actual_md5)
      return exports.SIGN_OK;
  }
  return exports.SIGN_INVALID;
}
exports.verify_signature = verify_signature;
