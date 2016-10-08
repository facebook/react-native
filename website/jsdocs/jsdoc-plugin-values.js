exports.defineTags = function(dictionary) {
    dictionary.defineTag('value', {
        mustHaveValue: true,
        canHaveType: true,
        canHaveName: true,
        onTagged: function(doclet, tag) {
            if (!doclet.values) { doclet.values = []; }
            doclet.values.push(tag.value);
        }
    });
};
