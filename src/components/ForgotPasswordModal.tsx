import { Alert } from '@/components/ui/State';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/contexts/I18nContext';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={t('auth.forgotTitle')} onClose={onClose}>
      <Alert kind="info">
        {t('auth.forgotSoon')}
        {' '}
        <a href="mailto:destek@kashikchi.com">destek@kashikchi.com</a>
      </Alert>
    </Modal>
  );
}
