import { getCampaign } from '../api/campaigns';
import { revealHexArea } from '../api/hex';
import type { CampaignDto, HexDto } from '../api/types';
import { clearElement, createElement, showMessage } from '../components/dom';

interface Props {
  campaignId: string;
}

export function renderHexMapView(container: HTMLElement, { campaignId }: Props) {
  clearElement(container);
  const view = createElement('div', 'view');
  container.appendChild(view);

  view.appendChild(createElement('h1', undefined, 'Hex Map'));
  const status = createElement('div');
  view.appendChild(status);

  const backLink = createElement('a', undefined, 'Back to campaign') as HTMLAnchorElement;
  backLink.href = `#/campaign/${campaignId}`;
  view.appendChild(backLink);

  const controls = document.createElement('form');
  controls.className = 'inline-controls';

  const xInput = createElement('input') as HTMLInputElement;
  xInput.type = 'number';
  xInput.placeholder = 'X';
  xInput.value = '0';

  const yInput = createElement('input') as HTMLInputElement;
  yInput.type = 'number';
  yInput.placeholder = 'Y';
  yInput.value = '0';

  const allowPoiInput = createElement('input') as HTMLInputElement;
  allowPoiInput.type = 'checkbox';
  allowPoiInput.checked = true;
  const allowPoiLabel = createElement('label', undefined, 'Allow POIs');
  allowPoiLabel.appendChild(allowPoiInput);

  const submit = createElement('button') as HTMLButtonElement;
  submit.type = 'submit';
  submit.textContent = 'Reveal area';

  controls.append(xInput, yInput, allowPoiLabel, submit);
  view.appendChild(controls);

  const hexList = createElement('ul', 'grid');
  view.appendChild(hexList);

  let campaign: CampaignDto | null = null;
  let hexes: HexDto[] = [];

  function mergeHexes(newHexes: HexDto[]) {
    const map = new Map<string, HexDto>();
    [...hexes, ...newHexes].forEach((hex) => {
      map.set(`${hex.x},${hex.y}`, hex);
    });
    hexes = Array.from(map.values());
  }

  function renderHexes() {
    clearElement(hexList);
    if (!hexes.length) {
      showMessage(hexList, 'No revealed hexes yet.');
      return;
    }

    hexes
      .slice()
      .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
      .forEach((hex) => {
        const item = createElement('li', 'list-card');
        item.appendChild(createElement('h4', undefined, `(${hex.x}, ${hex.y})`));
        item.appendChild(createElement('p', 'muted', hex.biome));
        if (hex.settlementName) {
          item.appendChild(createElement('p', undefined, `Settlement: ${hex.settlementName}`));
        }
        if (hex.siteName) {
          item.appendChild(createElement('p', undefined, `Site: ${hex.siteName}`));
        }
        item.appendChild(createElement('p', 'muted', hex.discovered ? 'Discovered' : 'Hidden'));
        hexList.appendChild(item);
      });
  }

  controls.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    submit.disabled = true;
    status.textContent = 'Revealing area...';
    try {
      const payload = {
        x: Number(xInput.value),
        y: Number(yInput.value),
        allowPoi: allowPoiInput.checked,
      };
      const result = await revealHexArea(campaignId, payload);
      campaign = result.campaign;
      mergeHexes(result.hexes);
      renderHexes();
      status.textContent = 'Area revealed.';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reveal area';
      status.textContent = '';
      showMessage(status, message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  async function loadCampaign() {
    status.textContent = 'Loading map...';
    try {
      campaign = await getCampaign(campaignId);
      hexes = campaign.hexMap ?? [];
      renderHexes();
      status.textContent = '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load campaign';
      status.textContent = '';
      clearElement(hexList);
      showMessage(hexList, message, 'error');
    }
  }

  loadCampaign();
}
