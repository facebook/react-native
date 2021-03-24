package com.incture.lch.adhoc.custom.dto;

public class AdhocWorkflowCustomDto {

	private String adhocOrderId;
	private String createdBy;
	private String createdDate;

	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public String getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(String createdDate) {
		this.createdDate = createdDate;
	}

	@Override
	public String toString() {
		return "AdhocWorkflowCustomDto [adhocOrderId=" + adhocOrderId + ", createdBy=" + createdBy + ", createdDate="
				+ createdDate + "]";
	}

}
