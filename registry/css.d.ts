// Ambient declarations for the generated wrappers under registry/.
// haze-ui resolves through the package-name self-reference (package.json
// exports → dist types), but its per-component CSS side-effect imports
// ('haze-ui/css/button.css') have no type backing — declare them here.
declare module 'haze-ui/css/*';
declare module 'haze-ui/styles.css';
