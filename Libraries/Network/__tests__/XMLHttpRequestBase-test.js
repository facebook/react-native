'use strict';

jest
	.autoMockOff()
	.dontMock('XMLHttpRequestBase');

const XMLHttpRequestBase = require('XMLHttpRequestBase');

describe('XMLHttpRequestBase', function(){
	var xhr;

	beforeEach(() => {
		xhr = new XMLHttpRequestBase();
		xhr.ontimeout = jest.fn();
		xhr.onerror = jest.fn();
		xhr.onload = jest.fn();
		xhr.didCreateRequest(1);
	});

	afterEach(() => {
		xhr = null;
	});

	it('should call ontimeout function when the request times out', function(){
		xhr._didCompleteResponse(1, 'Timeout', true);

		expect(xhr.ontimeout).toBeCalledWith(null);
		expect(xhr.onerror).not.toBeCalled();
		expect(xhr.onload).not.toBeCalled();
	});

	it('should call onerror function when the request times out', function(){
		xhr._didCompleteResponse(1, 'Generic error');

		expect(xhr.onerror).toBeCalledWith(null);
		expect(xhr.ontimeout).not.toBeCalled();
		expect(xhr.onload).not.toBeCalled();
	});

	it('should call onload function when there is no error', function(){
		xhr._didCompleteResponse(1, null);

		expect(xhr.onload).toBeCalledWith(null);
		expect(xhr.onerror).not.toBeCalled();
		expect(xhr.ontimeout).not.toBeCalled();
	});

});
