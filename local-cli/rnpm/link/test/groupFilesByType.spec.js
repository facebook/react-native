const chai = require('chai');
const expect = chai.expect;
const groupFilesByType = require('../src/groupFilesByType');

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

    expect(groupedFiles.font).to.deep.equal(fonts);
    expect(groupedFiles.image).to.deep.equal(images);
  });

});
