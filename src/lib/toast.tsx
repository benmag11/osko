import { toast } from 'sonner'
import { CustomToast } from '@/components/ui/custom-toast'

export function showSuccess(title: string) {
  toast.custom((id) => (
    <CustomToast id={id} variant="success" title={title} />
  ), { duration: 4000 })
}

export function showError(title: string) {
  toast.custom((id) => (
    <CustomToast id={id} variant="error" title={title} />
  ), { duration: 5000 })
}

export function showReportSuccess(questionTitle: string) {
  toast.custom((id) => (
    <CustomToast
      id={id}
      variant="success"
      title="You are my new favourite user."
      description={[
        `Thank you for reporting ${questionTitle}.`,
        'I will fix it ASAP.',
        'You have made the site better for everyone.',
      ]}
    />
  ), { duration: 6000 })
}
