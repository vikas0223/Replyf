import fs from 'fs';
import path from 'path';

const rawExercises = JSON.parse(fs.readFileSync('./scripts/data/exercises.json', 'utf8'));

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeMuscleName(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();
  if (lower.includes('chest') || lower.includes('pectoral')) return 'Chest';
  if (lower.includes('latissimus') || lower === 'lats') return 'Lats';
  if (lower.includes('quad')) return 'Quads';
  if (lower.includes('hamstring')) return 'Hamstrings';
  if (lower.includes('glute')) return 'Glutes';
  if (lower.includes('calv') || lower === 'soleus') return 'Calves';
  if (lower.includes('bicep') || lower === 'brachialis') return 'Biceps';
  if (lower.includes('tricep')) return 'Triceps';
  if (lower.includes('delt') || lower.includes('shoulder') || lower.includes('rotator cuff')) return 'Shoulders';
  if (lower.includes('abdom') || lower.includes('abs') || lower.includes('oblique')) return 'Abs';
  if (lower.includes('forearm') || lower.includes('wrist') || lower.includes('grip')) return 'Forearms';
  if (lower.includes('trap') || lower.includes('rhomboid') || lower.includes('levator')) return 'Traps';
  if (lower.includes('lower back') || lower === 'spine') return 'Lower Back';
  if (lower.includes('back')) return 'Back';
  if (lower.includes('inner thigh') || lower.includes('adductor') || lower === 'groin') return 'Adductors';
  if (lower.includes('abductor')) return 'Abductors';
  if (lower.includes('hip flexor')) return 'Hip Flexors';
  if (lower.includes('cardio') || lower.includes('feet') || lower.includes('ankle') || lower.includes('hand') || lower.includes('shin')) return 'Full Body';
  return capitalize(raw);
}

const TARGET_TO_MUSCLE = {
  'abs': { primary: 'Abs', secondary: 'Core', movement: 'isolation' },
  'quads': { primary: 'Quads', secondary: 'Glutes', movement: 'squat' },
  'lats': { primary: 'Lats', secondary: 'Back', movement: 'pull' },
  'calves': { primary: 'Calves', secondary: 'Lower Legs', movement: 'isolation' },
  'pectorals': { primary: 'Chest', secondary: 'Triceps', movement: 'push' },
  'glutes': { primary: 'Glutes', secondary: 'Hamstrings', movement: 'hinge' },
  'hamstrings': { primary: 'Hamstrings', secondary: 'Glutes', movement: 'hinge' },
  'adductors': { primary: 'Adductors', secondary: 'Quads', movement: 'isolation' },
  'triceps': { primary: 'Triceps', secondary: 'Shoulders', movement: 'push' },
  'cardiovascular system': { primary: 'Full Body', secondary: 'Legs', movement: 'carry' },
  'spine': { primary: 'Lower Back', secondary: 'Core', movement: 'hinge' },
  'upper back': { primary: 'Back', secondary: 'Lats', movement: 'pull' },
  'biceps': { primary: 'Biceps', secondary: 'Forearms', movement: 'pull' },
  'delts': { primary: 'Shoulders', secondary: 'Triceps', movement: 'push' },
  'forearms': { primary: 'Forearms', secondary: 'Biceps', movement: 'isolation' },
  'traps': { primary: 'Traps', secondary: 'Back', movement: 'pull' },
  'serratus anterior': { primary: 'Abs', secondary: 'Chest', movement: 'isolation' },
  'abductors': { primary: 'Abductors', secondary: 'Glutes', movement: 'isolation' },
  'levator scapulae': { primary: 'Neck', secondary: 'Traps', movement: 'isolation' },
};

const EQUIPMENT_MAP = {
  'body weight': 'Bodyweight',
  'bodyweight': 'Bodyweight',
  'dumbbell': 'Dumbbell',
  'barbell': 'Barbell',
  'cable': 'Cable',
  'leverage machine': 'Machine',
  'machine': 'Machine',
  'smith machine': 'Machine',
  'assisted': 'Machine',
  'band': 'Resistance Band',
  'resistance band': 'Resistance Band',
  'kettlebell': 'Kettlebell',
  'medicine ball': 'Medicine Ball',
  'stability ball': 'Stability Ball',
  'bosu ball': 'Stability Ball',
  'rope': 'Rope',
  'battle rope': 'Rope',
  'roller': 'Foam Roller',
  'wheel roller': 'Ab Wheel',
  'suspension': 'Suspension',
  'trap bar': 'Barbell',
  'olympic barbell': 'Barbell',
  'ez barbell': 'Barbell',
  'sled apparatus': 'Sled',
  'weighted': 'Bodyweight',
  'skierg machine': 'Cardio Machine',
  'stationary bike': 'Cardio Machine',
  'elliptical machine': 'Cardio Machine',
  'stepmill machine': 'Cardio Machine',
  'upper body ergometer': 'Cardio Machine',
};

function titleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => {
      if (!word) return '';
      if (word.includes('/')) {
        return word.split('/').map(w => capitalize(w)).join('/');
      }
      if (word.includes('-')) {
        return word.split('-').map(w => capitalize(w)).join('-');
      }
      return capitalize(word);
    })
    .join(' ');
}

function detectMovementPattern(name, target, bodyPart) {
  const lower = name.toLowerCase();
  if (lower.includes('squat') || lower.includes('leg press') || lower.includes('lunge') || lower.includes('step-up')) return 'squat';
  if (lower.includes('deadlift') || lower.includes('good morning') || lower.includes('hip thrust') || lower.includes('glute bridge') || lower.includes('hyperextension') || lower.includes('rdl')) return 'hinge';
  if (lower.includes('bench') || lower.includes('push') || lower.includes('press') || lower.includes('dip') || lower.includes('fly') || lower.includes('push-up') || lower.includes('pushup') || lower.includes('extension')) return 'push';
  if (lower.includes('row') || lower.includes('pull') || lower.includes('chin') || lower.includes('curl') || lower.includes('pulldown') || lower.includes('shrug')) return 'pull';
  if (lower.includes('carry') || lower.includes('walk') || lower.includes('march') || lower.includes('run') || lower.includes('jump')) return 'carry';
  if (lower.includes('twist') || lower.includes('chop') || lower.includes('rotation') || lower.includes('oblique')) return 'rotation';

  if (target === 'pectorals' || target === 'delts' || target === 'triceps') return 'push';
  if (target === 'lats' || target === 'upper back' || target === 'traps' || target === 'biceps') return 'pull';
  if (target === 'quads') return 'squat';
  if (target === 'glutes' || target === 'hamstrings' || target === 'spine') return 'hinge';
  return 'isolation';
}

function detectDifficulty(name, equip) {
  const lower = name.toLowerCase();
  if (lower.includes('clean') || lower.includes('snatch') || lower.includes('jerk') || lower.includes('overhead squat') || lower.includes('handstand') || lower.includes('muscle up') || lower.includes('pistol')) {
    return 'advanced';
  }
  if (equip === 'Machine' || equip === 'Bodyweight' || lower.includes('stretch') || lower.includes('basic')) {
    return 'beginner';
  }
  return 'intermediate';
}

const DATASET_PROVENANCE = {
  source: 'exercises-dataset',
  license: 'MIT',
  attribution: 'Exercises Dataset (MIT)',
  commercialUseAllowed: true,
};

const GYM_VISUAL_MEDIA_PROVENANCE = {
  source: 'exercises-dataset',
  license: 'Gym Visual Terms (Unverified)',
  attribution: '© Gym visual — https://gymvisual.com/',
  commercialUseAllowed: false,
  verification: {
    identity: 'verified',
    rights: 'unverified',
    asset: 'verified',
  },
};

const extendedExercises = rawExercises.map(d => {
  const targetInfo = TARGET_TO_MUSCLE[d.target] || { primary: normalizeMuscleName(d.target || d.muscle_group || 'Full Body'), movement: 'isolation' };
  const primaryMuscles = [targetInfo.primary];
  const secondaryMuscles = [];
  if (targetInfo.secondary && !primaryMuscles.includes(targetInfo.secondary)) {
    secondaryMuscles.push(targetInfo.secondary);
  }
  if (Array.isArray(d.secondary_muscles)) {
    for (const sm of d.secondary_muscles) {
      const normMuscle = normalizeMuscleName(sm);
      if (normMuscle && !primaryMuscles.includes(normMuscle) && !secondaryMuscles.includes(normMuscle)) {
        secondaryMuscles.push(normMuscle);
      }
    }
  }

  const mappedEquip = EQUIPMENT_MAP[d.equipment?.toLowerCase()] || capitalize(d.equipment || 'Bodyweight');
  const equipment = [mappedEquip];
  const movementPattern = detectMovementPattern(d.name, d.target, d.body_part);
  const difficulty = detectDifficulty(d.name, mappedEquip);
  const cleanName = titleCase(d.name);
  const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + d.id;

  const instructions = d.instruction_steps?.en || (d.instructions?.en ? [d.instructions.en] : []);

  const media = [
    {
      id: `img-${d.id}`,
      type: 'image',
      url: `/${d.image}`,
      isLocal: true,
      provenance: {
        ...GYM_VISUAL_MEDIA_PROVENANCE,
        sourceExerciseId: d.id,
      },
    },
    {
      id: `vid-${d.id}`,
      type: 'gif',
      url: `/${d.gif_url}`,
      isLocal: true,
      provenance: {
        ...GYM_VISUAL_MEDIA_PROVENANCE,
        sourceExerciseId: d.id,
      },
    },
  ];

  return {
    id: d.id,
    name: cleanName,
    slug,
    aliases: [d.name.toLowerCase()],
    description: instructions[0] || `${cleanName} targeting ${primaryMuscles.join(', ')}.`,
    primaryMuscles,
    secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
    equipment,
    movementPattern,
    difficulty,
    goals: ['hypertrophy', 'strength', 'general_fitness'],
    instructions: instructions.length > 0 ? instructions : undefined,
    provenance: DATASET_PROVENANCE,
    media,
    thumbnailUrl: `/${d.image}`,
    mediaUrl: `/${d.gif_url}`,
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRestSeconds: 60,
    isActive: true,
    source: 'catalog',
  };
});

const outputPath = path.resolve('lib/data/dataset-exercises.json');
fs.writeFileSync(outputPath, JSON.stringify(extendedExercises));
console.log(`Successfully wrote ${extendedExercises.length} extended exercises to ${outputPath}`);
