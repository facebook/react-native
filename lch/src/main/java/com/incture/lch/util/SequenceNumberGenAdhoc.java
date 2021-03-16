package com.incture.lch.util;

import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.criterion.Restrictions;

import com.incture.lch.util.SequenceNumberAdhoc;

public class SequenceNumberGenAdhoc {

	private static SequenceNumberGenAdhoc sequenceNumberGenerator;

	SequenceNumberAdhoc sequenceNumber = null;
	private static int oldRunningNumber = 0;
	private static String oldRefCode = "";

	public SequenceNumberGenAdhoc() {
	}

	public static synchronized SequenceNumberGenAdhoc getInstance() {
		return sequenceNumberGenerator == null ? sequenceNumberGenerator = new SequenceNumberGenAdhoc()
				: sequenceNumberGenerator;
	}

	/**
	 * Generates a code in CCCCXXYYYYMMNNNN format, where CCCC is Company Code,
	 * XX is Transaction Type, YYYY is year, MM is Month, NNNN is the number
	 * generated by this function. Input field <code>referenceCode</code> is
	 * CCCCXXYYYYMM and <code>noOfDigits</code> indicate size of NNNN. Function
	 * uses a variable of hash map data structure with application scope, where
	 * referenceCode parameter is the key and running number(sequential,
	 * incremented by 1, starting from 0) is the value. Function is thread-safe,
	 * map variable is lazy loaded once, and value persist to relevant table in
	 * CEDB on every request.
	 */
	public synchronized String getNextSeqNumber(String referenceCode, Integer noOfDigits, Session session) {
		Criteria criteria = session.createCriteria(SequenceNumberAdhoc.class);
		criteria.add(Restrictions.eq("referenceCode", referenceCode));

		sequenceNumber = (SequenceNumberAdhoc) criteria.uniqueResult();
		int runningNumber;
		if (sequenceNumber != null) {
			session.refresh(sequenceNumber);
			runningNumber = updateRecord(sequenceNumber, session);
			if (oldRunningNumber == runningNumber && oldRefCode.equals(referenceCode)) {// to
																						// avoid
																						// duplicates
				Criteria criteria1 = session.createCriteria(SequenceNumberAdhoc.class);
				criteria1.add(Restrictions.eq("referenceCode", referenceCode));

				sequenceNumber = (SequenceNumberAdhoc) criteria1.uniqueResult();
				runningNumber = updateRecord(sequenceNumber, session);
			}
		} else {
			runningNumber = pushRecord(referenceCode, session);
		}
		oldRunningNumber = runningNumber;
		oldRefCode = referenceCode;
		return buildSeqNumber(referenceCode, noOfDigits, runningNumber);
	}

	private String buildSeqNumber(String referenceCode, Integer noOfDigits, int runningNumber) {
		StringBuffer sb = new StringBuffer(noOfDigits);
		sb.append(runningNumber);
		int noOfPads = noOfDigits - sb.length();
		while (noOfPads-- > 0) {
			sb.insert(0, '0');
		}
		sb.insert(0, referenceCode);
		return sb.toString();
	}

	private int pushRecord(String referenceCode, Session session) {
		SequenceNumberAdhoc sequenceNumber = new SequenceNumberAdhoc(referenceCode, 1);
		// NOTE: Hard coding to zero
		session.persist(sequenceNumber);
		return sequenceNumber.getRunningNumber();
	}

	private int updateRecord(SequenceNumberAdhoc sequenceNumber, Session session) {
		int runningnumber = 0;
		sequenceNumber.setRunningNumber(sequenceNumber.getRunningNumber() + 1);

		session.persist(sequenceNumber);
		session.flush();
		session.refresh(sequenceNumber);
		Criteria criteria = session.createCriteria(SequenceNumberAdhoc.class);
		criteria.add(Restrictions.eq("referenceCode", sequenceNumber.getReferenceCode()));

		SequenceNumberAdhoc retDto1 = (SequenceNumberAdhoc) criteria.uniqueResult();
		if (retDto1 != null) {
			runningnumber = retDto1.getRunningNumber();
		}
		
		return runningnumber;
	}

}
