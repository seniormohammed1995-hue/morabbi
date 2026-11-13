import { t } from '../../i18n'
import { Page, PageHeader } from '../../ui/kit'
import { LinkCard } from '../parts'
import { ApkCard, isMarketOpen, ShareAppCard } from '../v3/parts'

/** The five home-keeper tools in one place. */
export default function Tools() {
  return (
    <Page>
      <PageHeader title={t('tools.title')} />
      <div className="grid gap-2">
        <LinkCard to="/" icon="check" title={t('home2.routine')} sub={t('tools.routineSub')} />
        <LinkCard to="/sick" icon="medkit" title={t('tools.sick')} sub={t('tools.sickSub')} />
        <LinkCard
          to="/scraps"
          icon="utensils"
          title={t('tools.scraps')}
          sub={t('tools.scrapsSub')}
        />
        <LinkCard to="/eggs" icon="egg" title={t('tools.eggs')} sub={t('tools.eggsSub')} />
        <LinkCard to="/brood" icon="hatch" title={t('tools.brood')} sub={t('tools.broodSub')} />
        <LinkCard to="/nutrition" icon="feed" title={t('tools.nutrition')} sub={t('tools.nutritionSub')} />
        <LinkCard to="/journal" icon="note" title={t('tools.journal')} sub={t('tools.journalSub')} />
        <LinkCard to="/reminders" icon="bell" title={t('tools.reminders')} sub={t('tools.remindersSub')} />
        <LinkCard to="/schedule" icon="calendar" title={t('tools.schedule')} sub={t('tools.scheduleSub')} />
        <LinkCard
          to="/treatments"
          icon="syringe"
          title={t('tools.treatments')}
          sub={t('tools.treatmentsSub')}
        />
        {isMarketOpen() && (
          <LinkCard to="/market" icon="star" title={t('mk.title')} sub={t('mk.toolsSub')} />
        )}
        <LinkCard to="/contact" icon="chat" title={t('tools.contact')} sub={t('tools.contactSub')} />
        <LinkCard to="/about" icon="info" title={t('tools.about')} />
      </div>
      <ShareAppCard className="mt-4" />
      <ApkCard className="mt-4" />
    </Page>
  )
}
