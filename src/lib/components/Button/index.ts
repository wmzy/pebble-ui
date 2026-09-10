export {default as Button} from './Button';
export type {ButtonProps} from './Button';
export {default as ButtonLink} from './ButtonLink';
export type {ButtonLinkProps} from './ButtonLink';
// The skin pieces `Button`/`ButtonLink` wear, exported for composition
// (shadcn `buttonVariants` precedent): build a custom element that still
// matches the design system by spreading these into its class list.
// Plain string constants — importing them adds no runtime beyond the
// styles module Button itself already depends on.
export {variants as buttonVariants, sizes as buttonSizes} from './styles';
