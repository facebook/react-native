package com.incture.lch.adhoc.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "REASON_CODE")
public class ReasonCode implements Serializable {

	private static final long serialVersionUID = 6442445879975799175L;

	@Id
	@Column(name = "KEY")
	private String reasonCodeKey;

	@Column(name = "VALUE")
	private String reasonCodeValue;

	public String getReasonCodeKey() {
		return reasonCodeKey;
	}

	public void setReasonCodeKey(String reasonCodeKey) {
		this.reasonCodeKey = reasonCodeKey;
	}

	public String getReasonCodeValue() {
		return reasonCodeValue;
	}

	public void setReasonCodeValue(String reasonCodeValue) {
		this.reasonCodeValue = reasonCodeValue;
	}

}
