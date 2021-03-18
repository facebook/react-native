package com.incture.lch.dao;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.dto.AdhocOrderWorkflowDto;
import com.incture.lch.entity.AdhocOrderWorkflow;

@Repository("adhocOrderWorkflowDao")
public class AdhocOrderWorkflowDao {

	private static final Logger LOGGER = LoggerFactory.getLogger(AdhocOrderWorkflowDao.class);

	@Autowired
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	public AdhocOrderWorkflow importAdhocWorkflow(AdhocOrderWorkflowDto dto) {
		AdhocOrderWorkflow ruleDo = new AdhocOrderWorkflow();
		ruleDo.setId(dto.getId());
		ruleDo.setAdhocOrderId(dto.getAdhocOrderId());
		ruleDo.setDefinitionId(dto.getDefinitionId());
		ruleDo.setInstanceId(dto.getInstanceId());
		ruleDo.setPendingWith(dto.getPendingWith());
		ruleDo.setRequestedBy(dto.getRequestedBy());
		ruleDo.setRequestedDate(dto.getRequestedDate());
		ruleDo.setStatus(dto.getStatus());
		ruleDo.setSubject(dto.getSubject());
		ruleDo.setUpdatedBy(dto.getUpdatedBy());
		ruleDo.setUpdatedDate(dto.getUpdatedDate());
		ruleDo.setWorkflowName(dto.getWorkflowName());
		ruleDo.setBusinessKey(dto.getBusinessKey());
		ruleDo.setDescription(dto.getDescription());
		return ruleDo;

	}

	public AdhocOrderWorkflowDto exportAdhocWorkflow(AdhocOrderWorkflow ruledo) {
		AdhocOrderWorkflowDto ruleDto = new AdhocOrderWorkflowDto();
		ruleDto.setId(ruledo.getId());
		ruleDto.setAdhocOrderId(ruledo.getAdhocOrderId());
		ruleDto.setDefinitionId(ruledo.getDefinitionId());
		ruleDto.setInstanceId(ruledo.getInstanceId());
		ruleDto.setPendingWith(ruledo.getPendingWith());
		ruleDto.setRequestedBy(ruledo.getRequestedBy());
		ruleDto.setRequestedDate(ruledo.getRequestedDate());
		ruleDto.setStatus(ruledo.getStatus());
		ruleDto.setSubject(ruledo.getSubject());
		ruleDto.setUpdatedBy(ruledo.getUpdatedBy());
		ruleDto.setUpdatedDate(ruledo.getUpdatedDate());
		ruleDto.setWorkflowName(ruledo.getWorkflowName());
		ruleDto.setBusinessKey(ruledo.getBusinessKey());
		ruleDto.setDescription(ruledo.getDescription());
		return ruleDto;

	}

	public void saveWorkFlowDetails(AdhocOrderWorkflowDto workflowDto) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		session.save(importAdhocWorkflow(workflowDto));
		session.flush();
		session.clear();
		tx.commit();
		session.close();
	}

	
}
