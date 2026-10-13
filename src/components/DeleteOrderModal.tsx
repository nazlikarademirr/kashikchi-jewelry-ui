import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/State';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { services } from '@/services';
import type { DeleteOrderReason } from '@/types';

interface DeleteOrderModalProps {
  open: boolean;
  orderId: string | null;
  orderNo?: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteOrderModal({
  open,
  orderId,
  orderNo,
  onClose,
  onDeleted,
}: DeleteOrderModalProps) {
  const { t, errorMessage } = useI18n();
  const toast = useToast();

  const [reason, setReason] = useState<DeleteOrderReason>('ORDER_CANCELLED');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('ORDER_CANCELLED');
      setNote('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    if (reason === 'OTHER' && !note.trim()) {
      setError(t('deleteOrder.noteRequired'));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await services.orders.delete(orderId, {
        reason,
        note: reason === 'OTHER' ? note.trim() : (note.trim() || undefined),
      });
      toast.success('deleteOrder.success');
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const isFormValid = reason && (reason !== 'OTHER' || note.trim().length > 0);

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={orderNo ? `${t('deleteOrder.modalTitle')} - #${orderNo}` : t('deleteOrder.modalTitle')}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Alert kind="warning">
          <strong>{t('deleteOrder.confirmQuestion')}</strong>
        </Alert>

        {error && <Alert kind="error">{error}</Alert>}

        <div>
          <Select
            label={t('deleteOrder.reasonLabel')}
            value={reason}
            onChange={(e) => setReason(e.target.value as DeleteOrderReason)}
            disabled={busy}
            required
          >
            <option value="ORDER_CANCELLED">{t('deleteOrder.reasons.ORDER_CANCELLED')}</option>
            <option value="WRONG_ORDER">{t('deleteOrder.reasons.WRONG_ORDER')}</option>
            <option value="TEST_ORDER">{t('deleteOrder.reasons.TEST_ORDER')}</option>
            <option value="OTHER">{t('deleteOrder.reasons.OTHER')}</option>
          </Select>
        </div>

        {reason === 'OTHER' && (
          <div>
            <Textarea
              label={t('deleteOrder.noteLabel')}
              placeholder={t('deleteOrder.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              required
              rows={3}
              maxLength={500}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('deleteOrder.cancelBtn')}
          </Button>
          <Button type="submit" variant="danger" loading={busy} disabled={!isFormValid || busy}>
            {t('deleteOrder.deleteBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
