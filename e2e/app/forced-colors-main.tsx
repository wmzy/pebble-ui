/**
 * Fixture for the forced-colors e2e spec (e2e/forced-colors.spec.ts):
 * one representative surface per Windows-high-contrast repair family —
 * ghost Button boundary, self-drawn check states (Checkbox / Switch /
 * Radio / Slider range fill), shape-carrying animation art (Spinner /
 * Skeleton / Progress), selection chips (Segmented active / Pagination
 * current / Tabs active / Stepper circles), floating panels (Dialog /
 * Popover / Tooltip) and the box-shadow→outline focus repairs. The spec
 * activates forced-colors via emulateMedia and asserts computed styles
 * resolve to visible system colors; normal mode must stay untouched.
 */
import { useControl } from 'react-use-control';

import { Alert } from '../../src/lib/components/Alert';
import { Banner } from '../../src/lib/components/Banner';
import { Button } from '../../src/lib/components/Button';
import { Checkbox } from '../../src/lib/components/Checkbox';
import { Dialog } from '../../src/lib/components/Dialog';
import { Input } from '../../src/lib/components/Input';
import { Pagination } from '../../src/lib/components/Pagination';
import { Popover } from '../../src/lib/components/Popover';
import { Progress } from '../../src/lib/components/Progress';
import { Radio, RadioGroup } from '../../src/lib/components/Radio';
import { Rating } from '../../src/lib/components/Rating';
import { Segmented } from '../../src/lib/components/Segmented';
import { Skeleton } from '../../src/lib/components/Skeleton';
import { Slider } from '../../src/lib/components/Slider';
import { Spinner } from '../../src/lib/components/Spinner';
import { Step, Stepper } from '../../src/lib/components/Stepper';
import { Switch } from '../../src/lib/components/Switch';
import { Tab, TabList, Tabs } from '../../src/lib/components/Tabs';
import { Tooltip } from '../../src/lib/components/Tooltip';

import { mountPage } from './components/mount';

/** Interactive checkbox: unchecked initially so the spec checks it. */
function CheckboxDemo() {
  const [checked, setChecked] = useControl(undefined, false);
  return (
    <section id="fc-checkbox">
      <Checkbox checked={checked} onChange={setChecked} label="FC checkbox" />
      <Checkbox checked disabled label="FC checkbox disabled checked" />
    </section>
  );
}

function SwitchDemo() {
  const [on, setOn] = useControl(undefined, true);
  return (
    <section id="fc-switch">
      <Switch checked={on} onChange={setOn} aria-label="FC switch on" />
      <Switch aria-label="FC switch off" />
    </section>
  );
}

function DialogDemo() {
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);
  return (
    <section id="fc-dialog">
      <Button
        id="fc-dialog-opener"
        onClick={() => setDialogOpen(true)}
      >
        Open FC dialog
      </Button>
      <Dialog open={dialogControl} onClose={() => setDialogOpen(false)} title="FC dialog title">
        <p>FC dialog body</p>
      </Dialog>
    </section>
  );
}

function InputDemo() {
  const [text, setText] = useControl(undefined, 'FC input');
  return (
    <section id="fc-input">
      <Input id="fc-text-input" value={text} onChange={setText} aria-label="FC input" />
    </section>
  );
}

mountPage(
  <>
    {/* First focusable element on the page — the spec's Tab-press focus test. */}
    <section id="fc-buttons">
      <Button id="fc-ghost-button" variant="ghost">
        Ghost action
      </Button>
      <Button variant="solid">Solid action</Button>
      <Button variant="ghost" disabled>
        Disabled ghost
      </Button>
    </section>
    <CheckboxDemo />
    <SwitchDemo />
    <section id="fc-radio">
      <RadioGroup name="fc-radio" value="a">
        <Radio value="a">Radio A</Radio>
        <Radio value="b">Radio B</Radio>
      </RadioGroup>
    </section>
    <section id="fc-slider">
      <Slider range value={[20, 60]} aria-label={['FC low', 'FC high']} />
    </section>
    <section id="fc-rating">
      <Rating value={3} />
    </section>
    <section id="fc-segmented">
      <Segmented options={['alpha', 'beta', 'gamma']} value="beta" />
    </section>
    <section id="fc-progress">
      <Progress value={50} />
    </section>
    <section id="fc-spinner">
      <Spinner />
    </section>
    <section id="fc-skeleton">
      <Skeleton width={200} />
    </section>
    <section id="fc-pagination">
      <Pagination page={2} total={50} />
    </section>
    <section id="fc-tabs">
      <Tabs value="b">
        <TabList>
          <Tab value="a">Tab A</Tab>
          <Tab value="b">Tab B</Tab>
          <Tab value="c">Tab C</Tab>
        </TabList>
      </Tabs>
    </section>
    <section id="fc-stepper">
      <Stepper activeStep={1}>
        <Step title="One" />
        <Step title="Two" />
        <Step title="Three" />
      </Stepper>
    </section>
    <section id="fc-alert">
      <Alert closable>FC alert message</Alert>
    </section>
    <section id="fc-banner">
      <Banner onClose={() => undefined}>FC banner message</Banner>
    </section>
    <section id="fc-tooltip">
      <Tooltip content="FC tooltip text" open>
        <Button variant="outline">Tooltip host</Button>
      </Tooltip>
    </section>
    <section id="fc-popover">
      <Popover content="FC popover body">
        <Button id="fc-popover-trigger">Open FC popover</Button>
      </Popover>
    </section>
    <DialogDemo />
    <InputDemo />
  </>
);
