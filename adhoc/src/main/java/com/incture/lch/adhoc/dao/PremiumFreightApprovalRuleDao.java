package com.incture.lch.adhoc.dao;

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

import com.incture.lch.adhoc.dto.AdhocApprovalRuleDto;
import com.incture.lch.adhoc.dto.PremiumFreightApprovalRuleDTO;
import com.incture.lch.adhoc.entity.AdhocApprovalRule;
import com.incture.lch.adhoc.entity.PremiumFreightAprrovalRule;

@Repository
public class PremiumFreightApprovalRuleDao 
{
	private static final Logger LOGGER = LoggerFactory.getLogger(AdhocApprovalRuleDao.class);

	@Autowired
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	public PremiumFreightAprrovalRule importApprovalRule(PremiumFreightApprovalRuleDTO dto) {
		PremiumFreightAprrovalRule ruleDo = new PremiumFreightAprrovalRule();
		
		ruleDo.setId(dto.getId());
		ruleDo.setShipTo(dto.getShipTo());
		ruleDo.setCost_min(dto.getCost_min());
		ruleDo.setCost_max(dto.getCost_max());
		ruleDo.setApprover(dto.getApprover());
		return ruleDo;

	}

	public PremiumFreightApprovalRuleDTO exportApprovalRule(PremiumFreightAprrovalRule ruledo) {
		PremiumFreightApprovalRuleDTO ruleDto = new PremiumFreightApprovalRuleDTO();
		ruleDto.setId(ruledo.getId());
		ruleDto.setShipTo(ruledo.getShipTo());
		ruleDto.setCost_max(ruledo.getCost_max());
		ruleDto.setCost_min(ruledo.getCost_min());
		ruleDto.setApprover(ruledo.getApprover());
		return ruleDto;

	}

	// @SuppressWarnings("deprecation")
	public Boolean saveApproval(List<PremiumFreightApprovalRuleDTO> ruleList) {
		LOGGER.error("Enter into PremiunFreightApprovalRuleDTO saveApproval");
	    Boolean isSaved = false;
		// LOGGER.error("Enter into adhocApprovalRuleDao session check
		// "+sessionFactory.);
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		for (PremiumFreightApprovalRuleDTO dto : ruleList) {
			try {
				LOGGER.error("Enter into PremiunFreightApprovalRuleDTO saveApproval end here " + dto.getShipTo() + " - "
						+ dto.getCost_min() + "- " + dto.getCost_max() + " - " + dto.getApprover());
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

	public List<PremiumFreightApprovalRuleDTO> getAllPremiumApprovalList() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<PremiumFreightApprovalRuleDTO> appRuleList = new ArrayList<>();
		List<PremiumFreightAprrovalRule> appRule = new ArrayList<>();

		try {
			String queryStr = "select rule from PremiumFreightAprrovalRule rule";
			Query query = session.createQuery(queryStr);
			appRule = query.list();
			for (PremiumFreightAprrovalRule lkDiv : appRule) {
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

}
