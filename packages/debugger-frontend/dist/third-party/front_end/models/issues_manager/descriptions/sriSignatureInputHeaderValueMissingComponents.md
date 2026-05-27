# Missing a required component in a `signature-input` header.

The [`signature-input`](signatureInputHeader) header's
[Inner Lists](sfInnerList) must contain the string "`unencoded-digest`" with an
`sf` parameter:

For example:

```
Signature-Input: signature=("unencoded-digest";sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"
```
