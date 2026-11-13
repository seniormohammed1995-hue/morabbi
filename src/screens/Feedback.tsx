import { openFeedback } from '../feedback'
import { t } from '../i18n'
import { Button, Card } from '../ui/kit'

/** "ابعت رأيك" card shown at the end of each new tool and in settings. */
export function FeedbackCard({ from }: { from: string }) {
  return (
    <Card tone="leaf" className="mt-6">
      <p className="mb-3 font-semibold">{t('fb.ask')}</p>
      <Button icon="whatsapp" full onClick={() => void openFeedback(from)}>
        {t('fb.button')}
      </Button>
    </Card>
  )
}
