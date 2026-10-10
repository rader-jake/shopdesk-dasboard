"use client";

import { CalendarGrid } from "@/components/CalendarGrid";
import { CallHistory } from "@/components/CallHistory";
import { ConversationList } from "@/components/ConversationList";
import { useDashboard } from "@/components/DashboardProvider";
import { DemoTrigger } from "@/components/DemoTrigger";
import { LeadsTable } from "@/components/LeadsTable";
import { PageHeader, RefreshButton } from "@/components/PageHeader";
import { ReviveMode } from "@/components/ReviveMode";
import { StatsRow } from "@/components/StatsRow";
import { hasFeature } from "@/config/shops";

export function ConversationsView() {
  const { shop } = useDashboard();
  return (
    <>
      <StatsRow />
      {hasFeature(shop, "demoTrigger") && <DemoTrigger />}
      <PageHeader
        title="Conversations"
        subtitle="Tap a lead to open the thread · switch between AI and manual mode"
        actions={<RefreshButton />}
      />
      <ConversationList />
    </>
  );
}

export function CallsView() {
  return <CallHistory />;
}

export function ScheduleView() {
  const { shop } = useDashboard();
  const manage = hasFeature(shop, "calendarManagement");
  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={manage ? "Tap an open slot to book or block it · tap a booking for details" : "Upcoming appointments"}
        actions={hasFeature(shop, "reviveMode") ? <ReviveMode /> : undefined}
      />
      <CalendarGrid />
    </>
  );
}

export function LeadsView() {
  return (
    <>
      <PageHeader title="All Leads" subtitle="Manage status · change it any time" actions={<RefreshButton />} />
      <LeadsTable />
    </>
  );
}
