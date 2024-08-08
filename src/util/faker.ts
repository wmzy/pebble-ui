import type { Schema } from 'json-schema-faker';

import * as R from 'ramda';
import { format } from 'date-fns';
import { JSONSchemaFaker as jsf } from 'json-schema-faker';
import { faker } from '@faker-js/faker';

jsf.extend('faker', () => faker);
jsf.format('date-string', () => format(faker.date.recent(), 'yyyy-MM-dd'));

export function schemaFaker<T = unknown>(schema: unknown): Promise<T> {
  console.log('faker:', schema);
  return jsf.resolve(schema as Schema) as Promise<T>;
}

export function fakerWhenNothing<
  F extends (...args: unknown[]) => Promise<unknown>,
>(fn: F, schema: unknown): F {
  return R.pipe(
    fn,
    R.andThen(R.when(R.isEmpty, () => schemaFaker(schema))),
    R.otherwise(() => schemaFaker(schema))
  );
}
