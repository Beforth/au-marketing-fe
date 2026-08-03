# Who this is for

This guide is for the people who use S&M Hub day to day: salespeople, sales/regional/domain managers, and admins who manage territory structure, numbering, and access. It assumes **no technical background at all** — no code, no jargon, nothing you need to have used before. If you're looking for how the system is *built*, see the [Developer Guide](./DEVELOPER_GUIDE.md) instead.

New here? Read the next four sections in order first — **How to log in**, **Getting to know the screen**, **Words you'll see in the app**, and **Quick Start** — before jumping to a specific page. They take five minutes, and every page section below now starts with a **"Where to find it"** line telling you exactly what to click.

---

# How to log in

S&M Hub is a website — you open it in your browser, there's nothing to install.

1. Open your browser and go to the address your admin gave you.
2. You'll land on a login screen. [SCREENSHOT: Login screen]
3. Enter your **usual company username and password** — the same ones you use to log into other internal company systems (HRMS). S&M Hub does not have its own separate password.
4. Click **Log in**.
5. Your browser may ask "Allow notifications?" — click **Allow** if you want reminders about follow-ups and alerts to pop up even when the tab isn't open. This is optional; you can always say no and turn it on later.

What you see once you're in depends on your **role** (Employee, Region Head, Domain Head, Super Admin, etc.). Two people can look at the exact same page and see different buttons, or different items in the sidebar — that's expected, not a bug. See [Words you'll see in the app](#words-youll-see-in-the-app) below for what a "role" means, and the [FAQ](#faq--troubleshooting) if something you expect to see is missing.

> ⚠️ **NEEDS CONFIRMATION:** the exact web address for S&M Hub wasn't confirmed for this guide — ask your system administrator for the correct link for your environment (production vs. demo/staging).

---

# Getting to know the screen

Every page in S&M Hub is built from the same handful of patterns. Learn these once and you'll be able to find your way around any screen, even one this guide doesn't mention by name.

**The sidebar (left side)**
The main menu, under an unlabeled "Main Menu" heading: **Dashboard, Domains, Leads, Quotations, Orders, Database, My Team, Events, Reports** — in that order, top to bottom. You'll only see the items you have permission for; someone with fewer permissions sees a shorter list. Near the bottom, below a divider, sit **Settings** and **Support & Tickets**, always visible to everyone. Whatever section you click stays highlighted so you always know where you are.

**The "Admin" section (admins only)**
If you're an admin, an extra **Admin** heading appears above Settings, with a collapsible dropdown labeled **Administration**. Click it to reveal two more links: **Numbering Series** and **Roles**. If you don't see an Admin section at all, you don't have admin access — that's normal for most users.

**The top bar** — five things, left to right:
- A **Quick search box** (click it, or press **⌘K** / **Ctrl+K**) — type a page name and press it to jump straight there. This is how you reach a few pages that **aren't in the sidebar at all**: type "Employees" or "Schema" and press Enter on the result. Note this box jumps between *pages*, not records — to find a specific lead or contact, use the search box on that page instead (see below).
- A **DSR icon** (clipboard, with a number badge showing your pending tasks) — click it for a quick dropdown of today's tasks, with a **View All DSR** button at the bottom.
- A **bell icon** — your notifications; click one to jump to what it's about.
- A **ticket icon** — shortcut straight to Support & Tickets.
- Your **profile picture or initials** (far right) — click for Settings or to log out.

**Breadcrumbs**
A small trail of links near the top of a page, like `Leads > Acme Corp > Edit`. It shows where you are and lets you click back to a previous screen without using your browser's back button.

**Search and filter bars on list screens**
Almost every list screen (Leads, Contacts, Orders, and so on) has its own search box near the top — separate from the Quick search box in the top bar. Type into it and the list narrows down to match — you don't need to press Enter. Next to it you'll often see **dropdown filters** (for example, "Status: All") to narrow the list further, like showing only leads assigned to you.

**Two ways a list can be shown: Table or Kanban board**
- A **table** is rows and columns, like a spreadsheet — click any row to open that record. Column headers are often clickable to sort.
- A **kanban board** is a set of side-by-side columns, each representing a stage (like *New*, *Contacted*, *Won*). Each item is a small card; you **drag a card from one column to another** to move it through the stages. Leads and Orders both use kanban boards, since they represent things moving through a pipeline.

[SCREENSHOT: A kanban board with labeled columns and a card being dragged]

**Adding or editing something: forms and pop-ups**
Clicking a button like **Add Contact** or **New Lead** either opens a full page or a pop-up window (a "modal") with a form to fill in. A few things are true almost everywhere:
- Fields marked with a **\*** (asterisk) are required — the **Save** button stays disabled, or shows an error, until they're filled in.
- A **Cancel** button or an **✕** in the corner closes the form without saving anything.
- If a form needs you to pick something that doesn't exist yet (like a company that isn't in the system), there's almost always a way to create it right there, without leaving the form.

**Icons you'll see everywhere**

| Icon | Meaning |
|---|---|
| 🔍 Magnifying glass | Search |
| ✏️ Pencil | Edit |
| 🗑️ Trash can | Delete |
| 👁️ Eye | Preview (view without downloading) |
| ⬇️ Down arrow | Download |
| ⬆️ Up arrow / paperclip | Upload / attach a file |
| ⋮ or ⋯ | More actions (click for a hidden menu) |

---

# Words you'll see in the app

S&M Hub uses a handful of business terms throughout. Here's what each one means in plain language.

| Term | What it means |
|---|---|
| **Domain** | A broad market the company sells into — e.g. "Domestic" or "Export." The top level of how sales territory is organized. |
| **Region** | A smaller area inside a Domain — e.g. a specific country or state. Every Region belongs to exactly one Domain. |
| **Lead** | A sales opportunity you're working on — one enquiry from one potential customer, from first contact through to Won or Lost. |
| **Quotation / Quote** | The price document you send a customer. A Lead can have several quotations attached to it over time (including revised versions). |
| **Quote Number / Series** | A unique reference number given to a quotation or a lead, generated automatically from a pattern your admin sets up (e.g. `LEAD-202608-0001`). |
| **Won / Lost** | The two possible outcomes of a Lead. "Won" means you got the business; "Lost" means you didn't, and you record why. |
| **Order** | Created automatically once a Lead is marked Won — tracks everything that happens *after* you win the deal (delivery, fulfilment, etc.). |
| **Organization** | A company you deal with — the overall business, which can have several physical locations. |
| **Plant** | A specific physical site/location belonging to an Organization or Customer (e.g. a factory or branch office). |
| **Contact** | A person — someone you can reach out to. Contacts are often "cold," meaning you haven't confirmed a business relationship yet. |
| **Customer** | A confirmed, active business account — the step up from a Contact once the relationship is real. |
| **Kanban board** | A visual board of columns (stages) with draggable cards — see [Getting to know the screen](#getting-to-know-the-screen). |
| **Activity / Enquiry log** | The running timeline on a Lead or Order — every call, email, meeting, and status change you log against it, in order. |
| **DSR** | Daily Status Report — a summary of today's tasks and recent activity. |
| **OD Plan** | Outdoor (field) Plan — a calendar of your upcoming customer visits and travel days. |
| **Domain Head / Region Head** | The person in charge of a whole Domain or Region. |
| **Coordinator** | A person who helps run a Domain or Region day-to-day, one level under the Head. |
| **Role & Permissions** | What kind of user you are (Employee, Region Head, Domain Head, Super Admin, etc.) and exactly what that lets you see and do. Set by your admin, not something you change yourself. |

---

# Quick Start — the 5 things you'll do most

New to the app? Here's exactly what to click for the most common daily tasks. Each links to the full walkthrough further down.

| I want to... | Click this | Full walkthrough |
|---|---|---|
| Log a new sales enquiry | Sidebar **Leads** → **New Lead** button | [Workflow: creating a new lead](#workflow-creating-a-new-lead) |
| Record a call, email, or meeting | Open a lead → its **Enquiry log** section | [Add/Edit Lead](#addedit-lead-lead-detail-page) |
| Send a quotation | Open a lead → **New Quotation** | [Workflow: adding and revising a quotation](#workflow-adding-and-revising-a-quotation) |
| Mark a deal as Won or Lost | Open a lead → **Mark as Won** / **Mark as Lost** | [Workflow: marking a lead as Won](#workflow-marking-a-lead-as-won) |
| See what's due today | Top bar → **DSR icon** (clipboard) → **View All DSR** | [DSR](#dsr-daily-status-reports) |

---

# Dashboard

## Dashboard (Home)

📍 **Where to find it:** This is the first screen you land on after logging in. To come back to it any time, click **Dashboard** at the very top of the sidebar.

[SCREENSHOT: Dashboard home screen with target progress, charts, and widget grid]

The Dashboard is a personalized home base showing your sales performance at a glance. What you see depends on your role: Super Admins see a company-wide overview, Domain Heads see their domain, Region Heads see their region, and everyone else sees their own numbers.

What you can do:
- View ready-made cards: this month's target vs. what you've achieved, your team's summary (for managers), the "Performer of the Month," a table of your most recent leads, quick-navigation shortcut buttons, a timeline of recent system activity, and a "What's New" panel with release notes.
- View ready-made charts: leads by region, quotations submitted, target vs. achieved, won vs. lost leads, leads by pipeline stage, inquiries & quotations comparison, revenue trend over time, and goal progress.
- Filter the whole dashboard by a date range.
- Build your own dashboard: add, remove, resize, and reorder tiles from a widget gallery (charts, tables, single-number "stat cards," or advanced query-based tiles for admins), then save it with a name.
- Switch between multiple saved dashboards you've created, and (if you're an admin) assign a saved dashboard to specific people or roles so their home screen is pre-built for them.

**Workflow: building your own dashboard layout**
1. Click **Add widget** and pick a widget from the gallery — a ready-made card, a ready-made chart, or a custom builder tile.
2. Give it a title and, for chart widgets, choose the chart style (bar, pie, area, table, or a single stat number).
3. Drag the new tile to reorder it, or resize it, among your existing tiles.
4. Click **New Dashboard** to save the whole arrangement under a name so you can come back to it or switch between layouts later.
5. (Admins only) Use **Assign** to hand this saved dashboard to specific teammates as their default view.

---

# Leads & Quotations

## Leads (Leads Board)

📍 **Where to find it:** Click **Leads** in the sidebar.

[SCREENSHOT: Leads kanban board with status columns]

This is the sales pipeline — every enquiry a salesperson is currently working, shown as a drag-and-drop board (kanban) grouped by pipeline stage (e.g. New, Contacted, Quoted, Won, Lost). It's the main working screen for salespeople and sales managers.

What you can do:
- See leads grouped into columns by status, with columns further grouped under stage "groups" (e.g. Prospecting, Negotiation) that you can collapse to save space.
- Search leads by name, company, or email, and filter to only leads assigned to specific teammates.
- Toggle "Show Won & Lost" to include closed leads on the board.
- Hover over a lead card to preview its contact details and quotation history without opening it.
- Drag a lead card from one column to another to change its status — leads that are overdue for a follow-up are highlighted in amber so they stand out.
- Click a lead card to open its full record.
- Click **New Lead** to add a fresh enquiry directly from the board (optionally straight into a specific column).
- (Managers/admins) Click **Manage statuses** to add, reorder, recolor, or retire pipeline stages and stage groups, and **Manage lead types** to edit the drop-down list of enquiry categories. **Number series** lets you pick which numbering pattern new leads get by default.

**Workflow: finding a specific lead**
1. On the Leads board, click into the search box at the top (not the Quick search in the top bar — this is the board's own search).
2. Type the person's name, their company name, or their email — the board narrows to matching cards as you type.
3. If you still see too many cards, use the assignee filter to show only leads assigned to a specific teammate (or yourself).
4. Can't find it at all? Turn on **Show Won & Lost** — the lead may already be closed and hidden by default.

**Workflow: moving a lead to Won or Lost by dragging**
1. Drag a lead card onto a column configured as "Won" (final, not lost).
2. A popup asks for the **closed value** (deal size) and requires you to attach the **purchase order** file before it will let you confirm.
3. Confirm — the lead moves to Won, the value and PO are logged, and you can now create an Order from it.
4. Dragging a lead onto a "Lost" column instead opens a reason prompt (this mirrors the fuller Lost flow on the lead's own page — see below).

## Add/Edit Lead (Lead Detail Page)

📍 **Where to find it:** Click **New Lead** on the Leads board to create one, or click any existing lead card to open it.

[SCREENSHOT: Lead detail page showing contact section, enquiry timeline, and quotation upload]

This is the full record for one sales opportunity — contact details, which company it's for, quotations sent, activity history, and the Won/Lost decision. It's the single most detailed screen in the whole tool, used constantly by salespeople.

What you can do:
- Fill in the lead's contact person (name, phone with country code, email, job title) — either search for an existing contact/customer/organization/plant or create all of them on the fly without leaving the page.
- Use cascading drop-downs: pick a Domain, which filters the Region list, which filters Customer and Plant choices, so you can't pick mismatched combinations.
- Record how the lead came in ("Through": cold call, exhibition, website, etc.) and who referred them (an employee, an existing customer, or another contact).
- Set an expected closing date and a follow-up reminder date/time.
- Log the "Enquiry" timeline: notes, calls, emails, meetings — each entry is timestamped and attributed to whoever added it.
- Attach quotation files to any log entry, with a quote value per attachment; add several quotations over time, and mark a new upload as a **revision** of a previous quotation (the system appends rev1, rev2, etc. automatically).
- Generate or manually type a formal quote number from a configured numbering pattern — you can do this with or without attaching a file at the same time.
- Mark the lead **Won** or **Lost** using dedicated buttons once it reaches a non-final stage.
- Once Won, jump straight into creating an Order from this lead.

**Workflow: creating a new lead**
1. From the Leads board, click **New Lead** (top right, or from a specific column).
2. Search for the person by name, email, or phone. If they already exist as a Contact or Customer, pick them from the results.
3. If they don't exist yet, fill in their details right there — name, phone, email, job title — and, if their company isn't in the system either, add that too (name is enough to start).
4. Pick the **Domain** and, if applicable, the **Region** this lead belongs to.
5. Optionally set an expected closing date and a follow-up reminder so you don't forget to chase it.
6. Click **Save** (or **Create Lead**). The lead now appears on the Leads board in its starting column.

**Workflow: logging a call, email, or meeting**
1. Open the lead.
2. Find the **Enquiry log** (activity timeline) section.
3. Choose the type of entry — Call, Email, Meeting, or Note.
4. Write a short description of what happened.
5. Click **Add** (or **Save**) — the entry appears at the top of the timeline with your name and the time.

**Workflow: marking a lead as Won**
1. Click **Mark as Won** on the lead page.
2. Enter the **closed value** (required) and, optionally, the **PO number**.
3. The **Won date** defaults to today — only change it if you're recording a deal that actually closed earlier (so it counts in the correct sales quarter); the app won't let you pick a future date.
4. Submit — this is logged as an entry in the enquiry timeline automatically, and a "Create Order from this lead" button appears.

**Workflow: marking a lead as Lost**
1. Click **Mark as Lost**.
2. Enter the **competitor name** you lost to (or "Not sure").
3. Enter the **price** they won at, if known.
4. Write a detailed **reason** — the system requires at least 100 characters, so a one-line reason won't be accepted; be specific about why the deal was lost.
5. Confirm — the lead moves to the Lost stage and the reason appears later on the Orders page's "Lost" tab for reference.

**Workflow: adding and revising a quotation**
1. In the Enquiry log section, choose **New Quotation** (or **Revise Quotation** if one already exists).
2. Pick a numbering series (or type a quote number manually) — generating or typing a number saves it right away, whether or not you also attach a file.
3. Upload the quotation file and enter the quote value for that attachment.
4. Add more than one quotation the same way if you're sending revised pricing — each is tracked separately with its own revision number.
5. Save — the quotation now shows on the lead, on the Quotations screen, and counts toward the lead's total quote value.

## Quotations

📍 **Where to find it:** Click **Quotations** in the sidebar.

[SCREENSHOT: Quotations list with search and filters]

This is a searchable list of every quotation file any salesperson has uploaded into a lead's enquiry log — useful for quickly finding a PDF you sent out without hunting through individual leads.

What you can do:
- Search by quotation number or file name.
- Filter to a specific lead, and sort by quotation number, file name, lead, inquiry number, or date.
- Preview a quotation PDF in the browser or download it.
- Jump straight to the lead it belongs to.
- If a file went missing on the server, re-upload ("reattach") the same quotation in place without losing its number or history.

---

# Orders

## Orders (Orders Board)

📍 **Where to find it:** Click **Orders** in the sidebar.

[SCREENSHOT: Orders kanban board with Won/Lost tabs]

Once a lead is marked Won, it becomes an Order — this screen tracks fulfilment of won business, again as a kanban board (or a table), plus a separate tab for reviewing lost business.

What you can do:
- Switch between **Won** and **Lost** tabs (near the top of the page). The Won tab shows the fulfilment pipeline; the Lost tab lists every lost lead with its loss reason, competitor, and price for review.
- In the Won tab, switch between **Kanban** (drag-and-drop board) and **Table** view.
- Search by order number, lead name, company, or email; filter by status in table view.
- Click **New Order (from lead)** to convert a Won lead into an order.
- (Managers/admins) **Manage statuses** to configure the order pipeline stages, including marking a stage as requiring an attachment before a card can be dragged into it.
- Click an order to open its detail record.

**Workflow: turning a Won lead into an order**
1. Either click **New Order (from lead)** on the Orders board, or open a Won lead and click **Create Order from this lead**.
2. Confirm which lead this order is for (it's pre-filled if you came from the lead page).
3. Pick the numbering series that should generate this order's number — note that once saved, the order number can't be changed.
4. Set the order value and, if known, an expected delivery date.
5. Save — the order now appears on the Orders board in its starting column, and you can start logging fulfilment activity against it.

## New/Edit Order (Order Detail Page)

📍 **Where to find it:** Click any order card or row on the Orders board.

What you can do:
- When creating: pick which Won lead this order is for and which numbering series generates its order number (this number can't be changed later).
- When viewing: see the order number, the source lead, current status, value, the date it was won, and expected delivery date.
- Click **Edit order** to update status, value, expected delivery date, or notes.
- Add entries to the **Inquiry log**: notes, calls, emails, meetings, or status-change records, each with optional file attachments (e.g. proof of delivery).
- See files that were uploaded on the original lead (including the PO uploaded at Won time) without leaving the order.
- Delete an activity log entry, or (if permitted) delete the whole order.

---

# Contacts & Organizations

📍 **Where to find this whole section:** Click **Database** in the sidebar. It opens with three tabs across the top — **Organizations**, **Customers**, **Contacts** — click a tab to switch between them; whichever one you have access to opens by default.

## Organizations

[SCREENSHOT: Organizations list]

A directory of the companies you deal with (the parent business, which can have multiple physical sites/"plants" under it).

What you can do:
- Search organizations by name.
- See each organization's industry, size, and active/inactive status in a table.
- Click **Add Organization** to create a new company record.
- Click a row to edit it, or use the edit/delete icons.

**Workflow: adding a new organization**
1. Click **Add Organization**.
2. Enter the company name (required) — description, website, industry, and size are optional but useful.
3. Switch to the **Organization Plants** tab if you already know one or more physical locations (address, city, state, postal code, and which Domain/Region it belongs to). You can skip this and add locations later.
4. Click **Save**.

## Add/Edit Organization

📍 **Where to find it:** From the **Organizations** tab under Database, click **Add Organization**, or click an existing row to edit it.

What you can do:
- Fill in name, notes/description, website, industry, and company size.
- Switch to the **Organization Plants** tab to add one or more site locations (name, address, city, state, postal code) tied to a Domain and Region.
- When creating a brand-new organization, you can add several plants in the same form before saving; when editing, add/edit/remove plants inline at any time.

## Contacts

📍 **Where to find it:** Click **Database** in the sidebar, then the **Contacts** tab.

A directory of individual people — useful for cold outreach lists and as the "person" record you attach to leads, customers, or plants.

What you can do:
- Search contacts by name, email, phone, or notes.
- See each contact's linked company, job title, email, and plant/location in a table.
- Click **Add Contact** to create a new person record; edit or delete existing ones (a contact that's already been converted to a customer can't be deleted).

**Workflow: adding a new contact**
1. Click **Add Contact**.
2. Fill in their first and last name, phone number (pick the correct country code from the dropdown), email, and job title.
3. Search for their company by name. If it's already in the system, select it; if not, type the name to create a new organization at the same time.
4. If you know which specific site/location they're based at, pick it, or add one inline.
5. Optionally note how you found them (source of contact) and any extra notes.
6. Click **Save**.

## Add/Edit Contact

📍 **Where to find it:** From the **Contacts** tab under Database, click **Add Contact**, or click an existing row to edit it.

What you can do:
- Enter a title/salutation, first and last name, phone (with a searchable country-code picker), email, and job title.
- Search for the person's company by name; either link to an existing organization or fill in details to create a brand-new one on save.
- Pick which plant/location at that company this person is based at, or add a new plant inline.
- Add notes and a "source of contact" (e.g. Website, Referral).

## Customers

📍 **Where to find it:** Click **Database** in the sidebar, then the **Customers** tab.

[SCREENSHOT: Customers list]

A directory of verified, active business accounts — the step up from a Contact once a relationship is confirmed.

What you can do:
- Search by company, primary contact name, or email.
- See each customer's company, primary contact, email, assigned domain, and active status.
- Click **New Client Account** to add a customer; click a row to edit.
- See at a glance if a customer was converted from an existing Contact record, with a link back to that original contact.

**Workflow: adding a new customer**
1. Click **New Client Account**.
2. Search for or create the company (organization) this customer belongs to.
3. Search for an existing contact to set as the **Primary contact**, or fill in a new person's details to create one at the same time.
4. Pick the plant/location that applies, if relevant.
5. Open the Domain & Region section and assign the correct territory.
6. Click **Save**.

## Add/Edit Customer

📍 **Where to find it:** From the **Customers** tab under Database, click **New Client Account**, or click an existing row to edit it.

What you can do:
- Search for or create the company (organization) this customer belongs to, same as on the Contact form.
- Search for an existing contact to set as the **Primary contact**, or fill in a new person's details to create one on save.
- Choose which plant/location applies, and assign the customer to a **Domain** and **Region** (collapsible section, since this is usually set once and rarely changed).

---

# Domains & Regions

## Domains (Domains & Hierarchy)

📍 **Where to find it:** Click **Domains** in the sidebar.

[SCREENSHOT: Domain/region tree with target progress bars]

This is the company's sales-territory structure: Domains (broad markets like "Domestic" or "Export") containing Regions, each with a Head, a Coordinator, and assigned salespeople. It also doubles as the place to set sales targets at every level.

What you can do:
- View a **target progress bar** for your scope (yourself, your region, your domain, or the whole company depending on your role), broken into four quarterly segments so you can see which quarter is on-track and which is behind, with a message like "Q2 in progress: ₹X / ₹Y (72%)."
- Browse a **tree view**: Domain → its Regions → the employees assigned to each region, showing each person's role (Head, Coordinator, Employee, Supervisor).
- Set a **target/goal** at the employee, region, or domain level — setting a goal directly on a region or domain overrides the sum of the individual employee targets underneath it (enter 0 to clear an override and go back to the rolled-up total).
- Add a new Domain, and from within a domain's row, jump straight to adding a new Region under it.
- Edit or delete a domain or region (inline action icons, shown on hover).

**Workflow: setting a sales target for a person, region, or domain**
1. In the tree, hover the row for the employee, region, or domain you want to set a target for and click the target icon.
2. A panel opens showing the current team total for that scope (rolled up from everyone underneath it).
3. Type the new goal amount.
4. Save — the progress bars for that person/region/domain and everything above it update to reflect the new target.

## Add/Edit Domain

📍 **Where to find it:** On the **Domains** page, click **Add Domain**, or click the edit (pencil) icon on an existing domain's row.

**Workflow: adding a new domain**
1. Click **Add Domain**.
2. Enter a name (e.g. "Domestic") — a short code is generated automatically, or you can type your own.
3. Search for and assign a **Domain Head** and, optionally, a **Domain Coordinator**.
4. Tick **Export Domain** if this domain's regions should be organized by country (see the note on Add/Edit Region below).
5. Click **Save**.

What else you can do here:
- Add a description.
- Mark the domain active or inactive.

## Add/Edit Region

📍 **Where to find it:** On the **Domains** page, hover a domain's row and click its "add region" icon, or click the edit (pencil) icon on an existing region.

**Workflow: adding a new region**
1. From a Domain's row on the Domains screen, click to add a region under it.
2. If the domain is a regular (non-export) domain, type a region name and code. If it's an **Export** domain, pick a **country** from the searchable list instead — the app won't let you add the same country twice under one export domain.
3. Search for and assign a **Region Head** and, optionally, a **Region Coordinator**.
4. Add a description if useful.
5. Click **Save**.

---

# Events/Exhibitions

## Events

📍 **Where to find it:** Click **Events** in the sidebar.

[SCREENSHOT: Events list with Exhibition/Roadshow toggle]

A list of trade shows/exhibitions and roadshows the company is running or has run, with budgets and spend tracked per event.

What you can do:
- Switch between **Exhibition** and **Roadshow** event types.
- Search events by name; see location, dates, status (Active/Ended), budget, and amount spent so far for each one.
- Click **Create Event** to add a new one; click a name to open its detail page.
- **End Event** to lock an active event from further edits once it's wrapped up.
- Edit or delete an event (with a confirmation warning that deleting removes all its files and history).

**Workflow: creating a new event**
1. Click **Create Event**.
2. Choose the event type — **Exhibition** or **Roadshow**. This can't be changed later, so pick carefully.
3. Assign it to a **Domain** — this is also locked once saved.
4. Enter the event name, location, start date, end date, and overall budget.
5. Search for and add the employees who'll be involved, so their travel and hotel costs can be tracked later.
6. Click **Save** — you'll land on the event's detail page, ready to start filling in the budget tabs described below.

## Add/Edit Event

📍 **Where to find it:** Click **Create Event** on the Events page, or open an existing event and click its edit option.

What you can do:
- Choose the event type (Exhibition or Roadshow) — this can't be changed after creation.
- Assign it to a **Domain** — also locked after creation.
- Enter name, location, start and end dates, and an overall budget.
- Search and add the employees who will be involved (for tracking their travel/hotel costs later).

## Event Detail (multi-tab budget & planning page)

📍 **Where to find it:** Click any event's name on the Events page.

[SCREENSHOT: Event detail page tabs]

The working page for one event, split into a row of tabs so different aspects of running the show can be tracked separately. Tabs shown depend on event type:
- **Exhibition:** Overview, Space Booking, Stall Design, Banner Design, Travel, Hotel, Local Travel, Gifting, Analysis
- **Roadshow:** Overview, Space Booking, Table Booking, Travel, Hotel, Local Travel, Gifting, Analysis

What you can do on each tab:
- **Overview:** see the event's core details and end it once it's finished.
- **Space Booking:** enter the booth vendor and total amount; add multiple **payment entries** (date, amount, paid checkbox) and see a running Total/Paid/Remaining summary with an automatic Pending/Partial/Completed status badge.
- **Stall Design / Banner Design:** upload design files (from the vendor or your own), and mark one as the selected/final version.
- **Table Booking** (roadshows): enter a table count and cost-per-table; the total cost recalculates automatically.
- **Travel / Hotel / Local Travel:** log trip and accommodation costs, including uploaded ticket/proof files.
- **Gifting:** log promotional giveaway items, quantity, and cost.
- **Analysis:** a budget-vs-spend summary — total budget, total spent, remaining, and a per-category breakdown table showing what percentage of the budget each cost area consumed.

**Workflow: tracking a stall's booking payment**
1. Open the event, go to **Space Booking**, and enter the vendor name and total booking amount.
2. Click **Add Payment Entry** each time a payment is made — enter the due date and amount, and tick **paid** once it clears.
3. The **Total / Paid / Remaining** summary bar and the status badge (Pending → Partial → Completed) update automatically as you add entries.
4. Repeat for each instalment until the booking is fully paid.

---

# Team & Performance

## My Team

📍 **Where to find it:** Click **My Team** in the sidebar. (Only visible to Domain Heads, Region Heads, and Super Admins.)

[SCREENSHOT: My Team performance breakdown table]

A manager's view of their team's performance — available to Domain Heads, Region Heads, and Super Admins to see aggregated and per-person numbers.

**Workflow: checking your team's performance**
1. Open **My Team** from the sidebar.
2. Pick a time period — Today, This Week, This Month, This Quarter, This Year, or a custom range.
3. Leave the Team member drop-down on **All Team Members (Combined)** for a rolled-up view, or pick one person to see their individual numbers.
4. If you oversee more than one Domain or Region, use the scope pills to narrow to a specific one.
5. Scroll down to the **Team Breakdown table** to compare everyone's target, achieved amount, and win/loss counts side by side.
6. Click **Sync** if the numbers look stale and you want to force a refresh.

What else you can do here:
- See aggregated **Expected Orders** and **Outdoor (OD) Plans** across the whole team.
- Drill into one person to see their individual performance summary, Expected Orders, OD Plans, and Daily Status Report tasks.

## Employees

📍 **Where to find it:** This page is **not in the sidebar**. Click the Quick search box in the top bar (or press **⌘K** / **Ctrl+K**), type "Employees," and press Enter on the result.

An admin-facing screen listing everyone currently assigned to a domain or region, with their role, used to grant people access to specific territories.

What you can do:
- Search by name or email.
- See each person's assignments (which region(s), and whether they're an Employee, Supervisor, Region Head, or Domain Head there).
- Click **Assign new user** to search HRMS for a person and give them a role in a chosen region or domain.
- Remove someone from a region assignment or remove them as a Domain Head.

## DSR (Daily Status Reports)

📍 **Where to find it:** This page is **not in the sidebar**. Click the **DSR icon** (clipboard, with your pending task count) in the top bar, then click **View All DSR** at the bottom of the dropdown.

[SCREENSHOT: DSR page with pending/completed task lists]

A daily activity summary combining tasks assigned in HRMS with your own recent leads and orders, so you (or your manager) can see what's been done today.

What you can do:
- Filter by period: Today, This Week, This Month, or a custom date range.
- Filter tasks by status: All, Pending, Completed.
- See count cards for total/pending/completed tasks, and how many leads and orders fall in the selected period.
- Browse **Pending** and **Completed** task lists separately.
- Browse recent **Leads** and **Orders** created or updated in the period, with quick links into each record.

---

# Reports

## Reports (hub page)

📍 **Where to find it:** Click **Reports** in the sidebar.

A landing page for two kinds of forward-looking sales plans: Expected Order reports and Outdoor (OD) Plans, plus a way for managers to view their team's submissions.

What you can do:
- If you manage others, use **Report for** to view a specific team member's reports instead of your own.
- Click **Create outdoor plan** or **Create expected order in next month** to start a new one.
- Browse existing **Expected order reports** by month, with a colored breakdown (Won / Lost / Expected / Carried forward) and a **View** button that opens the full list of leads in that month's report.
- Browse existing **Outdoor (OD) plans** by month and open one to view or edit.

## Create Expected Order (next month)

📍 **Where to find it:** On the Reports page, click **Create expected order in next month**.

A monthly ritual where salespeople flag which of their "hot" leads they realistically expect to close next month.

**Workflow: submitting next month's expected orders**
1. Go to **Reports**, then click **Create expected order in next month**.
2. Check the deadline banner at the top so you know how much time is left.
3. Tick the leads you realistically expect to close next month (only leads flagged **Hot** appear in this list — mark a lead Hot on the lead page first if it's missing).
4. Use **Select all** if every hot lead listed applies.
5. Click **Submit**. Once the deadline passes, submission locks — so don't leave it to the last minute.

## Outdoor (OD) Plan

📍 **Where to find it:** On the Reports page, click **Create outdoor plan** (or open an existing month's plan from the list below it).

[SCREENSHOT: OD Plan monthly calendar]

A calendar-style monthly planner for field visits, travel days, and "return home" days — mainly used by field sales staff who travel to meet customers.

What you can do:
- Navigate month to month, and see summary counts of visits/travels/return-home days and how many days have entries.
- Pick one or more dates on a calendar, then expand each date to add entries.
- For each entry, choose a type: **Visit**, **Travel**, or **Return home**.
  - Visits let you search for and attach an existing Contact (or create a new one, and even a new Organization/Plant, without leaving the modal).
  - Travel/Return home entries capture a place, travel time, and travel type (e.g. car, flight).
- Edit or delete any entry; a submission-deadline banner shows how much time is left to submit/change the plan for the month.

**Workflow: adding a visit to your outdoor plan**
1. Pick the date(s) you're planning for on the calendar, then expand a date and click **Add entry**.
2. Choose entry type **Visit**.
3. Search for the contact you're visiting by email; if they're not in the system yet, click **Add contact** and fill in their details (with the option to also create their company and site location on the spot).
4. Add any notes about the visit's purpose.
5. Save — the entry appears as a colored chip on that date, and the plan auto-saves to the server.

## Report Templates

⚠️ **Where to find it: nowhere in the app menus right now.** This page exists but currently has no link anywhere in S&M Hub — no sidebar entry, no Quick search result, no button on another page. It can only be reached if someone gives you the direct web address. Treat it as not generally available until that changes; don't rely on it being reachable for day-to-day work.

A power-user tool (for admins/managers) to build custom, reusable reports made of one or more data sections, without needing a developer.

What you can do, if you're given a direct link:
- Select an existing template from a drop-down, or click **New template** to start one.
- Add **sections** to a template — each section runs a query against the system's data and shows the result as a sortable, searchable, filterable table.
- Filter the whole report by date range or by specific entities (a lead, domain, region, employee, customer, etc.) if the template supports it.
- Search within a section's results, filter by a specific column, and click a column header to sort.
- **Assign** a template to specific employees so it shows up for them, and choose whether they're allowed to edit it.

Writing the section queries requires technical (SQL) knowledge, so day-to-day salespeople would typically only view templates that have already been built for them, not create new ones.

## Financials

⚠️ **Where to find it: nowhere in the app menus.** Like Report Templates, this page has no sidebar entry, no Quick search result, and no button linking to it anywhere. It's reachable only by direct web address.

A financial-style dashboard (net profit, operating expenses, credit risk, a revenue chart, and a ledger table). **This screen currently shows fixed sample figures, not your company's real financial data** — treat it as a preview of a future feature rather than a working report.

---

# Admin/Settings

## Settings

📍 **Where to find it:** Click your profile picture (top right) or the gear icon in the top bar, or click **Settings** near the bottom of the sidebar.

[SCREENSHOT: Settings page tabs]

The personal and system settings hub, with tabs down the left: **Profile**, **Audit Logs**, **Versions**, **Visibility** (which tabs you see depends on your permissions).

**Workflow: connecting your Gmail account (so the app can send emails as you)**
1. Go to **Settings**, then the **Profile** tab.
2. Find **Connect email** and click it.
3. You'll be taken to a Google sign-in screen — sign in with the Gmail account you want to connect and approve the permissions requested.
4. You're redirected back to Settings, now showing your connected email address.
5. To stop using it, click **Disconnect** in the same spot.

What else you can do here:
- **Profile tab:** view your name, email, and designation (read-only, synced from HRMS); click **Clear Cache** to force a refresh of your permissions if something looks out of date.
- **Profile tab (admins):** click **Sync Employees** to pull the latest employee list from HRMS into the marketing tool, with a results table showing who was newly added vs. updated, their role, and their domain/region.
- **Audit Logs tab** (admins/managers): search and page through a log of who did what and when across the whole system (creates, edits, deletes), each entry showing the user, the action, and details.
- **Versions tab** (admins): manage the "What's New" release notes shown to everyone in the app.
- **Visibility tab** (admins): decide which users are allowed to see *past* quarters' actual achieved figures (by default only the current quarter is visible to some roles) — pick a quarter, search and select users, and add them to the allowed list.

## Roles

📍 **Where to find it:** In the sidebar, click **Administration** to expand it, then click **Roles**. (Only visible if you're an admin.)

A read-only reference screen listing every role defined in the system (e.g. Super Admin, Domain Head, Region Head, Employee), color-coded by seniority level, with a description and how many permissions each role has. There's nothing to edit here — roles themselves are managed in the HRMS system, not in S&M Hub.

## Numbering Series

📍 **Where to find it:** In the sidebar, click **Administration** to expand it, then click **Numbering Series**. (Only visible if you're an admin.)

[SCREENSHOT: Numbering Series pattern builder with live preview]

Controls the automatic numbering patterns used for leads, orders, quotations, contacts, and customers (e.g. `LEAD-{YYYY}{MM}-{0:4}` → `LEAD-202608-0001`).

What you can do:
- Search and filter the list of series by name/code/pattern, and by Active/Inactive.
- Click **Add Series** to create a new numbering pattern.
- Click the placeholder buttons (Year, Month, Day, Counter, etc.) to build a pattern without memorizing the syntax, and see a **live preview** of what a generated number would look like as you type.
- Choose how often the counter resets (never, daily, weekly, monthly, yearly).
- Manually trigger **Generate next number** on a series to preview/copy the next value it would produce.
- Edit or delete a series.

**Workflow: creating a numbering pattern**
1. Click **Add Series**, give it a name and a unique code, and (optionally) say what it's used for (Contact, Customer, Lead, Enquiry, or generic).
2. Click the placeholder buttons — Year, Month, Counter, etc. — to build up the pattern in the Pattern field, or type it directly.
3. Check the **live preview** underneath to confirm it looks right.
4. Set the starting "Next value" and choose a reset schedule if the counter should restart periodically.
5. Save — the series is now available to be selected wherever that entity type generates numbers (e.g. the lead or order creation screens).

## Schema

📍 **Where to find it:** This page is **not in the sidebar**. Use the Quick search box in the top bar (⌘K / Ctrl+K) and type "Schema," or click the "Schema / ER diagram" link shown on the Dashboard.

A database reference browser, useful only to whoever is writing Report Template queries or custom dashboard widgets. This screen has no relevance to day-to-day sales work.

## Support & Tickets

📍 **Where to find it:** Click **Support & Tickets** near the bottom of the sidebar, or click the ticket icon in the top bar.

A place to report a bug or request a new feature directly from inside the app, and see the history of what you've submitted.

**Workflow: reporting a bug**
1. Go to **Support & Tickets**.
2. Choose **Report a Bug**.
3. Give it a short, clear title (e.g. "Can't upload quotation on Lead #482").
4. Add a description — the form suggests a "steps to reproduce" template; filling it in helps the team fix it faster.
5. Click **Submit Ticket**. You'll get a ticket number; if the connection to the support system fails, your ticket is still saved and the team will follow up manually.
6. Check **My Tickets** any time to see its status.

## Inventory

⚠️ **Where to find it: nowhere in the app menus.** Like Financials, this page has no sidebar entry, no Quick search result, and no button linking to it — reachable only by direct web address.

A stock/inventory-style dashboard. **Like Financials, this currently shows fixed sample data, not your company's real stock.**

---

# Common workflows (end-to-end)

**From a cold enquiry to a won deal:**
1. Create a lead on the **Leads** board (or via **Add Lead**), linking or creating the contact/organization as you go.
2. Log calls/emails/meetings in the lead's Enquiry timeline as the conversation progresses.
3. Generate a quote number and attach a quotation file once you're ready to send pricing; add revisions if the price changes.
4. Drag the lead to a "Won" column (or use **Mark as Won**), entering the closed value and PO.
5. Click **Create Order from this lead** to start tracking fulfilment on the **Orders** board.

**Monthly forecasting routine:**
1. Before the month's deadline, open **Reports → Create expected order in next month** and select your Hot leads likely to close.
2. Open **Reports → Create outdoor plan** and fill in your travel/visit calendar for the upcoming month.
3. Check the **DSR icon** in the top bar daily to keep on top of pending tasks and recent activity.

---

# FAQ / Troubleshooting

**I don't know where to start.**
Read [Quick Start](#quick-start--the-5-things-youll-do-most) above — it links straight to the five most common tasks with exactly what to click.

**I can't find a page this guide mentions — it's not in the sidebar.**
A few pages (Employees, Schema, DSR) are reached from the **top bar**, not the sidebar — see [Getting to know the screen](#getting-to-know-the-screen). Two others (Report Templates, Financials) and Inventory currently have **no link anywhere in the app** — see their sections above; that's not something wrong with your account.

**What's a "kanban board" / "domain" / "series"?**
See [Getting to know the screen](#getting-to-know-the-screen) and [Words you'll see in the app](#words-youll-see-in-the-app) near the top of this guide.

**I can't see a page/button that a colleague can see.**
Almost always a permissions difference — access is controlled by your role (set in HRMS), not something you can change yourself. Ask your admin to check your role/permissions.

**I got logged out unexpectedly / see "Access Denied."**
Your login session (token) may have expired, or you were moved to a role without the required permission. Try logging in again; if the problem persists after a fresh login, contact your admin — this can also happen if your role changed while you were still logged in.

**I forgot my password / can't log in.**
S&M Hub uses your company (HRMS) login, not a separate password — reset or recover it through your usual company account process, not inside S&M Hub.

**A file/attachment shows "Missing" instead of opening.**
The file exists in the system's records but couldn't be found in storage (this can happen after certain server maintenance). Use the **Reattach**/re-upload option where available, or contact support — the record itself (quote number, value, history) isn't lost.

**My permissions/profile look out of date after an admin changed something.**
Go to **Settings → Profile** and click **Clear Cache** to force a refresh, or simply log out and back in.

**I don't see the Financials or Inventory numbers matching our real company data.**
These two screens currently show placeholder/sample data only — they are previews, not connected to live figures yet, and aren't linked from anywhere in the app.

**A page looks broken, blank, or won't load.**
Try refreshing the page first. If that doesn't help, log out and back in. If it's still broken, report it — see below.

**Something's broken, or I have an idea for a new feature.**
Use **Support & Tickets** in the app to report it directly — no need to email anyone separately.

---

## What changed in this update

No content changes. Re-verified against a fresh, independent read of `App.tsx`, `components/ui/Sidebar.tsx`, and `components/ui/Navbar.tsx`: the sidebar order, the Admin dropdown contents, the secondary links, and every "not in the sidebar — reached via search/top bar" claim (Employees, DSR, Schema) and every "no link anywhere" claim (Report Templates, Financials, Inventory) all still match the running code exactly. This guide was already current.

Two formatting fixes to match the house style: removed the standalone title-H1 line at the top of the file (per the "start body content with your first real H1 section" rule — the Beforth PDF tool has a separate cover-title field) and promoted every heading one level (old H2→H1, H3→H2) so section headings are H1 throughout, not nested under a title. Also converted the NEEDS CONFIRMATION line under "How to log in" into a proper `>` blockquote callout. Section text and internal anchors are unchanged — GitHub/VS Code anchor IDs are derived from heading text, not level, so no cross-links broke.
