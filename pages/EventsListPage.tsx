import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, CalendarCheck, Search } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, ExhibitionEvent, EventType, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

const TYPE_OPTIONS = [
  { value: 'exhibition' as EventType, label: 'Exhibition' },
  { value: 'roadshow' as EventType, label: 'Roadshow' },
];

export const EventsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_events'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_events'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_events'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_events'));

  const [eventType, setEventType] = useState<EventType>('exhibition');
  const [data, setData] = useState<ExhibitionEvent[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [endId, setEndId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!canView) return;
    setIsLoading(true);
    try {
      const res = await marketingAPI.getEvents({ page, page_size: pageSize, type: eventType, search: search || undefined });
      setData(res.items);
      setTotal(res.total);
    } catch (error: any) {
      showToast(error.message || 'Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [canView, page, pageSize, eventType, search, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await marketingAPI.deleteEvent(deleteId);
      showToast('Event deleted successfully', 'success');
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete event', 'error');
    }
  };

  const handleEnd = async () => {
    if (endId == null) return;
    try {
      await marketingAPI.endEvent(endId);
      showToast('Event ended successfully', 'success');
      setEndId(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to end event', 'error');
    }
  };

  const endEvent = async (id: number) => {
    try {
      await marketingAPI.endEvent(id);
      showToast('Event ended successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to end event', 'error');
    }
  };

  const columns: Column<ExhibitionEvent>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <button onClick={() => navigate(`/events/${row.id}`)} className="text-blue-600 hover:text-blue-800 font-medium text-left">
          {row.name}
        </button>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'exhibition' ? 'success' : 'default'}>
          {row.type === 'exhibition' ? 'Exhibition' : 'Roadshow'}
        </Badge>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => <span className="text-sm">{row.location || '—'}</span>,
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (row) => <span className="text-sm">{row.start_date ? new Date(row.start_date).toLocaleDateString('en-IN') : '—'}</span>,
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (row) => <span className="text-sm">{row.end_date ? new Date(row.end_date).toLocaleDateString('en-IN') : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status === 'active' ? 'Active' : 'Ended'}
        </Badge>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (row) => `₹${(row.budget || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'total_spent',
      label: 'Spent',
      render: (row) => `₹${(row.total_spent || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="View Event">
            <Button
              variant="ghost"
              size="xs"
              className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
              onClick={() => navigate(`/events/${row.id}`)}
            >
              <Eye size={16} strokeWidth={2} />
            </Button>
          </Tooltip>
          {canEdit && (
            <Tooltip content="Edit Event">
              <Button
                variant="ghost"
                size="xs"
                className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
                onClick={(e) => { e.stopPropagation(); navigate(`/events/${row.id}/edit`); }}
              >
                <Edit size={16} strokeWidth={2} />
              </Button>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip content="Delete Event">
              <Button
                variant="ghost"
                size="xs"
                className="w-8 h-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-transparent transition-colors"
                onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}
              >
                <Trash2 size={16} strokeWidth={2} />
              </Button>
            </Tooltip>
          )}
          {row.status === 'active' && (
            <Tooltip content="End Event">
              <Button
                variant="ghost"
                size="xs"
                className="w-8 h-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-transparent transition-colors"
                onClick={(e) => { e.stopPropagation(); setEndId(row.id); }}
              >
                <CalendarCheck size={16} strokeWidth={2} />
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <PageLayout title="Events" breadcrumbs={[{ label: 'Events' }]}>
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view events.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_events</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Events"
      description="Manage marketing events and roadshows."
      breadcrumbs={[{ label: 'Events' }]}
      actions={
        canCreate && (
          <Button
            size="sm"
            onClick={() => navigate(`/events/new?type=${eventType}`)}
            leftIcon={<Plus size={14} strokeWidth={3} />}
          >
            Create Event
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SegmentToggle<EventType>
            options={TYPE_OPTIONS}
            value={eventType}
            onChange={(val) => { setEventType(val); setPage(1); }}
          />
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Card noPadding>
          <DataTable<ExhibitionEvent>
            columns={columns}
            data={data}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            dense
          />
          {data.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={Math.ceil(total / pageSize) || 1}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Deleting this event will permanently remove all event data, including phases, files, and history. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmModal
        isOpen={endId != null}
        onClose={() => setEndId(null)}
        onConfirm={handleEnd}
        title="End Event"
        message="Ending this event will lock all editing. Are you sure you want to proceed?"
        confirmLabel="End Event"
        variant="danger"
      />
    </PageLayout>
  );
};
