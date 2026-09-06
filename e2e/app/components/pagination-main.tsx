/**
 * Pagination fixture for the RTL e2e baseline (e2e/rtl.spec.ts): page 3
 * of 10 keeps both arrows enabled and exercises the ellipsis + active
 * states; a controlled `page` keeps the fixture deterministic.
 */
import { Pagination } from '../../../src/lib/components/Pagination';

import { mountPage } from './mount';

mountPage(<Pagination total={100} pageSize={10} page={3} />);
