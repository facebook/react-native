package com.incture.lch.exception;


/**
 * <code>NonUniqueRecordFault</code> is to indicate application that the query
 * returns more than one record, sometimes its indicates an unique constraint
 * violation in the data source
 * 
 * @version 2, 21-June-2012
 * @since CR8313
 */
//@WebFault(name = "NonUniqueRecordFault", faultBean = "com.incture.u2k2.mmw.exception.MessageUIDto")
public class NonUniqueRecordFault extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = -7980640729999708605L;
	/**
	 * Java type that goes as soapenv:Fault detail element.
	 */
	private MessageUIDto faultInfo;

	public NonUniqueRecordFault() {
		// TODO Auto-generated constructor stub
	}

	public NonUniqueRecordFault(String faultMessage) {
		super("Failed due to corrupt data, please contact db admin ");
		faultInfo = new MessageUIDto();
		faultInfo.setMessage(faultMessage);
	}
	
	public NonUniqueRecordFault(String message, MessageUIDto faultInfo) {
		super(message);
		this.faultInfo = faultInfo;
	}

	public NonUniqueRecordFault(String message, MessageUIDto faultInfo,
			Throwable cause) {
		super(message, cause);
		this.faultInfo = faultInfo;
	}

	public MessageUIDto getFaultInfo() {
		return faultInfo;
	}
}