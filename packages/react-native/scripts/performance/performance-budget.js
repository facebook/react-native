/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*::
type MetricStats = $ReadOnly<{
  +[stat: string]: number,
}>;

type FlowMetrics = $ReadOnly<{
  +[metric: string]: MetricStats,
}>;

type BudgetMetric = $ReadOnly<{
  +[stat: string]: number,
  +maxRegressionPct?: number,
}>;

type BudgetFlow = $ReadOnly<{
  +[metric: string]: BudgetMetric,
}>;

type PerformanceBudget = $ReadOnly<{
  +flows: $ReadOnly<{
    +[flow: string]: BudgetFlow,
  }>,
}>;

type PerformanceReport = $ReadOnly<{
  +flow: string,
  +metrics: FlowMetrics,
}>;

type AbsoluteFailure = $ReadOnly<{
  +type: 'absolute',
  +flow: string,
  +metric: string,
  +stat: string,
  +actual: number,
  +budget: number,
  +message: string,
}>;

type RegressionFailure = $ReadOnly<{
  +type: 'regression',
  +flow: string,
  +metric: string,
  +stat: string,
  +actual: number,
  +baseline: number,
  +regressionPct: number,
  +maxRegressionPct: number,
  +message: string,
}>;

type Failure = AbsoluteFailure | RegressionFailure;

type Warning = $ReadOnly<{
  +flow: string,
  +metric?: string,
  +stat?: string,
  +message: string,
}>;

type BudgetResult = $ReadOnly<{
  +ok: boolean,
  +failures: $ReadOnlyArray<Failure>,
  +warnings: $ReadOnlyArray<Warning>,
}>;
*/

function reportByFlow(
  reports /*: $ReadOnlyArray<PerformanceReport> */,
) /*: Map<string, PerformanceReport> */ {
  const byFlow = new Map /*:: <string, PerformanceReport> */();
  for (const report of reports) {
    byFlow.set(report.flow, report);
  }
  return byFlow;
}

function checkPerformanceBudget(
  budget /*: PerformanceBudget */,
  reports /*: $ReadOnlyArray<PerformanceReport> */,
  baselineReports /*: $ReadOnlyArray<PerformanceReport> */ = [],
) /*: BudgetResult */ {
  const failures /*: Array<Failure> */ = [];
  const warnings /*: Array<Warning> */ = [];
  const reportsByFlow = reportByFlow(reports);
  const baselinesByFlow = reportByFlow(baselineReports);

  for (const flow of Object.keys(budget.flows)) {
    const report = reportsByFlow.get(flow);
    if (report == null) {
      warnings.push({
        flow,
        message: `${flow} has no performance report`,
      });
      continue;
    }

    const budgetedMetrics = budget.flows[flow];
    for (const metric of Object.keys(budgetedMetrics)) {
      const metricStats = report.metrics[metric];
      if (metricStats == null) {
        warnings.push({
          flow,
          metric,
          message: `${flow} ${metric} has no reported metrics`,
        });
        continue;
      }

      const budgetedStats = budgetedMetrics[metric];
      for (const stat of Object.keys(budgetedStats)) {
        if (stat === 'maxRegressionPct') {
          continue;
        }

        const budgetValue = budgetedStats[stat];
        const actual = metricStats[stat];
        if (actual == null) {
          warnings.push({
            flow,
            metric,
            stat,
            message: `${flow} ${metric} has no reported ${stat} value`,
          });
          continue;
        }

        if (actual > budgetValue) {
          failures.push({
            type: 'absolute',
            flow,
            metric,
            stat,
            actual,
            budget: budgetValue,
            message: `${flow} ${metric} ${stat} is ${actual}, exceeding budget ${budgetValue}`,
          });
        }

        const maxRegressionPct = budgetedStats.maxRegressionPct;
        if (maxRegressionPct != null) {
          const baseline = baselinesByFlow.get(flow)?.metrics[metric]?.[stat];
          if (baseline == null || baseline <= 0) {
            warnings.push({
              flow,
              metric,
              stat,
              message: `${flow} ${metric} ${stat} has no baseline value for regression comparison`,
            });
            continue;
          }

          const regressionPct = ((actual - baseline) / baseline) * 100;
          if (regressionPct > maxRegressionPct) {
            failures.push({
              type: 'regression',
              flow,
              metric,
              stat,
              actual,
              baseline,
              regressionPct,
              maxRegressionPct,
              message: `${flow} ${metric} ${stat} regressed by ${regressionPct.toFixed(
                2,
              )}%, exceeding allowed regression ${maxRegressionPct}%`,
            });
          }
        }
      }
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
  };
}

module.exports = {
  checkPerformanceBudget,
};
