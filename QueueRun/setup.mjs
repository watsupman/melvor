export async function setup(ctx) {
  await ctx.onCharacterLoaded(ctx => {
    const queueRunButton = QueueRun(ctx);
    ui.create(queueRunButton, document.getElementById('combat-enemy-options'));
    const enemyDeathPatch = ctx.patch(BaseManager, 'onEnemyDeath');
    enemyDeathPatch.after(function() {return afterEnemyDeath(queueRunButton)});
  });
}

function QueueRun(ctx) {
  return PetiteVue.reactive({
    $template: '#queue-run',
    isSelected: false,
    queueRun() {
      this.isSelected = !this.isSelected;
    }
  });
}

function afterEnemyDeath (queueRunButton) {
  if (queueRunButton.isSelected) {
    queueRunButton.isSelected = false;
    game.combat.loot.lootAll();
    return true;
  }
}