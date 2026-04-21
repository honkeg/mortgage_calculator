/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  Calendar, 
  Wallet, 
  Download, 
  ArrowRightLeft, 
  Zap,
  Info,
  Clock,
  CircleDollarSign
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  compareStrategies, 
  RepaymentPlan
} from './lib/mortgageUtils';

type RepaymentType = 'principal' | 'installment';

export default function App() {
  // Input States
  const [principal, setPrincipal] = useState(78); // in ten thousand
  const [rate, setRate] = useState(3.0);
  const [years, setYears] = useState(28);
  const [prepay, setPrepay] = useState(10);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('principal');
  const [extraYearly, setExtraYearly] = useState(0);

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');

  // Calculations
  const results = useMemo(() => {
    const P = principal * 10000;
    const R = rate / 100;
    const M = years * 12;
    const Pre = prepay * 10000;

    return compareStrategies(P, R, M, Pre, repaymentType);
  }, [principal, rate, years, prepay, repaymentType]);

  const { plan1, plan2 } = results;
  const interestSaved = plan1.totalInterest - plan2.totalInterest;
  const timeSavedMonths = plan1.totalMonths - plan2.totalMonths;

  // Dynamic Strategy Simulation
  const dynamicResults = useMemo(() => {
    if (extraYearly <= 0) return null;

    const monthlyRate = rate / 100 / 12;
    const P_initial = (principal - prepay) * 10000;
    let remaining = P_initial;
    let month = 0;
    let totalInterest = 0;
    const details = [];
    
    const originalMonthlyPrincipal = (principal * 10000) / (years * 12);

    while (remaining > 0.01 && month < 360) {
      month++;
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      
      const pay_principal = Math.min(originalMonthlyPrincipal, remaining);
      remaining -= pay_principal;

      if (month % 12 === 0 && extraYearly > 0) {
        const extra = Math.min(extraYearly * 10000, remaining);
        remaining -= extra;
      }

      details.push({ month, remaining: Math.max(0, remaining), totalInterest });
      if (remaining <= 0) break;
    }

    return { month, totalInterest, details };
  }, [principal, rate, years, prepay, extraYearly]);

  // Export CSV Helper
  const exportCSV = (plan: RepaymentPlan, name: string) => {
    const headers = ['期数', '月供', '本金', '利息', '剩余本金'];
    const rows = plan.details.map(d => [
      d.month,
      d.payment.toFixed(2),
      d.principal.toFixed(2),
      d.interest.toFixed(2),
      d.remainingPrincipal.toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mortgage_${name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">房贷提前还款计算器</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mortgage Strategy Tool</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              专业逻辑 · 无广安全
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar - Controls */}
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <Wallet className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-700">基础参数</h2>
              </div>

              {/* Repayment Type Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">还款方式</label>
                <div className="flex p-1 bg-slate-100/80 rounded-2xl">
                  <button 
                    onClick={() => setRepaymentType('principal')}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200",
                      repaymentType === 'principal' ? "bg-white text-blue-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    等额本金
                  </button>
                  <button 
                    onClick={() => setRepaymentType('installment')}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200",
                      repaymentType === 'installment' ? "bg-white text-blue-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    等额本息
                  </button>
                </div>
              </div>

              {/* Principal Input */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">剩余本金 (万元)</label>
                  <span className="text-xl font-black text-slate-800">{principal}</span>
                </div>
                <input 
                  type="range" min="10" max="1000" step="1"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="relative">
                  <input 
                    type="number" 
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs">万元</span>
                </div>
              </div>

              {/* Interest Rate Input */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">贷款利率 (%)</label>
                  <span className="text-xl font-black text-slate-800">{rate.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="0.05"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="relative">
                  <input 
                    type="number" 
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs">%</span>
                </div>
              </div>

              {/* Years Input */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">剩余年限 (年)</label>
                  <span className="text-xl font-black text-slate-800">{years}</span>
                </div>
                <input 
                  type="range" min="1" max="30" step="1"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setYears(Math.max(1, years-1))} className="py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 font-bold transition-colors text-slate-600 border border-slate-100">- 1 年</button>
                  <button onClick={() => setYears(Math.min(30, years+1))} className="py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 font-bold transition-colors text-slate-600 border border-slate-100">+ 1 年</button>
                </div>
              </div>

              {/* Prepayment Input */}
              <div className="space-y-4 bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-blue-100 uppercase tracking-wider">本次提前还款</label>
                  <span className="text-xl font-black text-white">{prepay} 万元</span>
                </div>
                <input 
                  type="range" min="0" max={principal} step="1"
                  value={prepay}
                  onChange={(e) => setPrepay(Number(e.target.value))}
                  className="w-full h-1.5 bg-blue-400/30 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex items-start gap-2.5 text-[10px] text-blue-100 font-medium leading-relaxed opacity-80 bg-blue-800/20 p-3 rounded-xl border border-blue-400/20">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>系统将演算：1. 期限不变，月供大幅降低；2. 月供极力维持，期限大幅缩短。</span>
                </div>
              </div>
            </div>

            {/* Aggressive Strategy Input */}
            <div className="bg-slate-900 rounded-[2rem] shadow-2xl p-7 text-white space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 p-1.5 rounded-lg">
                  <Zap className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">激进偿还模拟</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Aggressive Repayment Strategy</p>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">每年额外还款金额</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={extraYearly}
                    onChange={(e) => setExtraYearly(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-yellow-400 placeholder:text-slate-600"
                    placeholder="例如：5 (万元)"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">万元 / 年</span>
                </div>
              </div>

              {dynamicResults && (
                <div className="bg-slate-800/40 rounded-2xl p-5 space-y-4 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">结清周期</span>
                    <span className="text-lg text-yellow-400 font-black">{(dynamicResults.month / 12).toFixed(1)} 年</span>
                  </div>
                  <div className="h-px bg-slate-800 w-full" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">相比缩短期限再省</span>
                    <span className="text-lg text-emerald-400 font-black">¥ {(plan2.totalInterest - dynamicResults.totalInterest).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Main Content Area */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* Outcome Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute -right-4 -bottom-4 bg-emerald-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-emerald-100 p-1.5 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">最佳省钱 (缩短期限)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">相比【减少月供】方案可额外节省利息：</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                    <span className="text-xl font-bold mr-1">¥</span>
                    {interestSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </h3>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-emerald-600 font-black text-[10px] tracking-widest relative z-10">
                  ESTIMATED SAVINGS +{((interestSaved / plan1.totalInterest) * 100).toFixed(1)}%
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute -right-4 -bottom-4 bg-blue-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">缩短期限模式</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">您的贷款将提前结清：</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                    {timeSavedMonths} 
                    <span className="text-xl font-bold ml-1 text-slate-400">个月</span>
                  </h3>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-blue-600 font-black text-[10px] tracking-widest relative z-10 uppercase">
                  Time Savings {(timeSavedMonths / 12).toFixed(1)} Years
                </div>
              </motion.div>
            </div>

            {/* Strategy Comparison Visual */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">核心指标横向对比</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Metrics Benchmarking</p>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl w-fit self-start">
                  <button onClick={() => setActiveTab('overview')} className={cn("px-4 py-1.5 text-[11px] font-black rounded-lg transition-all", activeTab === 'overview' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}>核心指标</button>
                  <button onClick={() => setActiveTab('detail')} className={cn("px-4 py-1.5 text-[11px] font-black rounded-lg transition-all", activeTab === 'detail' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}>月供明细</button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Charts */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">利息支出趋势对比分析</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-slate-500">减少月供</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500">缩短期限</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={plan1.details.filter((_, i) => i % 6 === 0).map((d, i) => {
                              const p1_interest = plan1.details.slice(0, d.month).reduce((acc, curr) => acc + curr.interest, 0);
                              const p2_interest = plan2.details[d.month - 1] 
                                ? plan2.details.slice(0, d.month).reduce((acc, curr) => acc + curr.interest, 0) 
                                : plan2.totalInterest;
                              return { month: d.month, p1: p1_interest, p2: p2_interest };
                            })}
                          >
                            <defs>
                              <linearGradient id="chartP1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="chartP2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="month" hide />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                              labelStyle={{ fontWeight: '900', color: '#64748b', fontSize: '12px', marginBottom: '8px' }}
                              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                              labelFormatter={(val) => `累计还款第 ${val} 个月`}
                              formatter={(val: number) => ['¥ ' + val.toLocaleString(undefined, { maximumFractionDigits: 0 }), '']}
                            />
                            <Area type="monotone" dataKey="p1" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#chartP1)" />
                            <Area type="monotone" dataKey="p2" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#chartP2)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Table Benchmarking */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-1 h-4 bg-blue-600 rounded-full" />
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">策略 A：减少月供</span>
                        </div>
                        <div className="bg-slate-50/50 rounded-3xl p-5 space-y-4 border border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-bold">还款总月数</span>
                            <span className="text-sm font-black text-slate-700">{plan1.totalMonths} 期</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-bold">首月还款</span>
                            <span className="text-sm font-black text-slate-700">¥ {plan1.firstMonthPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">总利息支出</span>
                            <span className="text-lg font-black text-blue-600">¥ {plan1.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">策略 B：缩短期限</span>
                        </div>
                        <div className="bg-emerald-50/20 rounded-3xl p-5 space-y-4 border border-emerald-100/50 shadow-sm shadow-emerald-50">
                          <div className="flex justify-between items-center text-emerald-700">
                            <span className="text-xs font-bold opacity-60">还款总月数</span>
                            <span className="text-sm font-black">{plan2.totalMonths} 期</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-700">
                            <span className="text-xs font-bold opacity-60">首月还款</span>
                            <span className="text-sm font-black">¥ {plan2.firstMonthPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 text-emerald-700">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60">总利息支出</span>
                            <span className="text-lg font-black">¥ {plan2.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="detail"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">缩短期限明细 (首 100 期)</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => exportCSV(plan1, 'reduce_payment')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" /> 减少月供 CSV
                        </button>
                        <button 
                          onClick={() => exportCSV(plan2, 'shorten_term')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-100 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> 缩短期限 CSV
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto rounded-[2rem] border border-slate-100 bg-slate-50/20 custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="bg-white sticky top-0 border-b border-slate-100">
                          <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase">期数</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase">月供额</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase">偿还本金</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase">利息支出</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase">剩余本金</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {plan2.details.slice(0, 100).map(d => (
                            <tr key={d.month} className="hover:bg-white transition-colors duration-200">
                              <td className="p-6 text-sm font-black text-slate-700">{d.month}</td>
                              <td className="p-6 text-sm font-bold text-slate-900">¥ {Math.round(d.payment).toLocaleString()}</td>
                              <td className="p-6 text-xs font-medium text-slate-500">¥ {Math.round(d.principal).toLocaleString()}</td>
                              <td className="p-6 text-xs font-medium text-slate-500">¥ {Math.round(d.interest).toLocaleString()}</td>
                              <td className="p-6">
                                <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600">
                                  ¥ {Math.round(d.remainingPrincipal).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-2 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        列表默认展示前 100 期预测数据。如需获取从现在开始到还清为止的完整数据档案，请点击上方按钮导出 CSV 文档进行离线分析。
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Insight Recommendation */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative group">
              <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <TrendingDown className="w-40 h-40" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  策略洞察与决策建议
                </h3>
                <div className="space-y-4 text-sm text-slate-500 leading-relaxed font-medium">
                  <p>
                    基于当下 <span className="text-blue-600 font-bold">{rate}%</span> 的利率环境，缩短期限相对于单次降低月供，在整个贷款周期内能多省下 <span className="text-slate-900 font-black underline decoration-blue-500 underline-offset-4 decoration-2">¥ {interestSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> 的利息。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-800 mb-2 uppercase tracking-widest">什么时候选减少月供?</h4>
                      <ul className="text-[11px] space-y-2 list-disc pl-4 opacity-80">
                        <li>当下现金流压力大，近期家庭开支较多</li>
                        <li>处于创业初期或收入具有波动性</li>
                        <li>这笔钱有更好的低风险理财去处（超过 {rate}%）</li>
                      </ul>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-800 mb-2 uppercase tracking-widest">什么时候选缩短期限?</h4>
                      <ul className="text-[11px] space-y-2 list-disc pl-4 opacity-80">
                        <li>收入稳定，追求最极致的“无债一身轻”</li>
                        <li>未来 5-10 年内有置换大房子、卖旧买新的计划</li>
                        <li>由于本金归还速度快，后续提前偿还时利息基数极小</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
