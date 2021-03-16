package com.incture.lch.exception;


/**
 * <code>InvalidInputFault</code> is to indicate application that the parameters
 * passed to the method is invalid w.r.t its implementation.
 * 
 * @version 2, 21-June-2012
 * @since CR8313
 */
public class InvalidInputFault extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = -10053865078245371L;
	private MessageUIDto faultInfo;

	public InvalidInputFault() {
		// TODO Auto-generated constructor stub
	}

	public InvalidInputFault(String faultMessage) {
		super(faultMessage);
		faultInfo = new MessageUIDto();
		faultInfo.setMessage(faultMessage);
	}
	
	public InvalidInputFault(String message, MessageUIDto faultInfo) {
		super(message);
		this.faultInfo = faultInfo;
	}

	public InvalidInputFault(String message, MessageUIDto faultInfo,
			Throwable cause) {
		super(message, cause);
		this.faultInfo = faultInfo;
	}

	public MessageUIDto getFaultInfo() {
		return faultInfo;
	}
}