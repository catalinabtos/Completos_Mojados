// Contenido del juego: departamentos, problemas, edificios, cartas de decisión y fichas ciudadanas.
// Los datos legales de las fichas son de leyes chilenas vigentes; se redactan sin cifras dudosas.

export type DeptId = 'obras' | 'aseo' | 'luz' | 'salud' | 'social';

export interface Dept {
  id: DeptId;
  name: string;
  short: string;
  color: string;
  startCrews: number;
}

export const DEPTS: Dept[] = [
  { id: 'obras', name: 'Obras', short: 'Obras', color: '#e8892f', startCrews: 2 },
  { id: 'aseo', name: 'Aseo y Ornato', short: 'Aseo', color: '#5aa557', startCrews: 2 },
  { id: 'luz', name: 'Alumbrado', short: 'Luz', color: '#f2c84b', startCrews: 1 },
  { id: 'salud', name: 'Salud', short: 'Salud', color: '#e65a5a', startCrews: 1 },
  { id: 'social', name: 'Desarrollo Social', short: 'Social', color: '#c86ab4', startCrews: 1 }
];

export const deptById = (id: DeptId) => DEPTS.find((d) => d.id === id)!;

export const MAX_CREWS = 4;
export const HIRE_COST = 20;
export const SALARY = 3;
export const UPGRADE_COST = [30, 45];
export const MAX_UPGRADE = 2;

export type KindId = 'bache' | 'agua' | 'basura' | 'pasto' | 'fuego' | 'luz' | 'salud' | 'vecina' | 'perro';
export type Place = 'road' | 'house' | 'green';

export interface Kind {
  id: KindId;
  dept: DeptId;
  label: string;
  place: Place;
  /** Segundos que la cuadrilla tarda en resolverlo. */
  fix: number;
  /** Segundos antes de que se vuelva reclamo. */
  ttl: number;
  /** Peso en aprobación (lo grave pesa más). */
  weight: number;
  /** Probabilidad relativa por mes del año (0 = enero). */
  season: number[];
}

const flat = (v: number) => Array(12).fill(v) as number[];

export const KINDS: Kind[] = [
  { id: 'bache', dept: 'obras', label: 'Bache', place: 'road', fix: 3, ttl: 26, weight: 1,
    season: [1, 1, 1, 1, 1.2, 1.5, 1.6, 1.5, 1.2, 1, 1, 1] },
  { id: 'agua', dept: 'obras', label: 'Calle inundada', place: 'road', fix: 3.5, ttl: 22, weight: 1.3,
    season: [0, 0, 0, 0.2, 0.8, 1.8, 2, 1.6, 0.5, 0.1, 0, 0] },
  { id: 'basura', dept: 'aseo', label: 'Basura acumulada', place: 'road', fix: 2.5, ttl: 24, weight: 1,
    season: [1.3, 1.4, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1.4] },
  { id: 'pasto', dept: 'aseo', label: 'Plaza descuidada', place: 'green', fix: 3, ttl: 32, weight: 0.8,
    season: [1, 1, 1.2, 1.6, 1.6, 0.8, 0.6, 0.8, 1.2, 1.4, 1.2, 1] },
  { id: 'fuego', dept: 'aseo', label: 'Microbasural en llamas', place: 'road', fix: 3, ttl: 15, weight: 1.6,
    season: [1.8, 1.8, 0.8, 0, 0, 0, 0, 0, 0, 0, 0.3, 1.2] },
  { id: 'luz', dept: 'luz', label: 'Luminaria apagada', place: 'road', fix: 2.5, ttl: 28, weight: 1,
    season: [0.8, 0.8, 1, 1.1, 1.3, 1.5, 1.5, 1.3, 1, 1, 0.8, 0.8] },
  { id: 'salud', dept: 'salud', label: 'Vecino sin hora médica', place: 'house', fix: 3.5, ttl: 24, weight: 1.2,
    season: [0.8, 0.8, 1, 1.2, 1.4, 1.7, 1.8, 1.5, 1.1, 1, 0.9, 0.8] },
  { id: 'vecina', dept: 'social', label: 'Adulto mayor necesita apoyo', place: 'house', fix: 3, ttl: 26, weight: 1.1,
    season: flat(1) },
  { id: 'perro', dept: 'social', label: 'Perrito sin hogar', place: 'road', fix: 2.5, ttl: 30, weight: 0.8,
    season: flat(1) }
];

export const kindById = (id: KindId) => KINDS.find((k) => k.id === id)!;

export type BuildingId = 'contenedores' | 'led' | 'cesfam' | 'plaza' | 'sede' | 'colector' | 'adopcion';

export interface Building {
  id: BuildingId;
  name: string;
  desc: string;
  cost: number;
  upkeep: number;
  /** Multiplicador de aparición de problemas en el barrio. */
  reduce: Partial<Record<KindId, number>>;
  /** Aprobación que suma al barrio cada mes. */
  monthly: number;
  participation?: number;
}

export const BUILDINGS: Building[] = [
  { id: 'contenedores', name: 'Punto limpio', desc: 'Contenedores y reciclaje: menos basura y microbasurales.',
    cost: 25, upkeep: 1, reduce: { basura: 0.45, fuego: 0.5 }, monthly: 0.4 },
  { id: 'led', name: 'Luminarias LED', desc: 'Calles iluminadas y seguras: casi no se apagan.',
    cost: 30, upkeep: 0.5, reduce: { luz: 0.35 }, monthly: 0.6 },
  { id: 'colector', name: 'Colector de aguas lluvia', desc: 'Adiós a las calles inundadas en invierno.',
    cost: 50, upkeep: 1, reduce: { agua: 0.25, bache: 0.75 }, monthly: 0.3 },
  { id: 'cesfam', name: 'CESFAM', desc: 'Centro de salud familiar: más horas médicas en el barrio.',
    cost: 70, upkeep: 3, reduce: { salud: 0.4 }, monthly: 1.2 },
  { id: 'plaza', name: 'Plaza con juegos', desc: 'Encanta a los vecinos, pero hay que mantenerla.',
    cost: 35, upkeep: 1, reduce: {}, monthly: 1.6 },
  { id: 'sede', name: 'Sede vecinal', desc: 'La junta de vecinos se organiza y se ayudan entre todos.',
    cost: 30, upkeep: 1, reduce: { vecina: 0.5 }, monthly: 0.6, participation: 0.6 },
  { id: 'adopcion', name: 'Centro de adopción', desc: 'Perritos vacunados, esterilizados y con familia.',
    cost: 35, upkeep: 1.5, reduce: { perro: 0.35 }, monthly: 0.5 }
];

export const buildingById = (id: BuildingId) => BUILDINGS.find((b) => b.id === id)!;

// ── Fichas ciudadanas ─────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  title: string;
  /** Lo que la ciudadanía puede exigir, en una línea. */
  demand: string;
  /** Explicación breve. */
  text: string;
}

export const LESSONS: Lesson[] = [
  { id: 'transparencia', title: 'Derecho a saber',
    demand: 'Que respondan tus solicitudes de información pública a tiempo.',
    text: 'Por la Ley de Transparencia (20.285), cualquier persona puede pedirle información a su municipio sin explicar para qué. Deben responder en 20 días hábiles, prorrogables por 10 más.' },
  { id: 'activa', title: 'Transparencia activa',
    demand: 'Que la web municipal muestre sueldos, contratos y presupuesto.',
    text: 'Los municipios deben publicar en su sitio web, de forma permanente, su personal y remuneraciones, sus contratos, compras y presupuesto. Si no está, puedes reclamar al Consejo para la Transparencia.' },
  { id: 'licitacion', title: 'Licitar es la regla',
    demand: 'Que las compras y obras se liciten en Mercado Público.',
    text: 'Por la Ley de Compras Públicas (19.886), el municipio debe comprar por licitación en mercadopublico.cl, donde todos pueden revisar ofertas y adjudicaciones. El trato directo es una excepción que debe justificarse.' },
  { id: 'lobby', title: 'Agenda a la vista',
    demand: 'Que las reuniones con lobistas se publiquen.',
    text: 'La Ley del Lobby (20.730) obliga a alcaldes y concejales a registrar sus reuniones con quienes buscan influir en sus decisiones. Esos registros son públicos y se revisan en internet.' },
  { id: 'probidad', title: 'Probidad',
    demand: 'Que autoridades declaren patrimonio e intereses y se inhabiliten si hay conflicto.',
    text: 'Alcaldes y concejales deben publicar su declaración de intereses y patrimonio (Ley 20.880). Además, deben abstenerse de decidir en asuntos donde ellos o sus familiares tengan interés.' },
  { id: 'concurso', title: 'Pega por mérito',
    demand: 'Que los cargos municipales se llenen por concurso, no por amistad.',
    text: 'Contratar a parientes o amigos por cercanía va contra el principio de probidad. Los cargos de planta se llenan por concurso público, y los contratos a honorarios también se publican.' },
  { id: 'concejo', title: 'El concejo fiscaliza',
    demand: 'Que el concejo municipal fiscalice y que tú puedas ver sus sesiones.',
    text: 'El concejo municipal aprueba el presupuesto, el PLADECO y fiscaliza al alcalde. Sus sesiones son públicas: puedes asistir y pedir sus actas.' },
  { id: 'cuenta', title: 'Cuenta pública',
    demand: 'Una cuenta pública anual con datos, no solo con videos bonitos.',
    text: 'Por la Ley Orgánica de Municipalidades (18.695), el alcalde debe dar cuenta pública de su gestión cada año, a más tardar en abril: obras, presupuesto, metas y lo que falta.' },
  { id: 'cosoc', title: 'El COSOC',
    demand: 'Que el COSOC funcione y sea escuchado.',
    text: 'El Consejo Comunal de Organizaciones de la Sociedad Civil (Ley 20.500) reúne a juntas de vecinos y organizaciones para opinar sobre el presupuesto, el PLADECO y la cuenta pública.' },
  { id: 'participativo', title: 'Presupuesto participativo',
    demand: 'Que una parte del presupuesto la decidan los vecinos.',
    text: 'Muchos municipios de Chile reservan una parte de su presupuesto para que los vecinos voten qué proyectos hacer en su barrio. Si tu comuna no lo hace, se puede pedir.' },
  { id: 'pladeco', title: 'El PLADECO',
    demand: 'Un plan de desarrollo comunal hecho con los barrios.',
    text: 'El Plan de Desarrollo Comunal guía lo que la comuna quiere ser en los próximos años. Debe hacerse con participación ciudadana y es la vara para medir si la gestión cumple.' },
  { id: 'contraloria', title: 'La Contraloría',
    demand: 'Que se investiguen las irregularidades y se corrijan.',
    text: 'La Contraloría General de la República fiscaliza el uso de los recursos municipales. Cualquier persona puede presentarle una denuncia, incluso de forma reservada.' },
  { id: 'oirs', title: 'Tu reclamo cuenta',
    demand: 'Que cada reclamo quede registrado y tenga respuesta.',
    text: 'Los municipios tienen una oficina de partes y una OIRS para recibir reclamos y sugerencias. Pide siempre tu número de ingreso: así puedes exigir respuesta.' },
  { id: 'mantencion', title: 'Mantener también es gobernar',
    demand: 'Plan de mantención, no solo inauguraciones.',
    text: 'Cortar cintas luce, pero una plaza sin riego o una calle sin reparar se pierden en pocos años. Pregunta cuánto cuesta mantener cada obra antes de aplaudirla.' },
  { id: 'plebiscito', title: 'Plebiscito comunal',
    demand: 'Que los temas grandes de la comuna se puedan votar.',
    text: 'La Ley Orgánica de Municipalidades permite plebiscitos comunales sobre inversiones y planes, y los vecinos pueden pedirlos juntando firmas.' },
  { id: 'prevencion', title: 'Prevenir sale más barato',
    demand: 'Planes de emergencia conocidos por todos los barrios.',
    text: 'El municipio debe tener un plan comunal de emergencia y coordinarse con Bomberos y SENAPRED. Pregunta cuál es el punto de encuentro de tu barrio.' }
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)!;

// ── Cartas de decisión ────────────────────────────────────────────────────────

export type Speaker = 'vecina' | 'concejal' | 'empresario' | 'asesora' | 'periodista' | 'fiscal' | 'bombero' | 'joven' | 'primo';

export interface Effects {
  money?: number;
  /** Aprobación en todos los barrios. */
  approval?: number;
  /** Aprobación solo en el barrio con menos aprobación. */
  worstBarrio?: number;
  transparency?: number;
  participation?: number;
  /** Riesgo de que la Contraloría encuentre algo. */
  risk?: number;
  /** Marca con duración en meses o un valor permanente. */
  flag?: [string, number];
  /** Cuadrilla gratis. */
  crew?: 'obras' | 'aseo' | 'luz' | 'salud' | 'social';
  /** Edificio gratis en el barrio que más lo necesita. */
  freeBuilding?: BuildingId;
}

export interface Option {
  label: string;
  effects: Effects;
  result: string;
  /** Si es la opción que una buena gestión elegiría (para el bot y el final). */
  good: boolean;
}

export interface Card {
  id: string;
  speaker: Speaker;
  who: string;
  title: string;
  text: string;
  lesson: string;
  options: Option[];
  /** Meses del año en que puede salir (0 = enero). Sin esto, cualquiera. */
  months?: number[];
  /** Año mínimo (1 a 4). */
  minYear?: number;
}

export const CARDS: Card[] = [
  { id: 'aniversario', speaker: 'asesora', who: 'Asesora de comunicaciones', months: [0, 1],
    title: 'Aniversario de Talca',
    text: 'Se viene el aniversario de la ciudad, en febrero. ¿Cómo lo celebramos?',
    lesson: 'activa',
    options: [
      { label: 'Show con artista famoso y fuegos artificiales', good: false,
        effects: { money: -45, approval: 5, transparency: -2 },
        result: 'Fue una noche inolvidable... y la cuenta también. Varios vecinos preguntan cuánto costó.' },
      { label: 'Feria de emprendedores y artistas talquinos', good: true,
        effects: { money: -12, approval: 3, participation: 5 },
        result: 'La Alameda se llenó de puestos, música y familias. Los emprendedores vendieron todo.' }
    ] },
  { id: 'licitacion', speaker: 'empresario', who: 'Empresario constructor',
    title: 'Repavimentar la 2 Sur',
    text: '"Alcaldía, yo le hago la pega al tiro, sin tanto papeleo. Firmemos un trato directo y listo."',
    lesson: 'licitacion',
    options: [
      { label: 'Licitación pública en Mercado Público', good: true,
        effects: { money: -18, transparency: 8, flag: ['menosBaches', 6] },
        result: 'Llegaron cinco ofertas. Ganó la más conveniente y la calle quedó impecable.' },
      { label: 'Trato directo: es más rápido', good: false,
        effects: { money: -32, approval: 2, transparency: -10, risk: 2, flag: ['menosBaches', 3] },
        result: 'La calle se hizo rápido, pero a casi el doble del precio de mercado. Hay preguntas.' }
    ] },
  { id: 'lobby', speaker: 'empresario', who: 'Gerente de inmobiliaria',
    title: 'Un cafecito privado',
    text: 'Una inmobiliaria quiere conversar sobre cambiar el plano regulador para construir torres junto al Río Claro.',
    lesson: 'lobby',
    options: [
      { label: 'Reunión registrada por Ley del Lobby', good: true,
        effects: { transparency: 7 },
        result: 'La reunión quedó publicada. Los vecinos del sector pudieron opinar antes de decidir.' },
      { label: 'Café sin registro, entre amigos', good: false,
        effects: { money: 20, transparency: -12, risk: 2 },
        result: 'La inmobiliaria "donó" para la fiesta de fin de año de la muni. Esto huele mal.' }
    ] },
  { id: 'primo', speaker: 'primo', who: 'Tu primo Rodrigo', minYear: 1,
    title: 'Un favor de familia',
    text: '"Primo/a, ¿y si me contratas en la muni? Soy bueno para la pega y no me demoro nada."',
    lesson: 'concurso',
    options: [
      { label: 'Que postule a concurso, como todos', good: true,
        effects: { transparency: 5 },
        result: 'Postuló, quedó segundo y ahora sabe que la próxima puede ganar por mérito.' },
      { label: 'Contratarlo directo: es de confianza', good: false,
        effects: { crew: 'obras', transparency: -12, risk: 2, approval: -1 },
        result: 'Tienes una cuadrilla más de Obras... y una noticia en el diario: "Nepotismo en la muni".' }
    ] },
  { id: 'transparencia', speaker: 'joven', who: 'Estudiante de la UTalca',
    title: 'Solicitud de transparencia',
    text: 'Un estudiante pidió por Ley de Transparencia los contratos de recolección de basura.',
    lesson: 'transparencia',
    options: [
      { label: 'Entregarlos completos y dentro del plazo', good: true,
        effects: { transparency: 9, participation: 2 },
        result: 'Publicó un análisis en redes. Mucha gente aprendió cómo se gasta en aseo.' },
      { label: 'Darle largas y no responder', good: false,
        effects: { transparency: -12, risk: 1, approval: -2 },
        result: 'Reclamó al Consejo para la Transparencia y la muni tuvo que entregarlos igual, con multa.' }
    ] },
  { id: 'participativo', speaker: 'vecina', who: 'Presidenta de junta de vecinos',
    title: 'Que decidan los vecinos',
    text: 'Las juntas de vecinos piden decidir en qué se gasta una parte del presupuesto municipal.',
    lesson: 'participativo',
    options: [
      { label: 'Presupuesto participativo: que voten', good: true,
        effects: { money: -30, participation: 14, approval: 2, freeBuilding: 'plaza' },
        result: 'Votaron miles de vecinos y ganó una plaza nueva en el barrio que más la necesitaba.' },
      { label: 'Lo decidimos nosotros: somos los técnicos', good: false,
        effects: { participation: -8, approval: -2 },
        result: 'Los vecinos sienten que la muni no los escucha.' }
    ] },
  { id: 'cosoc', speaker: 'vecina', who: 'Consejera del COSOC',
    title: 'Sesión del COSOC',
    text: 'El Consejo de la Sociedad Civil quiere reunirse para opinar del presupuesto del próximo año.',
    lesson: 'cosoc',
    options: [
      { label: 'Reunirse y escuchar sus propuestas', good: true,
        effects: { participation: 10, approval: 1 },
        result: 'Propusieron reforzar el aseo en ferias libres. ¡Buena idea!' },
      { label: 'Suspender: no hay tiempo', good: false,
        effects: { participation: -10 },
        result: 'Las organizaciones se sienten ninguneadas.' }
    ] },
  { id: 'concejo', speaker: 'concejal', who: 'Concejala',
    title: 'El concejo pregunta',
    text: '"Queremos revisar en detalle los gastos en publicidad de este año."',
    lesson: 'concejo',
    options: [
      { label: 'Entregar toda la información', good: true,
        effects: { transparency: 8 },
        result: 'La revisión mostró algunos gastos de más. Se corrigieron y se ahorró para el próximo año.' },
      { label: 'Decir que es información reservada', good: false,
        effects: { transparency: -10, approval: -2, risk: 1 },
        result: 'Los gastos municipales son públicos. El concejo lo llevó a la Contraloría.' }
    ] },
  { id: 'pladeco', speaker: 'asesora', who: 'Secretaría de Planificación',
    title: 'Actualizar el PLADECO',
    text: 'Hay que actualizar el Plan de Desarrollo Comunal para los próximos años.',
    lesson: 'pladeco',
    options: [
      { label: 'Talleres en todos los barrios', good: true,
        effects: { money: -15, participation: 12, approval: 1 },
        result: 'Salieron prioridades claras: veredas, áreas verdes y salud. ¡Ahora hay hoja de ruta!' },
      { label: 'Copiar el de otra comuna', good: false,
        effects: { money: -2, participation: -6, transparency: -4 },
        result: 'Un concejal notó que el plan habla de "la costa de la comuna". Talca no tiene costa.' }
    ] },
  { id: 'patrimonio', speaker: 'asesora', who: 'Asesora jurídica',
    title: 'Declaración de patrimonio',
    text: 'Toca actualizar tu declaración de intereses y patrimonio.',
    lesson: 'probidad',
    options: [
      { label: 'Publicarla completa', good: true,
        effects: { transparency: 6 },
        result: 'Todo en orden y a la vista. Así da gusto.' },
      { label: 'Omitir el terreno en Constitución', good: false,
        effects: { transparency: -10, risk: 2 },
        result: 'Un periodista encontró el terreno en el Conservador de Bienes Raíces.' }
    ] },
  { id: 'mantencion', speaker: 'concejal', who: 'Concejal', minYear: 2,
    title: '¿Cortar cintas o mantener?',
    text: 'Podemos inaugurar una rueda de la fortuna gigante en la costanera... o hacer un plan de mantención de veredas y plazas.',
    lesson: 'mantencion',
    options: [
      { label: 'Rueda gigante, con prensa y cinta', good: false,
        effects: { money: -55, approval: 6, flag: ['ruedaMantencion', 99] },
        result: '¡Qué foto! Pero ahora cuesta mantenerla todos los meses.' },
      { label: 'Plan de mantención de barrios', good: true,
        effects: { money: -25, flag: ['mantencion', 99] },
        result: 'Menos baches y plazas más cuidadas por el resto del período.' }
    ] },
  { id: 'oirs', speaker: 'vecina', who: 'Funcionaria de la OIRS',
    title: 'Reclamos acumulados',
    text: 'Se acumulan cientos de reclamos sin responder en la Oficina de Informaciones, Reclamos y Sugerencias.',
    lesson: 'oirs',
    options: [
      { label: 'Responder todos y publicar estadísticas', good: true,
        effects: { money: -6, transparency: 5, approval: 3 },
        result: 'Ahora cada vecino recibe su número de reclamo y una respuesta.' },
      { label: 'Archivarlos, total nadie los lee', good: false,
        effects: { approval: -5, transparency: -5 },
        result: 'Los vecinos reclaman... por no responder los reclamos.' }
    ] },
  { id: 'fondas', speaker: 'asesora', who: 'Jefa de Aseo', months: [8],
    title: 'Fiestas Patrias',
    text: '¡Se vienen las fondas! Con la fiesta, la basura se multiplica.',
    lesson: 'prevencion',
    options: [
      { label: 'Reforzar el aseo con turnos extra', good: true,
        effects: { money: -12, flag: ['fondasOk', 1] },
        result: 'Los turnos extra mantuvieron la ciudad limpia. ¡Viva Chile!' },
      { label: 'Que cada uno se haga cargo', good: false,
        effects: { flag: ['fondasMal', 1] },
        result: 'Las calles amanecieron llenas de vasos y servilletas...' }
    ] },
  { id: 'incendio', speaker: 'bombero', who: 'Comandante de Bomberos', months: [0, 1, 11],
    title: 'Ola de calor',
    text: 'Se viene una ola de calor y hay riesgo de incendios en microbasurales y pastizales.',
    lesson: 'prevencion',
    options: [
      { label: 'Plan de prevención con los barrios', good: true,
        effects: { money: -12, participation: 4, flag: ['prevencion', 3] },
        result: 'Limpiaron pastizales y los vecinos saben qué hacer. ¡Bien!' },
      { label: 'Esperar que no pase nada', good: false,
        effects: { flag: ['calor', 2] },
        result: 'Ojalá tengas suerte...' }
    ] },
  { id: 'plebiscito', speaker: 'joven', who: 'Vocera de vecinos', minYear: 2,
    title: 'Firmas por el Río Claro',
    text: 'Vecinos juntaron firmas para votar en plebiscito si la ribera del Río Claro se transforma en parque.',
    lesson: 'plebiscito',
    options: [
      { label: 'Apoyar el plebiscito comunal', good: true,
        effects: { money: -10, participation: 12, approval: 2 },
        result: 'Ganó el parque. La ciudad se apropió de su río.' },
      { label: 'Ignorar las firmas', good: false,
        effects: { participation: -10, approval: -3 },
        result: 'Las firmas siguen ahí. La molestia, también.' }
    ] },
  { id: 'prensa', speaker: 'periodista', who: 'Periodista de radio local',
    title: 'Una pregunta incómoda',
    text: '"¿Por qué la obra del CESFAM lleva meses de atraso?"',
    lesson: 'activa',
    options: [
      { label: 'Explicar con datos, plazos y responsables', good: true,
        effects: { transparency: 5, approval: 1 },
        result: 'La gente valoró la honestidad. Ahora hay un plazo público que cumplir.' },
      { label: 'No contestar y culpar al gobierno anterior', good: false,
        effects: { transparency: -5, approval: -2 },
        result: 'La entrevista se volvió viral, pero no por buenas razones.' }
    ] }
];

/** Carta que aparece si el riesgo acumulado se descubre. */
export const CONTRALORIA: Card = {
  id: 'contraloria', speaker: 'fiscal', who: 'Contraloría Regional del Maule',
  title: 'Llegó la Contraloría',
  text: 'Una auditoría encontró irregularidades en contratos y gastos de la municipalidad.',
  lesson: 'contraloria',
  options: [
    { label: 'Colaborar, corregir y sumariar', good: true,
      effects: { money: -20, transparency: 6, approval: -3 },
      result: 'Dolió, pero se corrigió. La confianza se empieza a recuperar.' },
    { label: 'Acusar persecución política', good: false,
      effects: { approval: -7, transparency: -10 },
      result: 'Nadie te cree. El informe es público y todos lo leyeron.' }
  ]
};

/** Opciones de la cuenta pública de fin de año. */
export const CUENTA_OPTIONS: Option[] = [
  { label: 'Cuenta con datos: logros, gastos y lo que falta', good: true,
    effects: { transparency: 8, participation: 3, approval: 1 },
    result: 'Los vecinos saben en qué se usó cada peso.' },
  { label: 'Video épico con drone y música', good: false,
    effects: { money: -10, approval: 3, transparency: -6 },
    result: 'Muy lindo el video... pero, ¿y las cifras?' }
];
