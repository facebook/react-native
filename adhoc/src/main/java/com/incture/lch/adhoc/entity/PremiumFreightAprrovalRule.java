package com.incture.lch.adhoc.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name="PREMIUM_FREIGHT_APPROVAL_RULE")
public class PremiumFreightAprrovalRule 
{
	@Id
	@Column(name="ID")
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long id;
	
	@Column(name="SHIP_TO")
	private String shipTo;
	
	@Column(name="COST_MIN")
	private int cost_min;
	
	@Column(name="COST_MAX")
	private int cost_max;

	@Column(name="APPROVER")
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
