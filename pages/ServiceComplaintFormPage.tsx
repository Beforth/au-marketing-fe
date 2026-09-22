/**
 * Service module — Stage 4: raise a complaint.
 * Route: /service/complaints/new  (optionally ?visit_id= &customer_id= &plant_id= for engineer-found issues)
 */
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { ServiceComplaintFormFields } from '../components/service/ServiceComplaintFormFields';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft } from 'lucide-react';
import { ServiceComplaintSource } from '../lib/marketing-api';

export const ServiceComplaintFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [params] = useSearchParams();
  const canCreate = useAppSelector(selectHasPermission('service.create_complaint'));

  const source: ServiceComplaintSource = params.get('visit_id') ? 'found_on_visit' : 'customer';
  const visitId = params.get('visit_id') ? Number(params.get('visit_id')) : undefined;

  useEffect(() => {
    if (!canCreate) {
      showToast('You do not have permission to raise complaints', 'error');
      navigate('/service/complaints');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Complaints', href: '/service/complaints' },
    { label: 'New Complaint' },
  ];

  return (
    <PageLayout
      title={source === 'found_on_visit' ? 'Report an issue found on site' : 'New Complaint'}
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>Back</Button>
      }
    >
      <Card>
        <ServiceComplaintFormFields
          source={source}
          visitId={visitId}
          initialCustomerId={params.get('customer_id') ? Number(params.get('customer_id')) : undefined}
          initialPlantId={params.get('plant_id') ? Number(params.get('plant_id')) : undefined}
          initialContractId={params.get('contract_id') ? Number(params.get('contract_id')) : undefined}
          onCreated={(c) => navigate(`/service/complaints/${c.id}`)}
          onCancel={() => navigate('/service/complaints')}
        />
      </Card>
    </PageLayout>
  );
};
