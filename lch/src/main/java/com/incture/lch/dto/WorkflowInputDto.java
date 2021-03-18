package com.incture.lch.dto;

public class WorkflowInputDto {

	private String requestedBy;
	private String adhocType;
	private String manager;
	private String planner;
	private AdhocOrderDto adhocInfo;

	public String getRequestedBy() {
		return requestedBy;
	}

	public void setRequestedBy(String requestedBy) {
		this.requestedBy = requestedBy;
	}

	public String getAdhocType() {
		return adhocType;
	}

	public void setAdhocType(String adhocType) {
		this.adhocType = adhocType;
	}

	public AdhocOrderDto getAdhocInfo() {
		return adhocInfo;
	}

	public void setAdhocInfo(AdhocOrderDto adhocInfo) {
		this.adhocInfo = adhocInfo;
	}

	public String getManager() {
		return manager;
	}

	public void setManager(String manager) {
		this.manager = manager;
	}

	public String getPlanner() {
		return planner;
	}

	public void setPlanner(String planner) {
		this.planner = planner;
	}

	@Override
	public String toString() {
		return "WorkflowInputDto [requestedBy=" + requestedBy + ", adhocType=" + adhocType + ", manager=" + manager
				+ ", planner=" + planner + ", adhocInfo=" + adhocInfo + "]";
	}

}
