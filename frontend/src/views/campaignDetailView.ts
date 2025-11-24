import { addCharacter, getCampaign } from '../api/campaigns';
import type { CampaignDto, CharacterDto } from '../api/types';
import { clearElement, createElement, showMessage } from '../components/dom';

interface Props {
  campaignId: string;
}

function uid(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function makeCharacterPayload(base: Partial<CharacterDto>): CharacterDto {
  return {
    characterId: base.characterId ?? uid('char'),
    name: base.name ?? 'New character',
    edge: base.edge ?? 1,
    heart: base.heart ?? 1,
    iron: base.iron ?? 1,
    shadow: base.shadow ?? 1,
    wits: base.wits ?? 1,
    health: base.health ?? 5,
    spirit: base.spirit ?? 5,
    supply: base.supply ?? 5,
    momentum: base.momentum ?? 2,
    momentumMax: base.momentumMax ?? 10,
    momentumReset: base.momentumReset ?? 2,
    debilities: base.debilities ?? {},
    assets: base.assets ?? [],
    vows: base.vows ?? [],
    notes: base.notes,
  };
}

export function renderCampaignDetailView(container: HTMLElement, { campaignId }: Props) {
  clearElement(container);
  const view = createElement('div', 'view');
  container.appendChild(view);

  const title = createElement('h1', undefined, 'Campaign');
  view.appendChild(title);

  const status = createElement('div');
  view.appendChild(status);

  const content = createElement('div', 'stack');
  view.appendChild(content);

  let current: CampaignDto | null = null;

  function renderCampaign() {
    clearElement(content);
    if (!current) return;

    const header = createElement('div', 'stack');
    header.appendChild(createElement('h2', undefined, current.name));
    header.appendChild(createElement('p', 'muted', `ID: ${current.campaignId}`));
    content.appendChild(header);

    if (current.worldTruths && current.worldTruths.length) {
      const truths = createElement('ul', 'list-card');
      current.worldTruths.forEach((truth) => {
        truths.appendChild(createElement('li', undefined, truth));
      });
      const truthsWrap = createElement('div', 'stack');
      truthsWrap.append(createElement('h3', undefined, 'World truths'), truths);
      content.appendChild(truthsWrap);
    }

    const partySection = createElement('div', 'stack');
    partySection.appendChild(createElement('h3', undefined, 'Party'));
    const partyList = createElement('ul', 'grid');
    if (!current.party.length) {
      showMessage(partyList, 'No characters yet.');
    } else {
      current.party.forEach((char) => {
        const li = createElement('li', 'list-card');
        li.appendChild(createElement('h4', undefined, char.name));
        const stats = createElement(
          'p',
          'muted',
          `Edge ${char.edge} · Heart ${char.heart} · Iron ${char.iron} · Shadow ${char.shadow} · Wits ${char.wits}`
        );
        const link = createElement(
          'a',
          undefined,
          'Open dashboard'
        ) as HTMLAnchorElement;
        link.href = `#/campaign/${campaignId}/character/${char.characterId}`;
        li.append(stats, link);
        partyList.appendChild(li);
      });
    }
    partySection.appendChild(partyList);
    content.appendChild(partySection);

    const addCharacterForm = document.createElement('form');
    addCharacterForm.appendChild(createElement('h4', undefined, 'Add character'));
    const nameInput = createElement('input') as HTMLInputElement;
    nameInput.placeholder = 'Name';
    nameInput.required = true;

    const statRow = createElement('div', 'inline-controls');
    const statNames: Array<keyof Pick<CharacterDto, 'edge' | 'heart' | 'iron' | 'shadow' | 'wits'>> = [
      'edge',
      'heart',
      'iron',
      'shadow',
      'wits',
    ];
    const statInputs: Record<string, HTMLInputElement> = {};
    statNames.forEach((stat) => {
      const input = createElement('input') as HTMLInputElement;
      input.type = 'number';
      input.value = '1';
      input.min = '0';
      input.step = '1';
      input.placeholder = stat;
      statInputs[stat] = input;
      const wrap = createElement('label');
      wrap.textContent = stat.toUpperCase();
      wrap.appendChild(input);
      statRow.appendChild(wrap);
    });

    const submit = createElement('button') as HTMLButtonElement;
    submit.type = 'submit';
    submit.textContent = 'Add';
    addCharacterForm.append(nameInput, statRow, submit);
    addCharacterForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      submit.disabled = true;
      status.textContent = 'Adding character...';
    try {
      const payload = makeCharacterPayload({
        characterId: uid('char'),
          name: nameInput.value.trim(),
          edge: Number(statInputs.edge.value) || 0,
          heart: Number(statInputs.heart.value) || 0,
          iron: Number(statInputs.iron.value) || 0,
          shadow: Number(statInputs.shadow.value) || 0,
          wits: Number(statInputs.wits.value) || 0,
        });
        await addCharacter(campaignId, payload);
        await loadCampaign();
        nameInput.value = '';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not add character';
        showMessage(status, message, 'error');
      } finally {
        submit.disabled = false;
        status.textContent = '';
      }
    });
    content.appendChild(addCharacterForm);

    const npcSection = createElement('div', 'stack');
    npcSection.appendChild(createElement('h3', undefined, 'NPCs'));
    const npcList = createElement('ul', 'grid');
    if (!current.npcs.length) {
      showMessage(npcList, 'No NPCs recorded.');
    } else {
      current.npcs.forEach((npc) => {
        const li = createElement('li', 'list-card');
        li.appendChild(createElement('h4', undefined, npc.name));
        if (npc.role) li.appendChild(createElement('p', 'muted', npc.role));
        npcList.appendChild(li);
      });
    }
    npcSection.appendChild(npcList);
    content.appendChild(npcSection);

    const locationsSection = createElement('div', 'stack');
    locationsSection.appendChild(createElement('h3', undefined, 'Locations'));
    const locationList = createElement('ul', 'grid');
    if (!current.locations.length) {
      showMessage(locationList, 'No locations yet.');
    } else {
      current.locations.forEach((loc) => {
        const li = createElement('li', 'list-card');
        li.appendChild(createElement('h4', undefined, loc.name));
        li.appendChild(
          createElement('p', 'muted', `${loc.type} · (${loc.hex.x}, ${loc.hex.y})`)
        );
        locationList.appendChild(li);
      });
    }
    locationsSection.appendChild(locationList);
    content.appendChild(locationsSection);

    const mapLink = createElement(
      'a',
      undefined,
      'Open map view'
    ) as HTMLAnchorElement;
    mapLink.href = `#/campaign/${campaignId}/map`;
    content.appendChild(mapLink);
  }

  async function loadCampaign() {
    status.textContent = 'Loading campaign...';
    try {
      current = await getCampaign(campaignId);
      status.textContent = '';
      renderCampaign();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load campaign';
      status.textContent = '';
      clearElement(content);
      showMessage(content, message, 'error');
    }
  }

  loadCampaign();
}
