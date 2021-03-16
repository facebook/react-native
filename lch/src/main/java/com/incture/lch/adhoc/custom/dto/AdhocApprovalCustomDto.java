package com.incture.lch.adhoc.custom.dto;

public class AdhocApprovalCustomDto {
	private String adhocType;
	private String userGroup;
	private String approverType;
	private String approverEmail;
	public String getAdhocType() {
		return adhocType;
	}
	public void setAdhocType(String adhocType) {
		this.adhocType = adhocType;
	}
	public String getUserGroup() {
		return userGroup;
	}
	public void setUserGroup(String userGroup) {
		this.userGroup = userGroup;
	}
	public String getApproverType() {
		return approverType;
	}
	public void setApproverType(String approverType) {
		this.approverType = approverType;
	}
	public String getApproverEmail() {
		return approverEmail;
	}
	public void setApproverEmail(String approverEmail) {
		this.approverEmail = approverEmail;
	}
	@Override
	public String toString() {
		return "AdhocApprovalCustomDto [adhocType=" + adhocType + ", userGroup=" + userGroup + ", approverType="
				+ approverType + ", approverEmail=" + approverEmail + "]";
	}
	
	

}
