# Missing a required parameter on the list of components in a `signature-input` header.

The [`signature-input`][signatureInputHeader] header's [Inner Lists](sfInnerList)
must be specified with both the [`keyid` and `type` parameters](signatureParameters).

```
Signature-Input: signature=("unencoded-digest";sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"
```
