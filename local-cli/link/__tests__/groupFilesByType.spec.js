'use strict';

const groupFilesByType = require('../groupFilesByType');

describe('groupFilesByType', () => {

  it('should group files by its type', () => {
    const fonts = [
      'fonts/a.ttf',
      'fonts/b.ttf',
    ];
    const images = [
      'images/a.jpg',
      'images/c.jpeg',
    ];

    const groupedFiles = groupFilesByType(fonts.concat(images));

    expect(groupedFiles.font).toEqual(fonts);
    expect(groupedFiles.image).toEqual(images);
  });

});
