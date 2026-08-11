import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import {
  Overlay,
  OverlayContainer,
  OverlayProvider,
  UNSAFE_PortalProvider,
  useModal,
  useOverlayFocusContain,
} from '../src';

const MessageContext = createContext('missing');

function ContextReader() {
  return <output>{useContext(MessageContext)}</output>;
}

function ModalContent() {
  const { modalProps } = useModal({ 'aria-label': 'Nested modal' });
  return <div {...modalProps}>Modal content</div>;
}

function ContainRequest() {
  useOverlayFocusContain();
  return <button>Inside overlay</button>;
}

describe('portal and overlay providers', () => {
  it('portals to the configured target, preserves context, and cleans up only its own root', async () => {
    const target = document.createElement('div');
    const unrelated = document.createElement('span');
    unrelated.textContent = 'Unrelated target content';
    target.append(unrelated);
    document.body.append(target);

    const view = render(
      <MessageContext.Provider value="bridged context">
        <UNSAFE_PortalProvider getContainer={() => target}>
          <Overlay disableFocusManagement>
            <ContextReader />
          </Overlay>
        </UNSAFE_PortalProvider>
      </MessageContext.Provider>,
    );

    await waitFor(() => expect(target).toHaveTextContent('bridged context'));
    expect(target).toHaveTextContent('Unrelated target content');
    expect(target.querySelector('[data-preact-a11y-portal]')).not.toBeNull();

    view.unmount();
    expect(target).toHaveTextContent('Unrelated target content');
    expect(target).not.toHaveTextContent('bridged context');
    target.remove();
  });

  it('lets a descendant request containment and restores focus after unmount', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const trigger = document.createElement('button');
    trigger.textContent = 'Overlay trigger';
    document.body.append(trigger);
    trigger.focus();

    const view = render(
      <Overlay portalContainer={target}>
        <ContainRequest />
      </Overlay>,
    );
    const inside = await screen.findByRole('button', { name: 'Inside overlay' });
    inside.focus();
    trigger.focus();
    expect(inside).toHaveFocus();

    view.unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
    target.remove();
  });

  it('hides parent provider content while a nested modal container is mounted', async () => {
    const portalTarget = document.createElement('div');
    document.body.append(portalTarget);

    function App({ open }: { open: boolean }) {
      return (
        <OverlayProvider data-testid="application">
          Application content
          {open && (
            <OverlayContainer portalContainer={portalTarget}>
              <ModalContent />
            </OverlayContainer>
          )}
        </OverlayProvider>
      );
    }

    const view = render(<App open />);
    const application = screen.getByTestId('application');
    await waitFor(() => expect(application).toHaveAttribute('aria-hidden', 'true'));
    expect(await screen.findByRole('dialog', { name: 'Nested modal' })).toHaveAttribute(
      'data-ismodal',
      'true',
    );

    view.rerender(<App open={false} />);
    await waitFor(() => expect(application).not.toHaveAttribute('aria-hidden'));
    expect(portalTarget).not.toHaveTextContent('Modal content');
    portalTarget.remove();
  });
});
