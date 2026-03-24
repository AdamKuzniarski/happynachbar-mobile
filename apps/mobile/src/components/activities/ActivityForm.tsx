import { useEffect, useState } from 'react';

import { ActivityCategory } from '@/lib/enums';
import type { ActivityWritePayload } from '@/lib/activities';

type Props = {
  initialValues?: Partial<ActivityWritePayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ActivityWritePayload) => Promise<void> | void;
  onCancel?: () => void;
};

function normalizePostalCode(value: string) {
  return value.replace(/\D+/g, '').slice(0, 5);
}

export function ActivityForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.description ?? '');
  const [description, setDescription] = useState<string>(initialValues?.description ?? '');
  const [plz, setPlz] = useState(initialValues?.plz ?? '');
  const [category, setCategory] = useState<ActivityCategory>(
    initialValues?.category ?? ActivityCategory.OUTDOOR,
  );

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPlz(initialValues?.plz ?? '');
    setCategory(initialValues?.category ?? ActivityCategory.OUTDOOR);
  }, [initialValues]);

  const hasValidTitle = title.length > 3;
  const hasValidPlz = /^\d{5}$/.test(plz);
  const isValid = hasValidTitle && hasValidPlz;
}
