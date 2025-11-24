import { getCampaign } from '../api/campaigns';
import { rollMove } from '../api/moves';
import type { CampaignDto, CharacterDto, MoveRollResult } from '../api/types';
import { clearElement, createElement, showMessage } from '../components/dom';

interface Props {
  campaignId: string;
  characterId: string;
}

export function renderCharacterDashboardView(container: HTMLElement, { campaignId, characterId }: Props) {
  clearElement(container);
  const view = createElement('div', 'view');
  container.appendChild(view);

  const title = createElement('h1', undefined, 'Character Dashboard');
  view.appendChild(title);

  const status = createElement('div');
  view.appendChild(status);

  const content = createElement('div', 'stack');
  view.appendChild(content);

  const backLink = createElement('a', undefined, 'Back to campaign') as HTMLAnchorElement;
  backLink.href = `#/campaign/${campaignId}`;
  view.appendChild(backLink);

  let currentCampaign: CampaignDto | null = null;
  let currentCharacter: CharacterDto | null = null;

  function appendLog(result: MoveRollResult, target: HTMLElement) {
    const entry = createElement('div', 'log');
    entry.appendChild(
      createElement(
        'p',
        undefined,
        `${result.moveName ?? result.moveId} → ${result.outcome.replace('_', ' ')}`
      )
    );
    entry.appendChild(
      createElement(
        'p',
        'muted',
        `Action ${result.actionDie} vs challenge [${result.challengeDice.join(', ')}]; score ${
          result.actionScore
        }`
      )
    );
    if (result.text) {
      const out = result.text[result.outcome === 'strong_hit' ? 'strongHit' : result.outcome === 'weak_hit' ? 'weakHit' : 'miss'];
      if (out) entry.appendChild(createElement('p', undefined, out));
    }
    target.prepend(entry);
  }

  function renderCharacter() {
    clearElement(content);
    if (!currentCharacter) return;

    content.appendChild(createElement('h2', undefined, currentCharacter.name));
    const stats = createElement(
      'p',
      'muted',
      `Edge ${currentCharacter.edge} · Heart ${currentCharacter.heart} · Iron ${currentCharacter.iron} · Shadow ${currentCharacter.shadow} · Wits ${currentCharacter.wits}`
    );
    content.appendChild(stats);

    const tracks = createElement(
      'p',
      undefined,
      `Health ${currentCharacter.health} | Spirit ${currentCharacter.spirit} | Supply ${currentCharacter.supply} | Momentum ${currentCharacter.momentum}/${currentCharacter.momentumMax} (reset ${currentCharacter.momentumReset})`
    );
    content.appendChild(tracks);

    if (currentCharacter.vows.length) {
      const vowsList = createElement('ul', 'list-card');
      currentCharacter.vows.forEach((vow) => {
        vowsList.appendChild(
          createElement(
            'li',
            undefined,
            `${vow.name} (${vow.rank}) – progress ${vow.progress} ${vow.fulfilled ? '✓' : ''}`
          )
        );
      });
      content.append(vowsList);
    }

    const actions = createElement('div', 'stack');
    const rollStrikeBtn = createElement('button') as HTMLButtonElement;
    rollStrikeBtn.textContent = 'Roll Strike';
    const logArea = createElement('div');
    actions.appendChild(rollStrikeBtn);
    actions.appendChild(logArea);

    rollStrikeBtn.addEventListener('click', async () => {
      status.textContent = 'Rolling strike...';
      rollStrikeBtn.disabled = true;
      try {
        const result = await rollMove('strike', {
          statKey: 'iron',
          statValue: currentCharacter?.iron ?? 0,
        });
        appendLog(result, logArea);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to roll';
        showMessage(status, message, 'error');
      } finally {
        status.textContent = '';
        rollStrikeBtn.disabled = false;
      }
    });

    const manualForm = document.createElement('form');
    manualForm.className = 'stack';
    manualForm.appendChild(createElement('h3', undefined, 'Manual dice'));
    const moveIdInput = createElement('input') as HTMLInputElement;
    moveIdInput.placeholder = 'Move id (default strike)';
    moveIdInput.value = 'strike';

    const actionInput = createElement('input') as HTMLInputElement;
    actionInput.type = 'number';
    actionInput.placeholder = 'Action die (1-6)';

    const challenge1Input = createElement('input') as HTMLInputElement;
    challenge1Input.type = 'number';
    challenge1Input.placeholder = 'Challenge die 1 (1-10)';

    const challenge2Input = createElement('input') as HTMLInputElement;
    challenge2Input.type = 'number';
    challenge2Input.placeholder = 'Challenge die 2 (1-10)';

    const manualButton = createElement('button') as HTMLButtonElement;
    manualButton.type = 'submit';
    manualButton.textContent = 'Roll with manual dice';

    manualForm.append(
      moveIdInput,
      actionInput,
      challenge1Input,
      challenge2Input,
      manualButton
    );

    manualForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      manualButton.disabled = true;
      status.textContent = 'Rolling...';
      try {
        const moveId = moveIdInput.value.trim() || 'strike';
        const result = await rollMove(moveId, {
          statKey: 'iron',
          statValue: currentCharacter?.iron ?? 0,
          manualRolls: {
            action: Number(actionInput.value),
            challenge1: Number(challenge1Input.value),
            challenge2: Number(challenge2Input.value),
          },
        });
        appendLog(result, logArea);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Manual roll failed';
        showMessage(status, message, 'error');
      } finally {
        status.textContent = '';
        manualButton.disabled = false;
      }
    });

    actions.appendChild(manualForm);
    content.appendChild(actions);
  }

  async function loadData() {
    status.textContent = 'Loading character...';
    try {
      currentCampaign = await getCampaign(campaignId);
      currentCharacter = currentCampaign.party.find((c) => c.characterId === characterId) ?? null;
      if (!currentCharacter) {
        clearElement(content);
        showMessage(content, 'Character not found in this campaign.', 'error');
        return;
      }
      status.textContent = '';
      renderCharacter();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load character';
      status.textContent = '';
      clearElement(content);
      showMessage(content, message, 'error');
    }
  }

  loadData();
}
