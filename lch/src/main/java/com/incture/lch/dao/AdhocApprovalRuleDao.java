package com.incture.lch.dao;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.query.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.dto.AdhocApprovalRuleDto;
import com.incture.lch.entity.AdhocApprovalRule;
import com.incture.lch.entity.ReasonCode;

@Repository("adhocApprovalRuleDao")
public class AdhocApprovalRuleDao {

	private static final Logger LOGGER = LoggerFactory.getLogger(AdhocApprovalRuleDao.class);

	@Autowired
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	public AdhocApprovalRule importApprovalRule(AdhocApprovalRuleDto dto) {
		AdhocApprovalRule ruleDo = new AdhocApprovalRule();
		ruleDo.setId(dto.getId());
		ruleDo.setAdhocType(dto.getAdhocType());
		ruleDo.setUserGroup(dto.getUserGroup());
		ruleDo.setApproverType(dto.getApproverType());
		ruleDo.setApproverEmail(dto.getApproverEmail());
		return ruleDo;

	}

	public AdhocApprovalRuleDto exportApprovalRule(AdhocApprovalRule ruledo) {
		AdhocApprovalRuleDto ruleDto = new AdhocApprovalRuleDto();
		ruleDto.setId(ruledo.getId());
		ruleDto.setAdhocType(ruledo.getAdhocType());
		ruleDto.setUserGroup(ruledo.getUserGroup());
		ruleDto.setApproverType(ruledo.getApproverType());
		ruleDto.setApproverEmail(ruledo.getApproverEmail());
		return ruleDto;

	}

	// @SuppressWarnings("deprecation")
	public Boolean saveApproval(List<AdhocApprovalRuleDto> ruleList) {
		LOGGER.error("Enter into adhocApprovalRuleDao saveApproval");
		Boolean isSaved = false;
		// LOGGER.error("Enter into adhocApprovalRuleDao session check
		// "+sessionFactory.);
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		for (AdhocApprovalRuleDto dto : ruleList) {
			try {
				LOGGER.error("Enter into adhocApprovalRuleDao saveApproval end here " + dto.getAdhocType() + " - "
						+ dto.getApproverEmail() + "- " + dto.getApproverType() + " - " + dto.getUserGroup());
				session.save(importApprovalRule(dto));
			} catch (Exception e) {
				throw new RuntimeException("Error while saving data:: " + e.toString());
			}
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		LOGGER.error("Enter into adhocApprovalRuleDao saveApproval end here " + isSaved);
		return isSaved;

	}

	public List<AdhocApprovalRuleDto> getAllAdhocApprovalList() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<AdhocApprovalRuleDto> appRuleList = new ArrayList<>();
		List<AdhocApprovalRule> appRule = new ArrayList<>();

		try {
			String queryStr = "select rule from AdhocApprovalRule rule";
			Query query = session.createQuery(queryStr);
			appRule = query.list();
			for (AdhocApprovalRule lkDiv : appRule) {
				appRuleList.add(exportApprovalRule(lkDiv));
			}
		} catch (Exception e) {
			LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return appRuleList;

	}
	
	public List<AdhocApprovalRuleDto> getAdhocApprovalsByAdhocTypeAndApprovalType(String type) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<AdhocApprovalRuleDto> appRuleList = new ArrayList<>();
		String queryStr = "select rc from AdhocApprovalRule rc where rc.adhocType=:adhocType";
		Query query = session.createQuery(queryStr);
		query.setParameter("adhocType", type);
		@SuppressWarnings("unchecked")
		List<AdhocApprovalRule> listData = query.list();
		for (AdhocApprovalRule rule : listData) {
			appRuleList.add(exportApprovalRule(rule));
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return appRuleList;
	}

}
