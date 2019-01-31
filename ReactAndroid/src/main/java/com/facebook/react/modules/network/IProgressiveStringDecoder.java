package com.facebook.react.modules.network;

interface IProgressiveStringDecoder {
  String decodeNext(byte[] data, int length);
}
