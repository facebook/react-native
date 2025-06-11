# A `signature-input` header is not formatted as a Structured Field Dictionary.

Responses' [`signature-input`](signatureInputHeader) header should be formatted
as a [Dictionary](sfDictionary) containing metadata regarding one or more
signatures. Each member's key is a label for the metadata which maps it to the
relevant signature defined in a [`signature`](signatureHeader) header. Each
member's value is an [Inner List](sfInnerList) containing a set of components
over which a signature is generated. The list may have one or more parameters.

For example, the following header contains metadata for a signature labeled
"label":

```
Signature-Input: signature=("unencoded-digest";sf);keyid="JrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=";tag="sri"
```
