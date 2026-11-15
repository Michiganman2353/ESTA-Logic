# Michigan ESTA: earned hours are not automatically capped at annual use limits

**Source of truth:** Michigan Department of Labor and Economic Opportunity,
[Earned Sick Time (ESTA) FAQ](https://www.michigan.gov/leo/bureaus-agencies/ber/wage-and-hour/frequently-asked-questions/wage-and-hour/earned-sick-time-faqs),
question 7 (accrual) and the questions on annual use, carryover,
frontloading and new-hire waiting periods.

- At the accrual method's statutory minimum, **30 worked hours yield 1
  earned-sick-time hour**. The employer may limit **use** to 40 paid hours
  in the benefit year for small businesses (10 or fewer employees) or
  72 hours for other covered employers; the limit **does not stop accrual**.
- Example: 1,800 hours worked -> 60 hours accrued. A small employer may
  limit annual use to 40, without deleting the additional accrued hours.
- Example: 2,700 hours worked -> 90 hours accrued. An employer may limit
  annual use to 72, not the accrual to 72.
- For the accrual method, carryover is separately limited to 40 or
  72 hours depending on covered employer size. A compliant policy may
  allow more generous annual use.
- The classification for small-business status may depend on workforce
  history (20 workweeks at 11+ employees). Do not infer eligibility
  solely from a one-day employee count without policy review.
- Frontloading, part-time prorated frontloading, grandfathering,
  waiting periods, reemployment and exempt employees require separate
  statutory scenario logic.

## Code mapping

- `calculateAccruedHours(worked)`: uncapped earned time.
- `calculateCappedAccrual(worked, employeeCount)`: **deprecated**
  historical API. Now deliberately returns uncapped accrual; migrate
  callers to `calculateAccruedHours`.
- `calculateAnnualUseLimit(employeeCount)`: statutory default
  40/72-hour *use* limit, assuming employer classification is confirmed.
- `calculateAvailableForUse(availableBank, usedThisYear, employeeCount)`:
  an arithmetic maximum before waiting-period, eligibility, leave reason,
  carryover and a more generous employer policy are evaluated.
- `MAX_ACCRUAL_*`: deprecated aliases kept to avoid breaking imports;
  use `MAX_ANNUAL_USE_*`.

This change corrects the **calculation model**, not the entire ESTA
eligibility or benefit-year engine. Human/legal review and additional
scenario tests are required before the service is advertised as
automatically determining employer compliance.
