---
id: cameraroll
title: cameraroll
---
<a id="content"></a><h1>CameraRoll</h1><div><div><p><code>CameraRoll</code> provides access to the local camera roll / gallery.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="saveimagewithtag"></a><span class="propType">static </span>saveImageWithTag<span class="propType">(tag, successCallback, errorCallback)</span> <a class="hash-link" href="#saveimagewithtag">#</a></h4><div><p>Saves the image to the camera roll / gallery.</p><p>The CameraRoll API is not yet implemented for Android.</p><p>@param {string} tag On Android, this is a local URI, such
as <code>"file:///sdcard/img.png"</code>.</p><p>On iOS, the tag can be one of the following:</p><ul><li>local URI</li><li>assets-library tag</li><li>a tag not matching any of the above, which means the image data will
be stored in memory (and consume memory as long as the process is alive)</li></ul><p>@param successCallback Invoked with the value of <code>tag</code> on success.
@param errorCallback Invoked with error message on error.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getphotos"></a><span class="propType">static </span>getPhotos<span class="propType">(params, callback, errorCallback)</span> <a class="hash-link" href="#getphotos">#</a></h4><div><p> Invokes <code>callback</code> with photo identifier objects from the local camera
 roll of the device matching shape defined by <code>getPhotosReturnChecker</code>.</p><p> @param {object} params See <code>getPhotosParamChecker</code>.
 @param {function} callback Invoked with arg of shape defined by
 <code>getPhotosReturnChecker</code> on success.
 @param {function} errorCallback Invoked with error message on error.</p></div></div></div></span></div><div class="docs-prevnext"><a class="docs-next" href="dimensions.html#content">Next →</a></div>