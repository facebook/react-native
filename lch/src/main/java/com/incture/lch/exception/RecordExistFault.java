package com.incture.lch.exception;

/**
 * <code>RecordExistFault</code> is to indicate application that the entity
 * already exists in the data source, main purpose is to avoid insertion of
 * records violating unique constraint(duplicate records) into data source.
 * 
 * @version 2, 21-June-2012
 * @since CR8313
 */
// @WebFault(name = "RecordExistFault", faultBean =
// "com.incture.u2k2.mmw.exception.MessageUIDto")
public class RecordExistFault extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = 6638436939102626360L;
	/**
	 * Java type that goes as soapenv:Fault detail element.
	 */
	private MessageUIDto faultInfo;

	public RecordExistFault() {
		// TODO Auto-generated constructor stub
	}

	public RecordExistFault(String faultMessage) {
		super("Record already exist ");
		faultInfo = new MessageUIDto();
		faultInfo.setMessage(faultMessage);
	}

	public RecordExistFault(String message, MessageUIDto faultInfo) {
		super(message);
		this.faultInfo = faultInfo;
	}

	public RecordExistFault(String message, MessageUIDto faultInfo,
			Throwable cause) {
		super(message, cause);
		this.faultInfo = faultInfo;
	}

	public MessageUIDto getFaultInfo() {
		return faultInfo;
	}

	// public RecordExistFault() {
	// super();
	// }
	//
	// private String msg;
	//
	// public RecordExistFault(MmwDto mmwDto) {
	// StringBuffer sb = new StringBuffer("Record already exist ");
	// if (mmwDto != null) {
	// // sb.append(mmwDto.getClass().getSimpleName());
	// // sb.append("#[");
	// sb.append(mmwDto.toString());
	// // sb.append(']');
	// }
	// msg = sb.toString();
	// }
	//
	// @Override
	// public String getMessage() {
	// return msg;
	// }
}