import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    accentColor?: "blue" | "green" | "orange" | "purple" | "red";
    className?: string;
}

const accentColors = {
    blue: "border-l-blue-500 bg-gradient-to-br from-blue-500/10 to-transparent",
    green: "border-l-success bg-gradient-to-br from-success/10 to-transparent",
    orange: "border-l-warning bg-gradient-to-br from-warning/10 to-transparent",
    purple: "border-l-purple-500 bg-gradient-to-br from-purple-500/10 to-transparent",
    red: "border-l-destructive bg-gradient-to-br from-destructive/10 to-transparent",
};

const iconColors = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-success bg-success/10",
    orange: "text-warning bg-warning/10",
    purple: "text-purple-500 bg-purple-500/10",
    red: "text-destructive bg-destructive/10",
};

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    accentColor = "blue",
    className,
}: StatsCardProps) {
    return (
        <Card
            className={cn(
                "border-l-4 relative overflow-hidden",
                accentColors[accentColor],
                className
            )}
        >
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                            {title}
                        </p>
                        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                        {trend && (
                            <p
                                className={cn(
                                    "text-xs font-medium mt-2 flex items-center gap-1",
                                    trend.isPositive ? "text-success" : "text-destructive"
                                )}
                            >
                                <span>{trend.isPositive ? "↑" : "↓"}</span>
                                <span>{Math.abs(trend.value)}%</span>
                                <span className="text-muted-foreground">vs last month</span>
                            </p>
                        )}
                    </div>
                    <div
                        className={cn(
                            "p-3 rounded-full",
                            iconColors[accentColor]
                        )}
                    >
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </div>
        </Card>
    );
}
