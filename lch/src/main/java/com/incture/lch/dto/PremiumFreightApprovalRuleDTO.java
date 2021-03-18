package com.incture.lch.dto;

public class PremiumFreightApprovalRuleDTO 
{
    private Long id;
	
	private String shipTo;
	
	private int cost_min;
	
	private int cost_max;

	private String approver;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getShipTo() {
		return shipTo;
	}

	public void setShipTo(String shipTo) {
		this.shipTo = shipTo;
	}

	public int getCost_min() {
		return cost_min;
	}

	public void setCost_min(int cost_min) {
		this.cost_min = cost_min;
	}

	public int getCost_max() {
		return cost_max;
	}

	public void setCost_max(int cost_max) {
		this.cost_max = cost_max;
	}

	public String getApprover() {
		return approver;
	}

	public void setApprover(String approver) {
		this.approver = approver;
	}
	
	
	
	

}
