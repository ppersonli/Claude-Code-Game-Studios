import { describe, it, expect } from 'vitest'
import { Tube } from '../../src/games/color-chaos/core/Tube'
import { GameState } from '../../src/games/color-chaos/core/GameState'
import { LevelGenerator } from '../../src/games/color-chaos/core/LevelGenerator'
import { GAME_COLORS, getColorById } from '../../src/games/color-chaos/core/Color'
import { GAME_SKINS, getSkinById } from '../../src/games/color-chaos/core/Skin'

// ===== Tube =====

describe('Tube', () => {
  it('test_tube_default_capacity_is_4', () => {
    const tube = new Tube()
    expect(tube.maxCapacity).toBe(4)
  })

  it('test_tube_custom_capacity', () => {
    const tube = new Tube(6)
    expect(tube.maxCapacity).toBe(6)
  })

  it('test_tube_starts_empty', () => {
    const tube = new Tube()
    expect(tube.isEmpty()).toBe(true)
    expect(tube.size).toBe(0)
    expect(tube.peekTop()).toBeUndefined()
    expect(tube.peekBottom()).toBeUndefined()
  })

  it('test_tube_push_adds_layer', () => {
    const tube = new Tube()
    expect(tube.push(1)).toBe(true)
    expect(tube.size).toBe(1)
    expect(tube.peekTop()).toBe(1)
    expect(tube.peekBottom()).toBe(1)
  })

  it('test_tube_push_returns_false_when_full', () => {
    const tube = new Tube(2)
    tube.push(1)
    tube.push(2)
    expect(tube.push(3)).toBe(false)
    expect(tube.size).toBe(2)
  })

  it('test_tube_pop_removes_top_layer', () => {
    const tube = new Tube()
    tube.push(1)
    tube.push(2)
    expect(tube.pop()).toBe(2)
    expect(tube.size).toBe(1)
    expect(tube.peekTop()).toBe(1)
  })

  it('test_tube_pop_returns_undefined_when_empty', () => {
    const tube = new Tube()
    expect(tube.pop()).toBeUndefined()
  })

  it('test_tube_peekTop_does_not_remove', () => {
    const tube = new Tube()
    tube.push(5)
    tube.peekTop()
    expect(tube.size).toBe(1)
  })

  it('test_tube_peekBottom_returns_first_layer', () => {
    const tube = new Tube()
    tube.push(1)
    tube.push(2)
    tube.push(3)
    expect(tube.peekBottom()).toBe(1)
    expect(tube.peekTop()).toBe(3)
  })

  it('test_tube_isSorted_true_for_empty', () => {
    const tube = new Tube()
    expect(tube.isSorted()).toBe(true)
  })

  it('test_tube_isSorted_true_for_full_same_color', () => {
    const tube = new Tube(3)
    tube.push(1)
    tube.push(1)
    tube.push(1)
    expect(tube.isSorted()).toBe(true)
  })

  it('test_tube_isSorted_false_for_partial', () => {
    const tube = new Tube(4)
    tube.push(1)
    tube.push(1)
    expect(tube.isSorted()).toBe(false)
  })

  it('test_tube_isSorted_false_for_mixed_colors', () => {
    const tube = new Tube(2)
    tube.push(1)
    tube.push(2)
    expect(tube.isSorted()).toBe(false)
  })

  it('test_tube_isFull_false_when_not_at_capacity', () => {
    const tube = new Tube(4)
    tube.push(1)
    tube.push(2)
    expect(tube.isFull()).toBe(false)
  })

  it('test_tube_isFull_true_at_capacity', () => {
    const tube = new Tube(2)
    tube.push(1)
    tube.push(2)
    expect(tube.isFull()).toBe(true)
  })

  it('test_tube_getTopColorCount_single', () => {
    const tube = new Tube(4)
    tube.push(1)
    tube.push(2)
    tube.push(2)
    expect(tube.getTopColorCount()).toBe(2)
  })

  it('test_tube_getTopColorCount_all_same', () => {
    const tube = new Tube(4)
    tube.push(1)
    tube.push(1)
    tube.push(1)
    tube.push(1)
    expect(tube.getTopColorCount()).toBe(4)
  })

  it('test_tube_getTopColorCount_empty_returns_0', () => {
    const tube = new Tube()
    expect(tube.getTopColorCount()).toBe(0)
  })

  it('test_tube_setLayers_replaces_content', () => {
    const tube = new Tube(4)
    tube.push(1)
    tube.setLayers([3, 3, 3])
    expect(tube.getLayers()).toEqual([3, 3, 3])
    expect(tube.size).toBe(3)
  })

  it('test_tube_getLayers_returns_copy', () => {
    const tube = new Tube()
    tube.push(1)
    const layers = tube.getLayers()
    layers.push(99)
    expect(tube.size).toBe(1)
  })

  it('test_tube_clear_empties_tube', () => {
    const tube = new Tube()
    tube.push(1)
    tube.push(2)
    tube.clear()
    expect(tube.isEmpty()).toBe(true)
    expect(tube.size).toBe(0)
  })
})

// ===== GameState =====

describe('GameState', () => {
  function makeConfig(initialTubes: number[][], capacity = 4, colorCount = 2) {
    return {
      tubeCount: initialTubes.length,
      tubeCapacity: capacity,
      initialTubes,
      colorCount,
    }
  }

  it('test_gameState_initializes_from_config', () => {
    const gs = new GameState(makeConfig([[1, 1, 2, 2], [2, 2, 1, 1], []]))
    expect(gs.tubeCount).toBe(3)
    expect(gs.tubeCapacity).toBe(4)
    expect(gs.colorCount).toBe(2)
    expect(gs.moveCount).toBe(0)
  })

  it('test_gameState_initial_completion_detected', () => {
    const gs = new GameState(makeConfig([[1, 1, 1, 1], [2, 2, 2, 2], []]))
    expect(gs.isComplete).toBe(true)
  })

  it('test_gameState_not_complete_initially', () => {
    const gs = new GameState(makeConfig([[1, 2, 1, 2], [2, 1, 2, 1], []]))
    expect(gs.isComplete).toBe(false)
  })

  it('test_gameState_move_invalid_source_index', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    const result = gs.move(-1, 1)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Invalid source tube index')
  })

  it('test_gameState_move_invalid_dest_index', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    const result = gs.move(0, 5)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Invalid destination tube index')
  })

  it('test_gameState_move_same_tube_rejected', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    const result = gs.move(0, 0)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Cannot move to the same tube')
  })

  it('test_gameState_move_empty_source_rejected', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    const result = gs.move(2, 0)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Source tube is empty')
  })

  it('test_gameState_move_full_dest_rejected', () => {
    const gs = new GameState(makeConfig([[1], [2, 2, 2, 2], [1, 1, 1]], 4))
    const result = gs.move(0, 1)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Destination tube is full')
  })

  it('test_gameState_move_color_mismatch_rejected', () => {
    const gs = new GameState(makeConfig([[1], [2], []], 2))
    const result = gs.move(0, 1)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('Color mismatch')
  })

  it('test_gameState_move_single_layer_success', () => {
    const gs = new GameState(makeConfig([[1], [2], []], 2))
    const result = gs.move(0, 2)
    expect(result.success).toBe(true)
    expect(result.layersMoved).toBe(1)
    expect(gs.moveCount).toBe(1)
  })

  it('test_gameState_move_multi_layer_pour', () => {
    const gs = new GameState(makeConfig([[1, 1, 2], [2], []], 3))
    const result = gs.move(0, 2)
    expect(result.success).toBe(true)
    expect(result.layersMoved).toBe(1)
    expect(gs.tubes[2].getLayers()).toEqual([2])
  })

  it('test_gameState_move_multi_matching_layers', () => {
    const gs = new GameState(makeConfig([[2, 1, 1], [2, 2], []], 4))
    // Source top is 1, dest top is 2 → mismatch, move fails
    // Instead: move from tube 1 (top=2) to tube 0 (top=1) → mismatch too
    // Use proper setup: move same-color stack
    const gs2 = new GameState(makeConfig([[1, 2, 2], [1, 1], []], 4))
    // Tube 0: [1, 2, 2], top=2, count=2. Tube 1: [1, 1], top=1 → mismatch
    // Let's move 2,2 to empty tube
    const result = gs2.move(0, 2)
    expect(result.success).toBe(true)
    expect(result.layersMoved).toBe(2)
    expect(gs2.tubes[2].getLayers()).toEqual([2, 2])
  })

  it('test_gameState_move_capped_by_available_space', () => {
    // Tube 0: [2,1,1,1] cap=4, top=1 count=3. Tube 2: [1,1,1] cap=4, 1 slot left
    const gs = new GameState(makeConfig([[2, 1, 1, 1], [], [1, 1, 1]], 4))
    const result = gs.move(0, 2)
    expect(result.success).toBe(true)
    expect(result.layersMoved).toBe(1) // only 1 slot available in tube 2
    expect(gs.tubes[2].getLayers()).toEqual([1, 1, 1, 1])
    expect(gs.tubes[0].getLayers()).toEqual([2, 1, 1])
  })

  it('test_gameState_move_to_empty_tube', () => {
    const gs = new GameState(makeConfig([[1, 1, 2], [], [2, 2]], 3))
    const result = gs.move(0, 1)
    expect(result.success).toBe(true)
    expect(result.layersMoved).toBe(1)
  })

  it('test_gameState_completion_detected_after_move', () => {
    const gs = new GameState(makeConfig([[1, 1, 2], [2, 2], []], 3))
    expect(gs.isComplete).toBe(false)
    gs.move(0, 1) // moves 2 to [2,2] → [2,2,2] sorted, [1,1] → [1,1] but not full
    // [1,1] is not full so not sorted → not complete
    expect(gs.isComplete).toBe(false)
  })

  it('test_gameState_completion_when_all_sorted', () => {
    const gs = new GameState(makeConfig([[1, 1], [2, 2], []], 2))
    gs.move(0, 1) // fail: mismatch
    gs.move(0, 2) // move 1 to empty
    gs.move(0, 2) // move 1 to [1] → [1,1] sorted
    gs.move(1, 0) // move 2 to empty (tube 0 was emptied)
    gs.move(1, 0) // move 2 to [2] → [2,2] sorted
    // tubes: [2,2], [], [1,1] → all non-empty sorted
    expect(gs.isComplete).toBe(true)
  })

  it('test_gameState_getStateSnapshot_returns_copy', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    const snap = gs.getStateSnapshot()
    expect(snap).toEqual([[1, 2], [2, 1], []])
    snap[0].push(99)
    expect(gs.tubes[0].size).toBe(2)
  })

  it('test_gameState_restoreState_restores_tubes', () => {
    const gs = new GameState(makeConfig([[1, 2], [2, 1], []], 2))
    gs.move(0, 2)
    expect(gs.tubes[0].size).toBe(1)
    gs.restoreState([[1, 2], [2, 1], []])
    expect(gs.tubes[0].getLayers()).toEqual([1, 2])
    expect(gs.moveCount).toBe(1) // moveCount not restored
  })

  it('test_gameState_getSortedTubeCount', () => {
    const gs = new GameState(makeConfig([[1, 1, 1, 1], [2, 2], []], 4))
    expect(gs.getSortedTubeCount()).toBe(1)
  })

  it('test_gameState_getEmptyTubeCount', () => {
    const gs = new GameState(makeConfig([[1, 1], [2, 2], []], 2))
    expect(gs.getEmptyTubeCount()).toBe(1)
  })

  it('test_gameState_getTotalLayers', () => {
    const gs = new GameState(makeConfig([[1, 2], [3, 4], []], 2))
    expect(gs.getTotalLayers()).toBe(4)
  })
})

// ===== LevelGenerator =====

describe('LevelGenerator', () => {
  it('test_levelGenerator_generate_returns_valid_config', () => {
    const config = LevelGenerator.generate(3, 4, 2)
    expect(config.tubeCount).toBe(5)
    expect(config.tubeCapacity).toBe(4)
    expect(config.colorCount).toBe(3)
    expect(config.initialTubes).toHaveLength(5)
  })

  it('test_levelGenerator_generate_has_correct_total_layers', () => {
    const config = LevelGenerator.generate(4, 4, 2)
    const totalLayers = config.initialTubes.reduce((sum, t) => sum + t.length, 0)
    expect(totalLayers).toBe(4 * 4) // 4 colors * 4 layers each
  })

  it('test_levelGenerator_generate_has_empty_tubes', () => {
    const config = LevelGenerator.generate(3, 4, 2)
    const emptyCount = config.initialTubes.filter(t => t.length === 0).length
    expect(emptyCount).toBe(2)
  })

  it('test_levelGenerator_generate_invalid_color_count_throws', () => {
    expect(() => LevelGenerator.generate(0)).toThrow('Color count must be between 1 and 12')
    expect(() => LevelGenerator.generate(13)).toThrow('Color count must be between 1 and 12')
  })

  it('test_levelGenerator_generate_invalid_capacity_throws', () => {
    expect(() => LevelGenerator.generate(3, 1)).toThrow('Tube capacity must be between 2 and 6')
    expect(() => LevelGenerator.generate(3, 7)).toThrow('Tube capacity must be between 2 and 6')
  })

  it('test_levelGenerator_create_builds_config', () => {
    const config = LevelGenerator.create(3, 4, [[1, 1, 1], [2, 2, 2], []], 2)
    expect(config.tubeCount).toBe(3)
    expect(config.colorCount).toBe(2)
  })

  it('test_levelGenerator_validate_valid_config_returns_true', () => {
    const config = LevelGenerator.create(4, 4, [[1, 1, 1, 1], [2, 2, 2, 2], [], []], 2)
    expect(LevelGenerator.validate(config)).toBe(true)
  })

  it('test_levelGenerator_validate_too_few_tubes_throws', () => {
    const config = LevelGenerator.create(2, 4, [[1, 1], [2, 2]], 2)
    expect(() => LevelGenerator.validate(config)).toThrow('Need at least 3 tubes')
  })

  it('test_levelGenerator_validate_low_capacity_throws', () => {
    const config = LevelGenerator.create(3, 1, [[1], [2], []], 2)
    expect(() => LevelGenerator.validate(config)).toThrow('Tube capacity must be at least 2')
  })

  it('test_levelGenerator_validate_invalid_color_count_throws', () => {
    const config = LevelGenerator.create(3, 4, [[1, 1], [2, 2], []], 0)
    expect(() => LevelGenerator.validate(config)).toThrow('Color count must be between 1 and 12')
  })

  it('test_levelGenerator_validate_tube_count_mismatch_throws', () => {
    const config = LevelGenerator.create(3, 4, [[1, 1], [2, 2]], 2)
    expect(() => LevelGenerator.validate(config)).toThrow('initialTubes length must match tubeCount')
  })

  it('test_levelGenerator_validate_exceeds_capacity_throws', () => {
    const config = LevelGenerator.create(3, 2, [[1, 1, 1], [2, 2], []], 2)
    expect(() => LevelGenerator.validate(config)).toThrow('Tube exceeds max capacity')
  })

  it('test_levelGenerator_shuffleArray_returns_same_elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = LevelGenerator.shuffleArray([...arr])
    expect(shuffled.sort()).toEqual(arr.sort())
  })

  it('test_levelGenerator_shuffleArray_mutates_in_place', () => {
    const arr = [1, 2, 3]
    const result = LevelGenerator.shuffleArray(arr)
    expect(result).toBe(arr)
  })
})

// ===== Color data =====

describe('GAME_COLORS', () => {
  it('test_colors_has_12_entries', () => {
    expect(GAME_COLORS).toHaveLength(12)
  })

  it('test_colors_have_unique_ids', () => {
    const ids = GAME_COLORS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_colors_have_required_fields', () => {
    for (const c of GAME_COLORS) {
      expect(typeof c.id).toBe('number')
      expect(c.name).toBeTruthy()
      expect(c.hex).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('getColorById', () => {
  it('test_getColorById_returns_correct_color', () => {
    const red = getColorById(0)
    expect(red.name).toBe('red')
    expect(red.hex).toBe('#FF4444')
  })

  it('test_getColorById_invalid_id_throws', () => {
    expect(() => getColorById(99)).toThrow('Color with id 99 not found')
  })
})

// ===== Skin data =====

describe('GAME_SKINS', () => {
  it('test_skins_has_10_entries', () => {
    expect(GAME_SKINS).toHaveLength(10)
  })

  it('test_skins_have_unique_ids', () => {
    const ids = GAME_SKINS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_skins_have_required_fields', () => {
    for (const s of GAME_SKINS) {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
      expect(s.description).toBeTruthy()
      expect(s.cost).toBeGreaterThanOrEqual(0)
      expect(s.visuals).toBeDefined()
      expect(typeof s.visuals.glassColor).toBe('number')
      expect(typeof s.visuals.borderColor).toBe('number')
    }
  })

  it('test_classic_skin_is_free', () => {
    const classic = GAME_SKINS.find(s => s.id === 'classic')!
    expect(classic.cost).toBe(0)
  })

  it('test_skins_rarity_distribution', () => {
    const rarities = GAME_SKINS.map(s => s.rarity)
    expect(rarities.filter(r => r === 'common')).toHaveLength(3)
    expect(rarities.filter(r => r === 'rare')).toHaveLength(3)
    expect(rarities.filter(r => r === 'epic')).toHaveLength(3)
    expect(rarities.filter(r => r === 'legendary')).toHaveLength(1)
  })
})

describe('getSkinById', () => {
  it('test_getSkinById_returns_correct_skin', () => {
    const skin = getSkinById('classic')
    expect(skin.name).toBe('Classic Glass')
  })

  it('test_getSkinById_invalid_id_throws', () => {
    expect(() => getSkinById('nonexistent')).toThrow('Skin with id "nonexistent" not found')
  })
})
