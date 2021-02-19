package com.incture.lch.adhoc.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "T_DIVISIONS")
public class LkDivisions implements Serializable {

	private static final long serialVersionUID = -8233881939574383612L;

	@Id
	@Column(name = "DUNS_NUM", length = 20)
	private String dunsNumber;
	
	
	@Column(name = "DIVISION_NAME", length = 50)
	private String divisionName;

	

	public String getDivisionName() {
		return divisionName;
	}

	public void setDivisionName(String divisionName) {
		this.divisionName = divisionName;
	}

	public String getDunsNumber() {
		return dunsNumber;
	}

	public void setDunsNumber(String dunsNumber) {
		this.dunsNumber = dunsNumber;
	}

}
