package com.incture.lch.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "T_ADHOC_APPROVAL_RULE")
public class AdhocApprovalRule implements Serializable {

	private static final long serialVersionUID = -2976518896903069885L;

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	@Column(name = "ID")
	private Long id;

	@Column(name = "ADHOC_TYPE", columnDefinition = "NVARCHAR(200)")
	private String adhocType;

	@Column(name = "USER_GROUP", columnDefinition = "NVARCHAR(200)")
	private String userGroup;

	@Column(name = "APPROVER_TYP", columnDefinition = "NVARCHAR(200)")
	private String approverType;

	//@Column(name = "APPROVER", columnDefinition = "NVARCHAR(200)")
	//private String approverEmail;

	
	@Column(name = "USER_ID", columnDefinition = "NVARCHAR(200)")
	private String userId;
	
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

	/*public String getApproverEmail() {
		return approverEmail;
	}

	public void setApproverEmail(String approverEmail) {
		this.approverEmail = approverEmail;
	}*/

	
	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Override
	public String toString() {
		return "AdhocApprovalRule [id=" + id + ", adhocType=" + adhocType + ", userGroup=" + userGroup
				+ ", approverType=" + approverType + ", approverEmail=" + userId + "]";
	}

}
