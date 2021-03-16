package com.incture.lch.adhoc.dto;

import java.util.Date;

public class AdhocOrderWorkflowDto {

	private Long id;
	private String adhocOrderId;
	private String workflowName;
	private String requestedBy;
	private Date requestedDate;
	private String instanceId;
	private String definitionId;
	private String subject;
	private String updatedBy;
	private Date updatedDate;
	private String status;
	private String pendingWith;
	private String businessKey;
	private String description;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public String getRequestedBy() {
		return requestedBy;
	}

	public void setRequestedBy(String requestedBy) {
		this.requestedBy = requestedBy;
	}

	public Date getRequestedDate() {
		return requestedDate;
	}

	public void setRequestedDate(Date requestedDate) {
		this.requestedDate = requestedDate;
	}

	public String getInstanceId() {
		return instanceId;
	}

	public void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	public String getDefinitionId() {
		return definitionId;
	}

	public void setDefinitionId(String definitionId) {
		this.definitionId = definitionId;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}

	public Date getUpdatedDate() {
		return updatedDate;
	}

	public void setUpdatedDate(Date updatedDate) {
		this.updatedDate = updatedDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getPendingWith() {
		return pendingWith;
	}

	public void setPendingWith(String pendingWith) {
		this.pendingWith = pendingWith;
	}

	public String getWorkflowName() {
		return workflowName;
	}

	public void setWorkflowName(String workflowName) {
		this.workflowName = workflowName;
	}

	public String getBusinessKey() {
		return businessKey;
	}

	public void setBusinessKey(String businessKey) {
		this.businessKey = businessKey;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@Override
	public String toString() {
		return "AdhocOrderWorkflowDto [id=" + id + ", adhocOrderId=" + adhocOrderId + ", workflowName=" + workflowName
				+ ", requestedBy=" + requestedBy + ", requestedDate=" + requestedDate + ", instanceId=" + instanceId
				+ ", definitionId=" + definitionId + ", subject=" + subject + ", updatedBy=" + updatedBy
				+ ", updatedDate=" + updatedDate + ", status=" + status + ", pendingWith=" + pendingWith
				+ ", businessKey=" + businessKey + ", description=" + description + "]";
	}

}
