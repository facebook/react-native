package com.incture.lch.util;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

@Entity
@Table(name = "T_LCH_SEQ_NUMBER_ADHOC")
@NamedQuery(name = "SequenceNumberAdhoc.getAll", query = "SELECT seq FROM SequenceNumberAdhoc seq")
public class SequenceNumberAdhoc {

	@Id
	@Column(name = "REFERENCE_CODE")
	private String referenceCode;

	@Column(name = "RUNNING_NUMBER")
	private Integer runningNumber;

	public SequenceNumberAdhoc() {
	}

	public SequenceNumberAdhoc(String referenceCode, Integer runningNumber) {
		this.referenceCode = referenceCode;
		this.runningNumber = runningNumber;
	}

	public String getReferenceCode() {
		return referenceCode;
	}

	public void setReferenceCode(String referenceCode) {
		this.referenceCode = referenceCode;
	}

	public Integer getRunningNumber() {
		return runningNumber;
	}

	public void setRunningNumber(Integer runningNumber) {
		this.runningNumber = runningNumber;
	}

}
