import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
    title: string;
    backHref?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, backHref, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            {backHref && (
                <Button variant="outline" size="icon" asChild>
                    <Link href={backHref}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Link>
                </Button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {title}
            </h1>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}
