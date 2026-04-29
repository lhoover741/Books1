import { Router, type IRouter } from "express";
import {
  GetDashboardResponse,
  GetLeadParams,
  GetLeadResponse,
  GetLeadsResponse,
  UpdateLeadBody,
  UpdateLeadParams,
  UpdateLeadResponse,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/auth";

type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Quote Sent"
  | "Won"
  | "Nurture";

type LeadSource =
  | "Quote Request"
  | "Contact Inquiry"
  | "Referral"
  | "Discovery Call";

type LeadPriority = "High" | "Medium" | "Low";

type TimelineItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  budget: string;
  projectType: string;
  timeline: string;
  value: number;
  priority: LeadPriority;
  lastContact: string;
  followUpDate: string;
  nextStep: string;
  notes: string;
  createdAt: string;
  activityTimeline: TimelineItem[];
};

const router: IRouter = Router();

router.use(requireRole("admin"));

const leads: Lead[] = [
  {
    id: "lead-1001",
    name: "Maya Bennett",
    company: "Copper & Finch Studio",
    email: "maya@copperfinch.example",
    phone: "3125550148",
    source: "Quote Request",
    status: "New",
    budget: "$8k-$12k",
    projectType: "Brand website + booking flow",
    timeline: "Launch in 6 weeks",
    value: 11200,
    priority: "High",
    lastContact: "Today",
    followUpDate: "Apr 15, 2026",
    nextStep: "Send discovery call times and request current brand assets.",
    notes:
      "Lifestyle studio needs a premium mobile-first site, service pages, intake form, and future scheduling integration.",
    createdAt: "2026-04-13T09:30:00.000Z",
    activityTimeline: [
      {
        id: "tl-1001-1",
        title: "Quote request submitted",
        description: "Maya asked for brand strategy, service pages, and booking readiness.",
        timestamp: "Today, 9:30 AM",
      },
      {
        id: "tl-1001-2",
        title: "Auto-priority assigned",
        description: "High value request with near-term launch window.",
        timestamp: "Today, 9:34 AM",
      },
    ],
  },
  {
    id: "lead-1002",
    name: "Jordan Ellis",
    company: "Northline Therapy",
    email: "jordan@northline.example",
    phone: "7735550193",
    source: "Contact Inquiry",
    status: "Contacted",
    budget: "$5k-$8k",
    projectType: "Healthcare practice redesign",
    timeline: "Needs proposal this month",
    value: 7400,
    priority: "Medium",
    lastContact: "Yesterday",
    followUpDate: "Apr 16, 2026",
    nextStep: "Follow up with accessibility and HIPAA-friendly intake notes.",
    notes:
      "Current site feels dated. Wants calmer branding, practitioner profiles, insurance information, and lead capture.",
    createdAt: "2026-04-12T14:15:00.000Z",
    activityTimeline: [
      {
        id: "tl-1002-1",
        title: "Contact inquiry received",
        description: "Jordan requested clarity on process, timeline, and compliance-sensitive forms.",
        timestamp: "Yesterday, 2:15 PM",
      },
      {
        id: "tl-1002-2",
        title: "Initial reply sent",
        description: "Shared availability and asked for current site analytics.",
        timestamp: "Yesterday, 4:20 PM",
      },
    ],
  },
  {
    id: "lead-1003",
    name: "Ari Coleman",
    company: "Roast Ledger",
    email: "ari@roastledger.example",
    phone: "6465550174",
    source: "Referral",
    status: "Qualified",
    budget: "$15k+",
    projectType: "SaaS landing page + dashboard prototype",
    timeline: "Investor demo in 30 days",
    value: 18200,
    priority: "High",
    lastContact: "2 days ago",
    followUpDate: "Apr 14, 2026",
    nextStep: "Prepare scope for prototype sprint and investor-ready product story.",
    notes:
      "Coffee inventory startup needs polished positioning, waitlist capture, and an early dashboard concept for demos.",
    createdAt: "2026-04-11T11:05:00.000Z",
    activityTimeline: [
      {
        id: "tl-1003-1",
        title: "Referral introduced",
        description: "Warm intro from a previous founder client.",
        timestamp: "Apr 11, 11:05 AM",
      },
      {
        id: "tl-1003-2",
        title: "Discovery scope confirmed",
        description: "Needs a high-conviction demo narrative before investor meetings.",
        timestamp: "Apr 11, 3:40 PM",
      },
    ],
  },
  {
    id: "lead-1004",
    name: "Priya Shah",
    company: "Chapter House Events",
    email: "priya@chapterhouse.example",
    phone: "9175550126",
    source: "Discovery Call",
    status: "Quote Sent",
    budget: "$10k-$14k",
    projectType: "Event venue website + booking roadmap",
    timeline: "Decision next Friday",
    value: 12800,
    priority: "High",
    lastContact: "3 days ago",
    followUpDate: "Apr 17, 2026",
    nextStep: "Check in on proposal and confirm booking integration preference.",
    notes:
      "Venue wants editorial visuals, inquiry qualification, package pages, and a phased bookings build after launch.",
    createdAt: "2026-04-10T16:45:00.000Z",
    activityTimeline: [
      {
        id: "tl-1004-1",
        title: "Discovery call completed",
        description: "Confirmed phased build with launch first, booking workflow second.",
        timestamp: "Apr 10, 4:45 PM",
      },
      {
        id: "tl-1004-2",
        title: "Quote sent",
        description: "Proposal includes brand-led website and integration roadmap.",
        timestamp: "Apr 11, 10:20 AM",
      },
    ],
  },
  {
    id: "lead-1005",
    name: "Theo Morgan",
    company: "Brewline Creative",
    email: "theo@brewline.example",
    phone: "2065550181",
    source: "Contact Inquiry",
    status: "Nurture",
    budget: "$3k-$5k",
    projectType: "Portfolio refresh",
    timeline: "Exploring late summer",
    value: 4200,
    priority: "Low",
    lastContact: "1 week ago",
    followUpDate: "May 6, 2026",
    nextStep: "Send small-business package overview and revisit in May.",
    notes:
      "Solo creative wants credibility upgrades but is not ready for a full engagement yet.",
    createdAt: "2026-04-05T13:10:00.000Z",
    activityTimeline: [
      {
        id: "tl-1005-1",
        title: "Inquiry captured",
        description: "Theo asked for a lighter refresh package and flexible timeline.",
        timestamp: "Apr 5, 1:10 PM",
      },
      {
        id: "tl-1005-2",
        title: "Nurture path assigned",
        description: "Best fit for a smaller package or later engagement.",
        timestamp: "Apr 5, 2:00 PM",
      },
    ],
  },
];

router.get("/dashboard", (_req, res) => {
  const activeLeads = leads.filter((lead) => lead.status !== "Won").length;
  const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const quoteRequests = leads.filter(
    (lead) => lead.source === "Quote Request",
  ).length;
  const statusCounts = leads.reduce<Record<string, number>>((counts, lead) => {
    counts[lead.status] = (counts[lead.status] ?? 0) + 1;
    return counts;
  }, {});

  const data = GetDashboardResponse.parse({
    activeLeads,
    pipelineValue,
    quoteRequests,
    responseRate: 94,
    statusCounts,
    recentActivity: [
      {
        id: "activity-1",
        label: "New quote request received",
        leadName: "Maya Bennett",
        timestamp: "Today, 9:30 AM",
      },
      {
        id: "activity-2",
        label: "Proposal ready for follow-up",
        leadName: "Priya Shah",
        timestamp: "Yesterday, 4:10 PM",
      },
      {
        id: "activity-3",
        label: "Discovery scope confirmed",
        leadName: "Ari Coleman",
        timestamp: "Monday, 11:05 AM",
      },
      {
        id: "activity-4",
        label: "Follow-up date assigned",
        leadName: "Jordan Ellis",
        timestamp: "Today, 8:15 AM",
      },
    ],
  });

  res.json(data);
});

router.get("/leads", (_req, res) => {
  const data = GetLeadsResponse.parse(leads);
  res.json(data);
});

router.get("/leads/:leadId", (req, res) => {
  const { leadId } = GetLeadParams.parse(req.params);
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  const data = GetLeadResponse.parse(lead);
  res.json(data);
});

router.patch("/leads/:leadId", (req, res) => {
  const { leadId } = UpdateLeadParams.parse(req.params);
  const body = UpdateLeadBody.parse(req.body);
  const index = leads.findIndex((item) => item.id === leadId);

  if (index === -1) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  const timelineEntry: TimelineItem | null = body.status
    ? {
        id: `tl-${leadId}-${Date.now()}`,
        title: `Status changed to ${body.status}`,
        description: "Pipeline status updated from the mobile CRM.",
        timestamp: "Just now",
      }
    : body.followUpDate || body.notes || body.nextStep
      ? {
          id: `tl-${leadId}-${Date.now()}`,
          title: "Lead notes updated",
          description: "Internal notes, next step, or follow-up date were refined.",
          timestamp: "Just now",
        }
      : null;

  leads[index] = {
    ...leads[index],
    ...body,
    lastContact: "Just now",
    activityTimeline: timelineEntry
      ? [timelineEntry, ...leads[index].activityTimeline]
      : leads[index].activityTimeline,
  };

  const data = UpdateLeadResponse.parse(leads[index]);
  res.json(data);
});

export default router;
