'use strict';


module.exports = function(NativeClipboard){
  return {
      get(callback) {
          NativeClipboard.get(callback);
      },

      set(content) {
          NativeClipboard.set(content);
      }
  };
};
