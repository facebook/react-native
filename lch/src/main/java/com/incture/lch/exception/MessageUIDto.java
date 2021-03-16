package com.incture.lch.exception;

/**
 * The Java type that goes as soapenv:Fault detail element. Used in web services
 * exceptions, fault beans just hold the details of the SOAP fault. This one is
 * used by the {@link ExecutionFault}, {@link InvalidInputFault},
 * {@link NoUniqueRecordFault}, {@link NoRecordFault}, {@link RecordExistFault}.
 * Meant as custom message for User Interfaces
 * 
 * @version 2, 21-January-2013
 * @since CR8313
 */
public class MessageUIDto {

	private String message;

	public MessageUIDto() {
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}