import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { ConsoleModal } from '../dashboard/ConsoleModal';
import { ReportModal } from '../dashboard/ReportModal';
import { QuickActionsModal } from '../dashboard/QuickActionsModal';
import { useQualityData } from '@/contexts/QualityDataContext';
import { useState } from 'react';

export function DashboardLayout() {
  const { consoleState, setConsoleOpen, reportModalState, setReportModalOpen } = useQualityData();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background dashboard-shell">
      <ConsoleModal
        isOpen={consoleState.isOpen}
        onOpenChange={setConsoleOpen}
        title={consoleState.title}
        output={consoleState.output}
        isFinished={consoleState.isFinished}
        isSuccess={consoleState.isSuccess}
      />
      <ReportModal
        isOpen={reportModalState.isOpen}
        onOpenChange={setReportModalOpen}
        reportFile={reportModalState.reportFile}
      />
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
      />
      <DashboardSidebar 
        onOpenQuickActions={() => setIsQuickActionsOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
