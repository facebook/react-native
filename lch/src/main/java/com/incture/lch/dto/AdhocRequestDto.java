package com.incture.lch.dto;

import java.util.Date;

public class AdhocRequestDto {

	private String adhocOrderId;
	private Date createdDate;
	private String fromDate;
	private String toDate;
	private String partNo;
	private String createdBy;
	

	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public Date getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(Date createdDate) {
		this.createdDate = createdDate;
	}

	public String getFromDate() {
		return fromDate;
	}

	public void setFromDate(String fromDate) {
		this.fromDate = fromDate;
	}

	public String getToDate() {
		return toDate;
	}

	public void setToDate(String toDate) {
		this.toDate = toDate;
	}

	public String getPartNo() {
		return partNo;
	}

	public void setPartNo(String partNo) {
		this.partNo = partNo;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

}
