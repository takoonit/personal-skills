const visible = new Map<string, boolean>()
export function setPanelVisible(panelId: string, isVisible: boolean): void { visible.set(panelId, isVisible) }
export function isPanelVisible(panelId: string): boolean { return visible.get(panelId) ?? true }
