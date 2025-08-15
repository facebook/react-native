# A `signature-input` header has a member whose value is not an Inner List.

The value of each member of a [`signature-input`](aignatureInputHeader) header's
[Dictionary][sfDictionary] must be an [Inner List](sfInnerList) containing the
set of components over which a signature is generated.

For example:

```
Signature-Input: signature=("unencoded-digest";sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"
```
