package com.incture.lch.adhoc.custom.dto;

public class WorkflowCustomDto {

	private String orderIdDetails;
	private String taskIdDetails;

	public String getOrderIdDetails() {
		return orderIdDetails;
	}

	public void setOrderIdDetails(String orderIdDetails) {
		this.orderIdDetails = orderIdDetails;
	}

	public String getTaskIdDetails() {
		return taskIdDetails;
	}

	public void setTaskIdDetails(String taskIdDetails) {
		this.taskIdDetails = taskIdDetails;
	}

	@Override
	public String toString() {
		return "WorkflowCustomDto [orderIdDetails=" + orderIdDetails + ", taskIdDetails=" + taskIdDetails + "]";
	}

}
