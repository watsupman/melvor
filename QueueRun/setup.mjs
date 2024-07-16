export async function setup(ctx) {
  await ctx.onCharacterLoaded(ctx => {
    const queueRunButton = QueueRun(ctx);
    ui.create(queueRunButton, document.getElementById('combat-enemy-options'));
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
    $template: '#queue-run',
    isSelected: false,
    stopDungeon: false,
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