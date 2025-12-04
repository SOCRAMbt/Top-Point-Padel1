import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
    className
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        pink: 'from-pink-500 to-pink-600',
        cyan: 'from-cyan-500 to-cyan-600'
    };

    const iconBgClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-emerald-100 text-emerald-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
        pink: 'bg-pink-100 text-pink-600',
        cyan: 'bg-cyan-100 text-cyan-600'
    };

    return (
        <div className={cn(
            'relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
            className
        )}>
            {/* Decorative gradient */}
            <div className={cn(
                'absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 bg-gradient-to-br',
                colorClasses[color]
            )} />

            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-400">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-sm font-medium',
                            trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                        )}>
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {Icon && (
                    <div className={cn(
                        'p-3 rounded-xl',
                        iconBgClasses[color]
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
}