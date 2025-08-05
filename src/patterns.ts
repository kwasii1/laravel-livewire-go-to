export const COMPONENT_PATTERNS = {
  bladeComponent: /<x-([a-zA-Z0-9\-_.]+)(?:\s|>|\/)/g,

  fluxComponent: /<flux:([a-zA-Z0-9\-_.]+)(?:\s|>|\/)/g,

  livewireDirectiveString: /@livewire\s*\(\s*['"]([a-zA-Z0-9\-_.]+)['"]/g,

  livewireDirectiveClass: /@livewire\s*\(\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,

  livewireTag: /<livewire:([a-zA-Z0-9\-_.]+)(?:\s|\/|>)/g,

  bladeDirective: /@(include|extends)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,

  voltRoute: /Volt::route\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
};
