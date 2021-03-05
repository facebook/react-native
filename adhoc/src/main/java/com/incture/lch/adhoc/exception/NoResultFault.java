package com.incture.lch.adhoc.exception;
import java.util.List;

public class NoResultFault extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = -5854277644555861555L;
	private String msg;

	public NoResultFault() {
	}

	public NoResultFault(String funcName, String queryName,
			List<Object> parameters) {
		StringBuffer sb = new StringBuffer(funcName);
		sb.append(": No Record found for query ");
		sb.append(queryName);
		if (parameters != null) {
			final int length = parameters.size();
			if (length > 0) {
				sb.append(" for params: ");
				sb.append(parameters.get(0));
				for (int i = 1; i < length; i++) {
					sb.append(", ");
					sb.append(parameters.get(i));
				}
			}
		}
		msg = sb.toString();
	}
	
	public NoResultFault(String message) {
		this.msg = message;
	}

	@Override
	public String getMessage() {
		return msg;
	}
}