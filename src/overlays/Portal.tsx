import { Component, render } from 'preact';
import type { ComponentChildren } from 'preact';

interface ContextBridgeProps {
  children: ComponentChildren;
  context: Record<string, unknown>;
}

class ContextBridge extends Component<ContextBridgeProps> {
  getChildContext() {
    return this.props.context;
  }

  render() {
    return this.props.children;
  }
}

export interface PortalProps {
  children: ComponentChildren;
  container: Element;
}

/**
 * A small Preact-core portal. It owns a dedicated mount node so unmounting never clears unrelated
 * children in the target, and bridges the current Preact context into the portal root.
 */
export class Portal extends Component<PortalProps> {
  private container?: Element;
  private mount?: HTMLDivElement;

  componentDidMount() {
    this.renderPortal();
  }

  componentDidUpdate() {
    this.renderPortal();
  }

  componentWillUnmount() {
    this.clearPortal();
  }

  private clearPortal() {
    if (!this.mount) return;
    render(null, this.mount);
    this.mount.remove();
    this.mount = undefined;
    this.container = undefined;
  }

  private renderPortal() {
    if (this.container !== this.props.container) this.clearPortal();
    if (!this.mount) {
      this.container = this.props.container;
      this.mount = this.props.container.ownerDocument.createElement('div');
      this.mount.dataset.preactAriaPortal = '';
      this.mount.style.display = 'contents';
      this.props.container.append(this.mount);
    }
    render(
      <ContextBridge context={(this.context ?? {}) as Record<string, unknown>}>
        {this.props.children}
      </ContextBridge>,
      this.mount,
    );
  }

  render() {
    return null;
  }
}
