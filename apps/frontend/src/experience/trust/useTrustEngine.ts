/**
 * useTrustEngine Hook - Trust score orchestration with audit integration
 * Computes dynamic trust scores based on organization audit history
 */

import { useState, useEffect } from 'react';
import { getAuditEvents } from '../../services/auditService';

export interface TrustEngineResult {
  trustScore: number;
  riskFlags: string[];
  confidenceLabel:
    | 'High Confidence'
    | 'Moderate Confidence'
    | 'Risk Review Recommended';
}

/**
 * Hook for computing and tracking trust score for an organization
 * @param orgId Organization identifier
 * @returns Trust score, risk flags, and confidence label
 */
export function useTrustEngine(orgId: string): TrustEngineResult {
  const [trustScore, setTrustScore] = useState<number>(100);
  const [riskFlags, setRiskFlags] = useState<string[]>([]);
  const [confidenceLabel, setConfidenceLabel] =
    useState<TrustEngineResult['confidenceLabel']>('High Confidence');

  useEffect(() => {
    async function computeTrust() {
      const events = await getAuditEvents(orgId);

      let score = 100;
      const flags: string[] = [];

      // No audit trail is a risk indicator
      if (!events || events.length === 0) {
        score -= 40;
        flags.push('No historical compliance activity recorded');
      }

      // Penalize based on warning/critical events
      events.forEach((e) => {
        if (e.level === 'warning') score -= 10;
        if (e.level === 'critical') score -= 25;
      });

      // Ensure score stays within bounds
      score = Math.max(0, Math.min(100, score));

      // Determine confidence label
      if (score >= 85) {
        setConfidenceLabel('High Confidence');
      } else if (score >= 65) {
        setConfidenceLabel('Moderate Confidence');
      } else {
        setConfidenceLabel('Risk Review Recommended');
      }

      setTrustScore(score);
      setRiskFlags(flags);
    }

    if (orgId) {
      computeTrust();
    }
  }, [orgId]);

  return { trustScore, riskFlags, confidenceLabel };
}
