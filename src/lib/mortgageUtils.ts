/**
 * Mortgage balance details for a specific month
 */
export interface PaymentDetail {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingPrincipal: number;
}

/**
 * Summary of a repayment plan
 */
export interface RepaymentPlan {
  details: PaymentDetail[];
  totalMonths: number;
  totalInterest: number;
  monthlyPrincipal?: number; // Only for Equal Principal
  firstMonthPayment: number;
  lastMonthPayment: number;
}

/**
 * Calculation for Equal Principal (等额本金)
 */
export function calculateEqualPrincipal(
  principal: number,
  annualRate: number,
  totalMonths: number
): RepaymentPlan {
  const monthlyRate = annualRate / 12;
  const monthlyPrincipal = principal / totalMonths;
  const details: PaymentDetail[] = [];
  let remaining = principal;
  let totalInterest = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const interest = remaining * monthlyRate;
    const payment = monthlyPrincipal + interest;
    totalInterest += interest;
    
    details.push({
      month,
      payment,
      principal: monthlyPrincipal,
      interest,
      remainingPrincipal: Math.max(0, remaining - monthlyPrincipal),
    });
    
    remaining -= monthlyPrincipal;
    if (remaining < 0.01) break;
  }

  return {
    details,
    totalMonths: details.length,
    totalInterest,
    monthlyPrincipal,
    firstMonthPayment: details[0]?.payment || 0,
    lastMonthPayment: details[details.length - 1]?.payment || 0,
  };
}

/**
 * Calculation for Equal Installment (等额本息)
 */
export function calculateEqualInstallment(
  principal: number,
  annualRate: number,
  totalMonths: number
): RepaymentPlan {
  const monthlyRate = annualRate / 12;
  // Formula: [Principal * MonthlyRate * (1 + MonthlyRate)^Months] / [(1 + MonthlyRate)^Months - 1]
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                  (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  const details: PaymentDetail[] = [];
  let remaining = principal;
  let totalInterest = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const interest = remaining * monthlyRate;
    const principalPaid = payment - interest;
    totalInterest += interest;
    
    details.push({
      month,
      payment,
      principal: principalPaid,
      interest,
      remainingPrincipal: Math.max(0, remaining - principalPaid),
    });
    
    remaining -= principalPaid;
    if (remaining < 0.01) break;
  }

  return {
    details,
    totalMonths: details.length,
    totalInterest,
    firstMonthPayment: payment,
    lastMonthPayment: payment,
  };
}

/**
 * Strategy comparison function
 */
export function compareStrategies(
  principal: number,
  annualRate: number,
  originalMonths: number,
  prepayAmount: number,
  type: 'principal' | 'installment'
) {
  const remainingPrincipal = principal - prepayAmount;
  
  // Plan 1: Keep term length, reduce monthly payment
  const plan1 = type === 'principal' 
    ? calculateEqualPrincipal(remainingPrincipal, annualRate, originalMonths)
    : calculateEqualInstallment(remainingPrincipal, annualRate, originalMonths);
  
  // Plan 2: Keep monthly principal (for principal) or monthly payment (for installment), shorten term
  let plan2: RepaymentPlan;
  if (type === 'principal') {
    const originalMonthlyPrincipal = principal / originalMonths;
    const newMonths = Math.ceil(remainingPrincipal / originalMonthlyPrincipal);
    plan2 = calculateEqualPrincipal(remainingPrincipal, annualRate, newMonths);
  } else {
    // For installment, we try to keep the same monthly payment
    const monthlyRate = annualRate / 12;
    const originalPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, originalMonths)) / 
                            (Math.pow(1 + monthlyRate, originalMonths) - 1);
    
    // Solve for N: Payment = [P * r * (1+r)^N] / [(1+r)^N - 1]
    // (1+r)^N = Payment / (Payment - P*r)
    // N * log(1+r) = log(Payment / (Payment - P*r))
    const ratio = originalPayment / (originalPayment - remainingPrincipal * monthlyRate);
    const newMonths = ratio > 0 ? Math.ceil(Math.log(ratio) / Math.log(1 + monthlyRate)) : 1;
    
    plan2 = calculateEqualInstallment(remainingPrincipal, annualRate, newMonths);
  }

  return { plan1, plan2 };
}
