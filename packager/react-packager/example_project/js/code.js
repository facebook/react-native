/**
 * @providesModule code
 */
var XHR = require('XHR');

var $ = function(sel) {return document.querySelector(sel);};

function getListItems(files) {
  var items = [];
  files.forEach(function(file) {
    var displayName = file.name + (file.type == 1 ? '/' : '');
    items.push(
      React.DOM.li({
        className: 'type' + file.type,
        key: file.ino
      }, displayName)
    );
    if (file.type === 1) {
      items.push(getListItems(file.nodes));
    }
  });

  return React.DOM.ol(null, items);
}

var FileList = React.createClass({
  getInitialState: function() {
    return {files: []};
  },

  componentDidMount: function() {
    XHR.get(
      this.props.source,
      function(err, xhr) {
        if (err) {throw err;}

        var files = JSON.parse(xhr.responseText);
        this.setState({files: files});
      }.bind(this)
    );
  },

  render: function() {
    return getListItems(this.state.files);
  }
});

window.addEventListener('load', function() {
 React.render(React.createElement(FileList, {source: '/files'}),
   $('#code'));
});
