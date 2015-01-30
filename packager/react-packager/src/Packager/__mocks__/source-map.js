var SourceMapGenerator = jest.genMockFn();
SourceMapGenerator.prototype.addMapping = jest.genMockFn();
SourceMapGenerator.prototype.setSourceContent = jest.genMockFn();
SourceMapGenerator.prototype.toJSON = jest.genMockFn();
exports.SourceMapGenerator = SourceMapGenerator;
