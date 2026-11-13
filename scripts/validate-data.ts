/** Validates all species/cycle data against the Zod schema. Exits non-zero on errors. */
import { validateAll, lowConfidenceValues, SPECIES } from '../src/data/index'
import { PROFILES } from '../src/data/birds'

const errors = validateAll()
if (errors.length > 0) {
  console.error(`✗ ${errors.length} data error(s):`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}
const low = lowConfidenceValues()
console.log(`✓ ${Object.keys(SPECIES).length} detailed species + ${PROFILES.length} bird profiles valid. ${low.length} low-confidence value(s) (see DATA_REVIEW.md).`)
