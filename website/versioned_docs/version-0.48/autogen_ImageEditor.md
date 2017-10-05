---
id: version-0.48-imageeditor
title: ImageEditor
category: APIs
permalink: docs/imageeditor.html
original_id: imageeditor
---
<div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/imageeditor.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="cropimage"></a><span class="methodType">static </span>cropImage<span class="methodType">(uri, cropData, success, failure)</span> <a class="hash-link" href="docs/imageeditor.html#cropimage">#</a></h4><div><p>Crop the image specified by the URI param. If URI points to a remote
image, it will be downloaded automatically. If the image cannot be
loaded/downloaded, the failure callback will be called.</p><p>If the cropping process is successful, the resultant cropped image
will be stored in the ImageStore, and the URI returned in the success
callback will point to the image in the store. Remember to delete the
cropped image from the ImageStore when you are done with it.</p></div></div></div></span></div>