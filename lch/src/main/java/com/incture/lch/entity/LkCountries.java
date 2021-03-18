package com.incture.lch.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "T_COUNTRY")
public class LkCountries implements Serializable {

	private static final long serialVersionUID = -6180841737481482012L;

	@Id
	@Column(name = "COUNTRY_ID", length= 10)
	private String countryId;

	@Column(name = "COUNTRY_NAME",length=20)
	private String countryName;

	public String getCountryId() {
		return countryId;
	}

	public void setCountryId(String countryId) {
		this.countryId = countryId;
	}

	public String getCountryName() {
		return countryName;
	}

	public void setCountryName(String countryName) {
		this.countryName = countryName;
	}

	@Override
	public String toString() {
		return "LkCountries [countryId=" + countryId + ", countryName=" + countryName + "]";
	}

}
