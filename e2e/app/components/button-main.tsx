/**
 * Button fixture for the RTL e2e baseline (e2e/rtl.spec.ts): the three
 * variants plus a disabled control — the shapes whose inline padding and
 * icon slots are the interesting part under a mirrored inline axis.
 */
import { Button } from '../../../src/lib/components/Button';

import { mountPage } from './mount';

mountPage(
  <>
    <Button variant="solid">Solid action</Button>
    <Button variant="outline">Outline action</Button>
    <Button variant="ghost">Ghost action</Button>
    <Button variant="solid" disabled>
      Disabled action
    </Button>
  </>
);
