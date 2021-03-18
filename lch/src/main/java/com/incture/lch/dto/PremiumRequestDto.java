package com.incture.lch.dto;

import java.util.Date;

public class PremiumRequestDto
{
	private String adhocOrderId;
	private Date createdDate;
	private String fromDate;
	private String toDate;
	private String partNo;
	private String plannerEmail;
	private String status;
	private String OriginName;
	private String DestinationName;
	
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
	public String getPlannerEmail() {
		return plannerEmail;
	}
	public void setPlannerEmail(String plannerEmail) {
		this.plannerEmail = plannerEmail;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public String getOriginName() {
		return OriginName;
	}
	public void setOriginName(String originName) {
		OriginName = originName;
	}
	public String getDestinationName() {
		return DestinationName;
	}
	public void setDestinationName(String destinationName) {
		DestinationName = destinationName;
	}
	
	

	
}
