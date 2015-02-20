/**
 * @providesModule XHR
 */

function request(method, url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callback(null, xhr);
      } else {
        callback(new Error('status = ' + xhr.status, xhr));
      }
    }
  };
  xhr.send();
}

exports.get = function(url, callback) {
  request('GET', url, callback);
};
