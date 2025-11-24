import { createCampaign, listCampaigns } from '../api/campaigns';
import type { CampaignSummary } from '../api/campaigns';
import { clearElement, createElement, showMessage } from '../components/dom';

function randomCampaignId() {
  return `camp-${Math.random().toString(36).slice(2, 8)}`;
}

export function renderCampaignListView(container: HTMLElement) {
  clearElement(container);
  const view = createElement('div', 'view');
  container.appendChild(view);

  view.appendChild(createElement('h1', undefined, 'Forgesworn Hearth'));
  view.appendChild(
    createElement(
      'p',
      'muted',
      'Create a new campaign or jump straight to an existing one using its id.'
    )
  );

  const status = createElement('div');
  view.appendChild(status);

  const form = document.createElement('form');
  const nameInput = createElement('input') as HTMLInputElement;
  nameInput.name = 'name';
  nameInput.placeholder = 'Campaign name';
  nameInput.required = true;

  const idInput = createElement('input') as HTMLInputElement;
  idInput.name = 'campaignId';
  idInput.placeholder = 'campaign-id';
  idInput.value = randomCampaignId();
  idInput.required = true;

  const truthsInput = document.createElement('textarea');
  truthsInput.name = 'worldTruths';
  truthsInput.placeholder = 'World truths (one per line, optional)';
  truthsInput.rows = 3;

  const submit = createElement('button') as HTMLButtonElement;
  submit.type = 'submit';
  submit.textContent = 'Create campaign';

  form.append(
    createElement('label', undefined, 'Name'),
    nameInput,
    createElement('label', undefined, 'Campaign ID'),
    idInput,
    truthsInput,
    submit
  );

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    status.textContent = 'Creating campaign...';
    submit.disabled = true;
    try {
      const worldTruths = truthsInput.value
        ? truthsInput.value.split('\n').map((t) => t.trim()).filter(Boolean)
        : undefined;
      const campaign = await createCampaign({
        campaignId: idInput.value.trim(),
        name: nameInput.value.trim(),
        worldTruths,
      });
      status.textContent = 'Created! Redirecting...';
      window.location.hash = `#/campaign/${campaign.campaignId}`;
    } catch (error) {
      status.textContent = '';
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      showMessage(status, message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  view.appendChild(form);

  const listHeader = createElement('h2', undefined, 'Recent campaigns');
  listHeader.style.marginTop = '16px';
  view.appendChild(listHeader);

  const list = createElement('ul', 'grid');
  view.appendChild(list);

  const manualNav = document.createElement('form');
  manualNav.className = 'inline-controls';
  const navInput = createElement('input') as HTMLInputElement;
  navInput.placeholder = 'Existing campaign id';
  navInput.required = true;
  const navButton = createElement('button', 'secondary') as HTMLButtonElement;
  navButton.type = 'submit';
  navButton.textContent = 'Open';
  manualNav.append(navInput, navButton);
  manualNav.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const id = navInput.value.trim();
    if (id) {
      window.location.hash = `#/campaign/${id}`;
    }
  });
  view.appendChild(manualNav);

  async function refreshList() {
    clearElement(list);
    const campaigns: CampaignSummary[] = await listCampaigns();
    if (!campaigns.length) {
      showMessage(list, 'No campaigns tracked yet. Create one or paste an id above.');
      return;
    }

    for (const camp of campaigns) {
      const item = createElement('li', 'list-card');
      const title = createElement('h3', undefined, camp.name || camp.campaignId);
      const link = createElement(
        'a',
        undefined,
        'Open'
      ) as HTMLAnchorElement;
      link.href = `#/campaign/${camp.campaignId}`;
      const idLine = createElement('p', 'muted', `ID: ${camp.campaignId}`);
      item.append(title, idLine, link);
      list.appendChild(item);
    }
  }

  refreshList();
}
