import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { PageLayout } from '../components/layout/PageLayout';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, ExhibitionEvent, EventType } from '../lib/marketing-api';

export const EventFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useApp();
  const isEdit = Boolean(id);

  const canCreate = useAppSelector(selectHasPermission('marketing.create_exhibition'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_exhibition'));

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventType, setEventType] = useState<EventType>((searchParams.get('type') as EventType) || 'exhibition');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [budget, setBudget] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const employeeCacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (isEdit && id) {
      if (!canEdit) {
        showToast('You do not have permission to edit events', 'error');
        navigate('/events');
        return;
      }
      loadEvent();
    } else {
      if (!canCreate) {
        showToast('You do not have permission to create events', 'error');
        navigate('/events');
        return;
      }
    }
  }, [id, isEdit, canCreate, canEdit]);

  const loadEvent = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const event = await marketingAPI.getEvent(parseInt(id));
      setEventType(event.type);
      setName(event.name);
      setLocation(event.location);
      setStartDate(event.start_date);
      setEndDate(event.end_date);
      setBudget(String(event.budget || ''));
      setSelectedEmployees(event.selected_employee_ids || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load event', 'error');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !location || !startDate || !endDate) {
      showToast('Name, location, start date, and end date are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateEvent(parseInt(id), {
          name,
          location,
          start_date: startDate,
          end_date: endDate,
          budget: budget ? parseFloat(budget.replace(/,/g, '')) : 0,
          selected_employee_ids: selectedEmployees,
        });
        showToast('Event updated successfully', 'success');
        navigate(`/events/${id}`);
      } else {
        const created = await marketingAPI.createEvent({
          type: eventType,
          name,
          location,
          start_date: startDate,
          end_date: endDate,
          budget: budget ? parseFloat(budget.replace(/,/g, '')) : 0,
          selected_employee_ids: selectedEmployees,
        });
        showToast('Event created successfully', 'success');
        navigate(`/events/${created.id}`);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} event`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEmployee = (val: number | undefined) => {
    if (!val) return;
    if (!selectedEmployees.includes(val)) {
      setSelectedEmployees([...selectedEmployees, val]);
    }
  };

  const removeEmployee = (id: number) => {
    setSelectedEmployees(selectedEmployees.filter(e => e !== id));
  };

  const breadcrumbs = [
    { label: 'Events', href: '/events' },
    { label: isEdit ? 'Edit Event' : 'Create Event' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Event' : 'Create Event'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading event...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEdit ? 'Edit Event' : 'Create Event'}
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/events')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
              <SegmentToggle<EventType>
                options={[
                  { value: 'exhibition', label: 'Exhibition' },
                  { value: 'roadshow', label: 'Roadshow' },
                ]}
                value={eventType}
                onChange={setEventType}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Automation Expo 2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mumbai Convention Centre"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Start Date *"
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date..."
              required
            />
            <DatePicker
              label="End Date *"
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Overall Budget (₹)
            </label>
            <Input
              type="text"
              value={budget ? Number(budget).toLocaleString('en-IN') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[,\s]/g, '').replace(/\D/g, '');
                setBudget(raw);
              }}
              placeholder="e.g., 10,00,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Employees (for travel, hotel)
            </label>
            <AsyncSelect
              label=""
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({
                  page: 1,
                  page_size: 20,
                  search: search || undefined,
                  status: 'active',
                });
                res.employees.forEach((e) => {
                  employeeCacheRef.current.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || `#${e.id}`);
                });
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || `#${e.id}`,
                }));
              }}
              value={undefined}
              onChange={(val) => handleSelectEmployee(val ? Number(val) : undefined)}
              placeholder="Search and select employees..."
            />
            {selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedEmployees.map((empId) => (
                  <span
                    key={empId}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                  >
                    {employeeCacheRef.current.get(empId) || `Employee #${empId}`}
                    <button
                      type="button"
                      onClick={() => removeEmployee(empId)}
                      className="text-blue-400 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
