
import { AppNotification, Transaction } from './types';

export const DEMO_ORDERS = [
    { id: '#ORD-9901', customer: 'Global Tech Corp', product: 'Enterprise License', amount: '$45,000.00', status: 'Delivered', date: 'Oct 20, 2023' },
    { id: '#ORD-9902', customer: 'Cyberdyne Systems', product: 'AI Core Module', amount: '$82,500.00', status: 'Processing', date: 'Oct 21, 2023' },
    { id: '#ORD-9903', customer: 'Wayne Enterprises', product: 'Security Suite', amount: '$12,400.00', status: 'Shipped', date: 'Oct 22, 2023' },
    { id: '#ORD-9904', customer: 'Stark Industries', product: 'Power Grid OS', amount: '$250,000.00', status: 'Processing', date: 'Oct 23, 2023' },
    { id: '#ORD-9905', customer: 'Umbrella Corp', product: 'Bio-Research Tool', amount: '$5,200.00', status: 'Canceled', date: 'Oct 24, 2023' },
    { id: '#ORD-9906', customer: 'Oscorp', product: 'Bio-Enhancer V2', amount: '$15,800.00', status: 'Delivered', date: 'Oct 25, 2023' },
    { id: '#ORD-9907', customer: 'Tyrell Corp', product: 'Nexus Interface', amount: '$94,000.00', status: 'Processing', date: 'Oct 26, 2023' },
    { id: '#ORD-9908', customer: 'Weyland-Yutani', product: 'Terraforming Kit', amount: '$312,000.00', status: 'Shipped', date: 'Oct 27, 2023' },
];

export const DEMO_CUSTOMERS = [
    { id: 'CUST-301', name: 'Alice Thompson', role: 'Security Analyst', company: 'Global Tech Corp', email: 'alice@globaltech.com', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=alice' },
    { id: 'CUST-302', name: 'Bob Richards', role: 'DevOps Lead', company: 'Cyberdyne Systems', email: 'bob@cyberdyne.io', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=bob' },
    { id: 'CUST-303', name: 'Charlie Prince', role: 'Asset Manager', company: 'Wayne Enterprises', email: 'c.prince@wayne.com', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=charlie' },
    { id: 'CUST-304', name: 'Diana Prince', role: 'Gov Relations', company: 'Justice Solutions', email: 'diana@themyscira.gov', status: 'Pending', avatar: 'https://i.pravatar.cc/150?u=diana' },
    { id: 'CUST-305', name: 'Edward Nigma', role: 'Logic Expert', company: 'Enigma Logic', email: 'riddler@arkham.city', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=edward' },
    { id: 'CUST-306', name: 'Selina Kyle', role: 'Infiltration Spec', company: 'Gotham Jewels', email: 'cat@kyle.me', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=selina' },
    { id: 'CUST-307', name: 'Arthur Curry', role: 'Maritime Lead', company: 'Atlantean Export', email: 'king@oceans.net', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=arthur' },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
    { id: 'd1', title: 'Wholesale Lead', message: 'New inquiry from Stark Industries for 500 licenses.', time: '1m ago', type: 'customer', read: false },
    { id: 'd2', title: 'System Latency', message: 'APAC Region server node reporting 450ms lag.', time: '5m ago', type: 'system', read: false },
    { id: 'd3', title: 'Stock Liquidation', message: 'Batch #B-202 has been cleared from inventory.', time: '10m ago', type: 'inventory', read: true },
    { id: 'd4', title: 'Revenue Spike', message: 'Daily revenue exceeded target by 45%.', time: '1h ago', type: 'order', read: false },
    { id: 'd5', title: 'Security Alert', message: 'Unusual login attempt from Unknown IP.', time: '2h ago', type: 'system', read: false },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
    { id: 'T-101', customer: 'Bruce Wayne', email: 'bruce@wayne.com', amount: '$5,000.00', status: 'Completed', date: '2023-10-25' },
    { id: 'T-102', customer: 'Peter Parker', email: 'peter@dailybugle.com', amount: '$120.00', status: 'Pending', date: '2023-10-26' },
    { id: 'T-103', customer: 'Tony Stark', email: 'tony@stark.com', amount: '$1,200,500.00', status: 'Completed', date: '2023-10-27' },
    { id: 'T-104', customer: 'Clark Kent', email: 'clark@dailyplanet.com', amount: '$250.00', status: 'Completed', date: '2023-10-28' },
    { id: 'T-105', customer: 'Barry Allen', email: 'barry@ccpd.gov', amount: '$75.00', status: 'Pending', date: '2023-10-29' },
];

export const DEMO_INVOICES = [
    { id: 'INV-2023-001', customer: 'TechFlow Inc.', amount: '$12,400.00', date: 'Oct 12, 2023', status: 'Paid' },
    { id: 'INV-2023-002', customer: 'Rome Logistics', amount: '$4,200.00', date: 'Oct 15, 2023', status: 'Pending' },
    { id: 'INV-2023-003', customer: 'Global Traders', amount: '$8,900.00', date: 'Oct 08, 2023', status: 'Overdue' },
    { id: 'INV-2023-004', customer: 'Studio Hub', amount: '$1,200.00', date: 'Oct 18, 2023', status: 'Draft' },
    { id: 'INV-2023-005', customer: 'Umbrella Ops', amount: '$24,000.00', date: 'Oct 20, 2023', status: 'Pending' },
    { id: 'INV-2023-006', customer: 'Hooli Corp', amount: '$56,000.00', date: 'Oct 22, 2023', status: 'Paid' },
    { id: 'INV-2023-007', customer: 'Pied Piper', amount: '$1,500.00', date: 'Oct 23, 2023', status: 'Paid' },
    { id: 'INV-2023-008', customer: 'Initech', amount: '$3,400.00', date: 'Oct 24, 2023', status: 'Overdue' },
];

export const DEMO_INVENTORY = [
    { sku: 'ERP-001', name: 'Premium ERP License', stock: 120, status: 'In Stock', category: 'Software' },
    { sku: 'CLD-010', name: 'Storage Unit (Basic)', stock: 12, status: 'Low Stock', category: 'Infrastructure' },
    { sku: 'SEC-202', name: 'Encryption Key V2', stock: 450, status: 'In Stock', category: 'Security' },
    { sku: 'SRV-X86', name: 'Baremetal Instance', stock: 0, status: 'Out of Stock', category: 'Infrastructure' },
    { sku: 'API-PRO', name: 'Advanced API Key', stock: 89, status: 'In Stock', category: 'Software' },
    { sku: 'NET-004', name: 'CDN Node (Edge)', stock: 5, status: 'Low Stock', category: 'Infrastructure' },
    { sku: 'LCN-ENT', name: 'Enterprise Seat Pack', stock: 1200, status: 'In Stock', category: 'Software' },
];

export const DEMO_SUPPORT_TICKETS = [
    { id: 'TK-401', subject: 'System downtime in EU-West', priority: 'Critical', status: 'Resolved', user: 'Mark Greene' },
    { id: 'TK-402', subject: 'Billing discrepancy for Q3', priority: 'High', status: 'Open', user: 'Sarah Connor' },
    { id: 'TK-403', subject: 'New feature request: Dark Mode', priority: 'Low', status: 'Processing', user: 'Ellen Ripley' },
    { id: 'TK-404', subject: 'API documentation clarification', priority: 'Medium', status: 'Open', user: 'John Doe' },
    { id: 'TK-405', subject: 'Login issues with 2FA', priority: 'High', status: 'Processing', user: 'Jane Smith' },
];
