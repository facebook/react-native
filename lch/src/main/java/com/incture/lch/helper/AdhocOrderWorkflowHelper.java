package com.incture.lch.helper;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.criterion.Restrictions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.dao.AdhocOrderWorkflowDao;
import com.incture.lch.dto.AdhocOrderWorkflowDto;
import com.incture.lch.entity.AdhocOrders;

@Repository
public class AdhocOrderWorkflowHelper {

	@Autowired
	private AdhocOrderWorkflowDao workflowDao;

	@Autowired
	// @Qualifier("sessionDb")
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	@SuppressWarnings({ "deprecation", "unchecked" })
	public String updateWorflowDetails(AdhocOrderWorkflowDto workflowDto) {
		System.out.println("Yuhooo" + workflowDto.getAdhocOrderId());

		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<AdhocOrders> adhocOrder = new ArrayList<AdhocOrders>();
		Criteria criteria = session.createCriteria(AdhocOrders.class);
		criteria.add(Restrictions.eq("fwoNum", workflowDto.getAdhocOrderId()));
		adhocOrder = criteria.list();

		System.out.println(adhocOrder.size());
		for (AdhocOrders a : adhocOrder) {

			System.out.println(a.getFwoNum());
			a.setUpdatedBy(workflowDto.getUpdatedBy());
			a.setUpdatedDate((workflowDto.getUpdatedDate()));
			a.setStatus(workflowDto.getStatus());
			a.setPendingWith(workflowDto.getPendingWith());
			session.saveOrUpdate(a);
		}

		session.save(workflowDao.importAdhocWorkflow(workflowDto));

		session.flush();
		session.clear();
		tx.commit();
		session.close();

		System.out.println(workflowDto.getAdhocOrderId());
		return workflowDto.getAdhocOrderId();
	}

}
