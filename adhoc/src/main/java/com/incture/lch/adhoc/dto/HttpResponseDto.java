package com.incture.lch.adhoc.dto;

import java.util.Map;

public class HttpResponseDto {
	private String responseData;
	private Integer statuscode;
	private Map<String, String> headers;

	public String getResponseData() {
		return responseData;
	}

	public void setResponseData(String responseData) {
		this.responseData = responseData;
	}

	public Integer getStatuscode() {
		return statuscode;
	}

	public void setStatuscode(Integer statuscode) {
		this.statuscode = statuscode;
	}

	public Map<String, String> getHeaders() {
		return headers;
	}

	public void setHeaders(Map<String, String> headers) {
		this.headers = headers;
	}

	@Override
	public String toString() {
		return "HttpResponseDto [responseData=" + responseData + ", statuscode=" + statuscode + ", headers=" + headers
				+ "]";
	}

}
