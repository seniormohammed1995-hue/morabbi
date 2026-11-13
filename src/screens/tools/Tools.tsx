import { t } from '../../i18n'
import { Page, PageHeader } from '../../ui/kit'
import { LinkCard } from '../parts'

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
      </div>
    </Page>
  )
}
