import AppHeader from './app-header';
import Nav from './nav';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ServerPatientAccessGate } from '@/components/patients/ServerPatientAccessGate';
import { UserStatusDebug } from '@/components/debug/UserStatusDebug';

interface ServerAppLayoutProps {
  children: React.ReactNode;
  userId: string;
}

export default function ServerAppLayout({ children, userId }: ServerAppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <Nav />
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 py-4 md:py-6 lg:py-8">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
              <ServerPatientAccessGate userId={userId}>
                {children}
              </ServerPatientAccessGate>
            </div>
          </main>
          <UserStatusDebug />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
