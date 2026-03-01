export interface Deal {
  id: number;
  customer_name: string;
  subject: string;
  value: number;
  stage: 'new' | 'sent' | 'waiting' | 'won' | 'lost';
  notes: string;
  is_finished: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  vips: string[];
  rules: {
    vip_sla_hours: number;
    urgent_keywords: string[];
    manager_email: string;
  };
}

export interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  receivedAt: Date;
  isUnread: boolean;
  priority: 'High' | 'Med' | 'Low';
  isVip: boolean;
}

export type TabType = 'Dashboard' | 'Inbox' | 'Pipeline' | 'Tasks' | 'Settings';
