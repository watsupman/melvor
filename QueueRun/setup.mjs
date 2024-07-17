export async function setup(ctx) {
  await ctx.onInterfaceReady(ctx => {
    const modSetting = ctx.settings.section('Show/Hide Button');
    const queueRunButton = QueueRun(ctx);
    setupModSettings(ctx, modSetting, queueRunButton);
    var show = modSetting.get('show-button');
    queueRunButton.show = show;
    const parent = document.getElementById('combat-enemy-options');
    ui.create(queueRunButton, parent);
    updateButtonVisibility(ctx, show, queueRunButton);
    const enemyDeathPatch = ctx.patch(CombatManager, 'onEnemyDeath');
    enemyDeathPatch.after(function() {return afterEnemyDeath(queueRunButton)});
    const dungeonIncrementPatch = ctx.patch(CombatManager, 'increaseDungeonProgress');
    dungeonIncrementPatch.before(function() {beforeProgess(queueRunButton)});
    const strongholdIncrementPatch = ctx.patch(CombatManager, 'increaseStrongholdProgress');
    strongholdIncrementPatch.before(function() {beforeProgess(queueRunButton)});
  });
}

function QueueRun(ctx) {
  return PetiteVue.reactive({
    $template: '#queue-run-template',
    isSelected: false,
    stopDungeon: false,
    show: true,
    queueRun() {
      this.isSelected = !this.isSelected;
      this.stopProgress = false;
    }
  });
}

function afterEnemyDeath (queueRunButton) {
  if (queueRunButton.isSelected) {
    if (((game.combat.areaType === CombatAreaType.Dungeon || game.combat.areaType === CombatAreaType.Stronghold) 
          && queueRunButton.stopProgress
        ) 
        || (!(game.combat.areaType === CombatAreaType.Dungeon) && !(game.combat.areaType === CombatAreaType.Stronghold))) {
      queueRunButton.isSelected = false;
      queueRunButton.stopProgress = false;
      game.combat.loot.lootAll();
      return true;
    }
  }
}

function beforeProgess(queueRunButton) {
  if (queueRunButton.isSelected && (game.combat.areaProgress === (game.combat.selectedArea.monsters.length - 1))) {
    queueRunButton.stopProgress = true;
  }
}

function setupModSettings(ctx, settingSection, queueRunButton) {
  const showValue = ctx.characterStorage.getItem('show-button');
  const isButtonVisible = showValue !== undefined ? showValue : true; // Default visibility to true
  queueRunButton.show = isButtonVisible;
  if (showValue === undefined) {
    ctx.characterStorage.setItem('show-button', true);
  }
  settingSection.add({
    type: 'switch',
    name: 'show-button',
    label: 'Show/Hide Queue Run button',
    hint: 'Determines if the Queue Run button should appear on the combat page.',
    default: isButtonVisible,
    onChange: (value) => {
      updateButtonVisibility(ctx, value, queueRunButton);
    }
  });
}

function updateButtonVisibility(ctx, show, queueRunButton) {
  const parent = document.getElementById('combat-enemy-options');
  queueRunButton.isSelected = false;
  queueRunButton.stopProgress = false;
  queueRunButton.show = show;
  if (show) {
    const existingButton = parent.querySelector('#queue-run');
    existingButton.classList.toggle('btn-success', queueRunButton.isSelected);
    existingButton.classList.toggle('btn-secondary', !queueRunButton.isSelected);
  }
  ctx.characterStorage.setItem('show-button', show);
}