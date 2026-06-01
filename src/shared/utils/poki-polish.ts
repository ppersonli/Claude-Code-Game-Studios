/**
 * Poki-quality polish utilities shared across all games.
 * Phaser scene-based: particles, combo text, haptic, tutorial.
 */

// === Particles ===

export function spawnParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colors: number[] = [0xffd700, 0xff6b6b, 0x4CAF50, 0xCE93D8, 0xFF9800],
  count: number = 8,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const dist = 40 + Math.random() * 30
    const p = scene.add.circle(x, y, 3 + Math.random() * 2, colors[i % colors.length], 0.9).setDepth(300)
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 400 + Math.random() * 200,
      ease: 'Power2',
      onComplete: () => p.destroy(),
    })
  }
}

// === Combo Text ===

const COMBO_LABELS: Record<number, string> = {
  2: 'Double!',
  3: 'Triple!',
  4: 'AMAZING!',
  5: 'INCREDIBLE!',
}

export function showComboText(
  scene: Phaser.Scene,
  combo: number,
  x: number = 240,
  y: number = 350,
): void {
  const label = combo >= 6 ? `${combo}x COMBO!` : (COMBO_LABELS[combo] || `${combo}x`)
  const text = scene.add
    .text(x, y, `🔥 ${label}`, {
      fontSize: '26px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(500)
    .setScale(0.5)

  scene.tweens.add({
    targets: text,
    scaleX: 1.3,
    scaleY: 1.3,
    alpha: 0,
    y: y - 60,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  })
}

// === Haptic Feedback ===

export function addHapticFeedback(pattern: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'light': navigator.vibrate(20); break
      case 'medium': navigator.vibrate([30, 20, 30]); break
      case 'heavy': navigator.vibrate([50, 30, 50, 30, 50]); break
    }
  }
}

// === Tutorial Overlay ===

export function showTutorial(
  scene: Phaser.Scene,
  steps: string[],
  onComplete: () => void,
): void {
  const w = (scene.game.config.width as number) || 480
  const h = (scene.game.config.height as number) || 854

  const overlay = scene.add.container(0, 0).setDepth(999)
  let currentStep = 0

  const bg = scene.add.graphics()
  bg.fillStyle(0x000000, 0.55)
  bg.fillRect(0, 0, w, h)
  overlay.add(bg)

  const card = scene.add.graphics()
  overlay.add(card)

  const text = scene.add.text(w / 2, h / 2 - 20, '', {
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: 240 },
  }).setOrigin(0.5)
  overlay.add(text)

  const hint = scene.add.text(w / 2, h / 2 + 50, '(tap to continue)', {
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif',
    color: 'rgba(255,255,255,0.5)',
  }).setOrigin(0.5)
  overlay.add(hint)

  function renderStep() {
    card.clear()
    card.fillStyle(0x2d1b4e, 0.95)
    card.fillRoundedRect(w / 2 - 140, h / 2 - 60, 280, 120, 16)
    text.setText(steps[currentStep])
  }

  renderStep()

  const zone = scene.add.zone(w / 2, h / 2, w, h).setInteractive()
  overlay.add(zone)

  zone.on('pointerdown', () => {
    currentStep++
    if (currentStep >= steps.length) {
      overlay.destroy()
      onComplete()
    } else {
      renderStep()
    }
  })
}

// === Screen Shake (Phaser camera) ===

export function shakeCamera(scene: Phaser.Scene, duration: number = 150, intensity: number = 0.005): void {
  scene.cameras.main.shake(duration, intensity)
}

// === Fade transitions (Phaser camera) ===

export function fadeIn(scene: Phaser.Scene, duration: number = 300): void {
  scene.cameras.main.fadeIn(duration)
}

export function fadeOut(scene: Phaser.Scene, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    scene.cameras.main.fadeOut(duration, 0, 0, 0)
    scene.cameras.main.once('camerafadeoutcomplete', () => resolve())
  })
}
