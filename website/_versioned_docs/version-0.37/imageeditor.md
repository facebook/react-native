---
id: version-0.37-imageeditor
original_id: imageeditor
title: imageeditor
---
<a id="content"></a><h1><a class="anchor" name="imageeditor"></a>ImageEditor <a class="hash-link" href="docs/imageeditor.html#imageeditor">#</a></h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/imageeditor.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="cropimage"></a><span class="methodType">static </span>cropImage<span class="methodType">(uri, cropData, success, failure)</span> <a class="hash-link" href="docs/imageeditor.html#cropimage">#</a></h4><div><p>Crop the image specified by the URI param. If URI points to a remote
image, it will be downloaded automatically. If the image cannot be
loaded/downloaded, the failure callback will be called.</p><p>If the cropping process is successful, the resultant cropped image
will be stored in the ImageStore, and the URI returned in the success
callback will point to the image in the store. Remember to delete the
cropped image from the ImageStore when you are done with it.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Image/ImageEditor.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/geolocation.html#content">← Prev</a><a class="docs-next" href="docs/imagepickerios.html#content">Next →</a></div>