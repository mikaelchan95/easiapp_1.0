import React from 'react';
import { CreditAccount } from '../../types/credit';
import { useCredit } from '../../hooks/useCredit';
import { TrendingUp, CalendarClock, BadgePercent, CircleDollarSign } from 'lucide-react';

interface CreditBalanceGridProps {
  creditAccount: CreditAccount;
}

const CreditBalanceGrid: React.FC<CreditBalanceGridProps> = ({ creditAccount }) => {
  const { creditUtilization } = useCredit();

  const getHealthColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-primary-600';
  };

  const getHealthText = (utilization: number) => {
    if (utilization >= 90) return 'At risk';
    if (utilization >= 70) return 'Caution';
    if (utilization >= 50) return 'Good';
    return 'Excellent';
  };

  const formatNextPaymentDue = () => {
    if (!creditAccount.nextPaymentDue) return 'No payments due';
    
    const dueDate = new Date(creditAccount.nextPaymentDue);
    const today = new Date();
    
    // Calculate days until due
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    
    return dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const metrics = [
    {
      title: 'Health',
      value: getHealthText(creditUtilization),
      valueColor: getHealthColor(creditUtilization),
      icon: <TrendingUp className="w-4 h-4 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-100'
    },
    {
      title: 'Next Due',
      value: formatNextPaymentDue(),
      valueColor: 'text-gray-900',
      icon: <CalendarClock className="w-4 h-4 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-100'
    },
    {
      title: 'Score',
      value: creditAccount.creditScore.toString(),
      valueColor: 'text-gray-900',
      icon: <BadgePercent className="w-4 h-4 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-100'
    },
    {
      title: 'Terms',
      value: `Net ${creditAccount.paymentTerms}`,
      valueColor: 'text-gray-900',
      icon: <CircleDollarSign className="w-4 h-4 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric, index) => (
        <div 
          key={index} 
          className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-3 shadow-sm`}
        >
          <div className="flex items-center space-x-1.5 mb-1">
            {metric.icon}
            <span className="text-xs text-gray-700 font-medium">{metric.title}</span>
          </div>
          <div className={`text-base font-bold ${metric.valueColor}`}>{metric.value}</div>
        </div>
      ))}
    </div>
  );
};

export default CreditBalanceGrid;