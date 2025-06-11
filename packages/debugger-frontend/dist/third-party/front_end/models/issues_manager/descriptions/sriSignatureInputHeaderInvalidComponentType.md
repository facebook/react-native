# A `signature-input` header's component is not a string.

Responses' [`signature-input`](signatureInputHeader) header's members' values
are [Inner Lists](sfInnerList) whose contents are each strings. Perhaps you
forgot double-quotes around a component?

```
// Correct:
Signature-Input: signature=("unencoded-digest";sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"

// Incorrect:
Signature-Input: signature=(unencoded-digest;sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"
```
