// Plan de estudio estructurado desde cero hasta nivel intermedio.
// Cada lección incluye teoría concisa, videos de YouTube verificados en español,
// acordes asociados, preguntas de autoevaluación y objetivos de práctica.

export const LEVELS = [
  {
    id: 'nivel-0',
    number: 0,
    title: 'Primeros pasos: conociendo tu guitarra',
    subtitle: 'Postura, afinación, anatomía y cómo emitir tu primera nota limpia.',
    description: 'Todo lo que necesitas saber antes de tocar tu primer acorde: cómo sostener la guitarra sin lastimarte, afinar las 6 cuerdas y leer diagramas.',
    color: 'accent',
    lessons: [
      {
        id: 'partes-y-postura',
        title: 'Partes de la guitarra y postura correcta',
        level: 0,
        duration: '10 min',
        summary: 'Aprende a sentarte, colocar la guitarra y la postura de la mano izquierda (pulgar detrás del mástil).',
        youtube: [
          { id: 'kShyDBXyFbk', title: 'Curso de guitarra: Lección 1 desde cero', author: 'David Calabrés' },
          { id: 'PqN-rlV6Tp4', title: 'La guitarra, posición y ejercicios', author: 'Clasesdeguitarra.com.co' }
        ],
        body: `
### 1. Las partes clave que debes ubicar
* **Pala o clavijero:** Donde se encuentran las 6 clavijas para tensar o aflojar las cuerdas.
* **Cejuela (traste 0):** La pieza blanca por donde pasan las cuerdas antes de llegar al mástil.
* **Mástil y trastes:** Las barritas metálicas son los trastes; los espacios entre ellas son donde colocas los dedos.
* **Cuerpo y boca de resonancia:** Amplifica el sonido en guitarras acústicas o españolas.

### 2. Postura corporal sin tensiones
* Siéntate con la espalda recta pero relajada, cerca del borde de una silla sin apoyabrazos.
* Apoya la curva de la guitarra en tu pierna derecha (postura moderna) o en tu pierna izquierda (postura clásica).
* El mástil debe apuntar ligeramente hacia arriba (unos 20° a 30°), nunca hacia el suelo.

### 3. La regla sagrada de la mano izquierda
* **El pulgar:** Colócalo en el centro de la parte trasera del mástil, como si hicieras pinza suave. ¡Nunca lo escondas ni lo aprietes como si fueras a ahorcar el mástil!
* **Dedos arqueados:** Pisa las cuerdas con la punta (la yema) de los dedos, no con la parte plana.
* **Cerca del traste:** Coloca el dedo justo detrás de la barra metálica del traste, no en el centro ni encima del metal.
        `,
        tips: [
          'Si la cuerda zumba ("trastea"), estás pisando muy lejos del traste de metal o con poca fuerza.',
          'Si la cuerda suena apagada, tu dedo está tocando la cuerda de abajo sin querer. ¡Arquea más los nudillos!'
        ],
        quiz: [
          {
            q: '¿Dónde debe colocarse el pulgar de la mano izquierda al pisar trastes?',
            options: [
              'Detrás del mástil, a la mitad de su grosor, como pinza suave.',
              'Abrazando totalmente el mástil con la palma pegada.',
              'Colgando por debajo del diapasón.',
              'No importa dónde esté el pulgar.'
            ],
            correct: 0,
            explain: 'El pulgar en la parte posterior da espacio para que tus otros 4 dedos se arqueen y no apaguen cuerdas vecinas.'
          },
          {
            q: '¿En qué punto del traste se obtiene el sonido más limpio con menor esfuerzo?',
            options: [
              'Justo detrás de la barra metálica del traste.',
              'Exactamente en la mitad del espacio entre dos trastes.',
              'Encima de la cejuela.',
              'Pisando directo sobre el metal del traste.'
            ],
            correct: 0,
            explain: 'Cerca del traste metálico la cuerda vibra limpia sin necesidad de apretar con demasiada fuerza.'
          }
        ]
      },
      {
        id: 'afinacion',
        title: 'Cómo afinar tu guitarra (Mi-La-Re-Sol-Si-Mi)',
        level: 0,
        duration: '12 min',
        summary: 'Domina los nombres de las 6 cuerdas y cómo usar el afinador integrado de la app o tu móvil.',
        youtube: [
          { id: 'zHwD9fvW-y0', title: 'Cómo afinar la guitarra correctamente', author: 'Alberto Aragón' },
          { id: '12gpKeSUvHk', title: 'Método súper fácil y práctico para afinar', author: 'Tus Clases De Guitarra' }
        ],
        body: `
### La afinación estándar (Standard Tuning)
Las 6 cuerdas de la guitarra se cuentan de la más delgada (1ª) a la más gruesa (6ª):

* **6ª cuerda (la más gruesa, arriba):** **Mi** (E2) — 82.4 Hz
* **5ª cuerda:** **La** (A2) — 110.0 Hz
* **4ª cuerda:** **Re** (D3) — 146.8 Hz
* **3ª cuerda:** **Sol** (G3) — 196.0 Hz
* **2ª cuerda:** **Si** (B3) — 246.9 Hz
* **1ª cuerda (la más delgada, abajo):** **Mi** (E4) — 329.6 Hz

### Regla para mover las clavijas:
* **Si la aguja está a la izquierda (nota baja / bemol):** Debes **apretar** la clavija para tensar la cuerda y subir el tono.
* **Si la aguja está a la derecha (nota alta / sostenido):** Debes **aflojar** la clavija para destensar.
* **Consejo pro:** Siempre afina *subiendo* hacia la nota. Si te pasaste, baja un poco y vuelve a subir tensando.
        `,
        tips: [
          'Usa la herramienta de afinador integrada en la sección "Herramientas" de esta app con tu micrófono.',
          'Nunca fuerces una clavija si se siente excesivamente dura, asegúrate de estar girando la clavija que corresponde a esa cuerda.'
        ],
        quiz: [
          {
            q: '¿Cuál es la nota de la 6ª cuerda (la más gruesa)?',
            options: ['Mi grave (E)', 'La (A)', 'Sol (G)', 'Do (C)'],
            correct: 0,
            explain: 'La 6ª cuerda es Mi grave (E2). La 1ª cuerda también es Mi, pero dos octavas más aguda (E4).'
          }
        ]
      },
      {
        id: 'como-leer-diagramas-y-tabs',
        title: 'Cómo leer diagramas de acordes y tablaturas',
        level: 0,
        duration: '15 min',
        summary: 'Descifra la simbología universal de la guitarra en 5 minutos.',
        youtube: [
          { id: 'ozms4bU2YfQ', title: 'Cómo leer tablaturas (Tabs) fácil - Clase 1', author: 'Guitarraviva' },
          { id: 'W10akTlf4hk', title: 'Cómo leer tablaturas con todas las técnicas', author: 'ChachiGuitar' }
        ],
        body: `
### 1. Diagramas de acordes (Fretboard charts)
Un diagrama de acorde es una foto vertical del mástil:
* Las **6 líneas verticales** representan las cuerdas (la de más a la izquierda es la 6ª cuerda Mi grave; la de la derecha es la 1ª cuerda).
* Las **líneas horizontales** son los trastes. La línea superior gruesa representa la cejuela.
* **Los círculos:** Indican dónde poner los dedos. El número dentro del círculo es el dedo:
  * **1** = Índice
  * **2** = Medio
  * **3** = Anular
  * **4** = Meñique
* **Símbolos arriba:**
  * **O** (círculo): Cuerda al aire (se toca sin pisar ningún traste).
  * **X** (cruz): Cuerda silenciada (no debe sonar en ese acorde).

### 2. Tablatura (TAB)
En una tablatura hay 6 líneas horizontales:
* La línea de **arriba** es la 1ª cuerda (más delgada).
* La línea de **abajo** es la 6ª cuerda (más gruesa).
* Los **números** representan el traste que pisas (0 = cuerda al aire).
* Se lee de izquierda a derecha. Si hay dos o más números apilados verticalmente, se tocan juntos.
        `,
        tips: [
          'Memoriza los números de los dedos: 1=Índice, 2=Medio, 3=Anular, 4=Meñique.',
          'En las tablaturas recuerda la regla invertida: la cuerda de arriba en el papel es la más aguda físicamente.'
        ],
        quiz: [
          {
            q: '¿Qué significa una "X" sobre una cuerda en un diagrama de acordes?',
            options: [
              'Esa cuerda no debe tocarse o debe silenciarse.',
              'Debes tocar esa cuerda con el dedo pulgar.',
              'Debes tocar esa cuerda dos veces seguidas.',
              'Esa cuerda debe afinarse en Re.'
            ],
            correct: 0,
            explain: 'La X indica cuerda muteada o no tocada para evitar notas que choquen armónicamente.'
          }
        ]
      }
    ]
  },
  {
    id: 'nivel-1',
    number: 1,
    title: 'Nivel 1: Tus primeros acordes y rasgueos',
    subtitle: 'Em, E, Am, A, D, Dm y el rasgueo universal 4/4.',
    description: 'Aprende los acordes más sencillos y confortables del mundo de la guitarra, gana fuerza en las yemas y toca tus primeros ritmos con acompañamiento.',
    color: 'primary',
    lessons: [
      {
        id: 'primer-acorde-em',
        title: 'Mi menor (Em) y Mi mayor (E): Los reyes del rock',
        level: 1,
        duration: '15 min',
        chords: ['Em', 'E'],
        summary: 'Coloca tus dos primeros acordes, siente el contraste entre menor (triste) y mayor (alegre).',
        youtube: [
          { id: 'MCzCTj8Sa_0', title: 'Acorde Mi menor para principiantes', author: 'Guitar Minute' },
          { id: 'kShyDBXyFbk', title: 'Aprende tu primera canción fácil desde cero', author: 'David Calabrés' }
        ],
        body: `
### Tu primer acorde: Mi menor (Em)
* **Dedo 2 (Medio):** 5ª cuerda, traste 2.
* **Dedo 3 (Anular):** 4ª cuerda, traste 2.
* Rasguea las **6 cuerdas** de arriba hacia abajo. ¡Todas suenan!
* Este acorde solo necesita dos dedos. Toca cada cuerda una por una para verificar que no haya ruidos ni cuerdas apagadas.

### Ahora transforma a Mi mayor (E)
* Mantén el dedo 2 y 3 exactamente donde están.
* Añade el **Dedo 1 (Índice)** en el **traste 1 de la 3ª cuerda**.
* Escucha cómo la nota Sol sostenida cambia por completo la emoción del acorde: de misterioso a radiante.
        `,
        tips: [
          'Mantén los dedos 2 y 3 pegados entre sí en el traste 2 para que quepan cómodamente.',
          'Pruébalo ahora mismo con la herramienta "Cámara IA" para que detecte tus dedos en pantalla.'
        ],
        quiz: [
          {
            q: '¿Cuántos dedos necesitas para hacer el acorde de Mi menor (Em)?',
            options: ['Solo 2 dedos (medio y anular en el traste 2)', '4 dedos', '1 dedo', '3 dedos'],
            correct: 0,
            explain: 'Con solo el dedo 2 en la 5ª cuerda y dedo 3 en la 4ª cuerda ya tienes el acorde de Mi menor.'
          }
        ]
      },
      {
        id: 'acordes-am-a',
        title: 'La menor (Am) y La mayor (A)',
        level: 1,
        duration: '15 min',
        chords: ['Am', 'A'],
        summary: 'Mueve la forma de Mi una cuerda hacia abajo para descubrir la magia de La menor.',
        youtube: [
          { id: 'udgsLmqsjT0', title: 'Todos los acordes mayores y menores paso a paso', author: 'Guitartutos' },
          { id: 'kdHMt6H4kDc', title: '8 acordes básicos en 10 minutos', author: 'Tus Clases De Guitarra' }
        ],
        body: `
### La menor (Am)
Si ya sabes hacer **Mi mayor (E)**, ¡felicidades! Para hacer **La menor**:
* Mueve la forma entera de Mi mayor **exactamente una cuerda hacia abajo**:
  * Dedo 1: 2ª cuerda, traste 1
  * Dedo 2: 4ª cuerda, traste 2
  * Dedo 3: 3ª cuerda, traste 2
* **Atención:** En La menor se rasguea desde la **5ª cuerda** hacia abajo (la 6ª cuerda no se toca).

### La mayor (A)
* Tres dedos en fila india dentro del mismo **traste 2**:
  * Dedo 1 en la 4ª cuerda, Dedo 2 en la 3ª cuerda, Dedo 3 en la 2ª cuerda.
* Requiere arquear bien los dedos para que la 1ª cuerda al aire suene cristalina.
        `,
        tips: [
          'La alternancia Mi menor (Em) ↔ La menor (Am) es la base de miles de canciones folclóricas y de rock.',
          'El pulgar de la mano derecha o izquierda puede rozar levemente la 6ª cuerda para mutearla en La menor.'
        ],
        quiz: [
          {
            q: 'Al tocar La menor (Am), ¿desde qué cuerda se debe rasguear?',
            options: ['Desde la 5ª cuerda hacia abajo', 'Desde la 6ª cuerda', 'Solo la 1ª y 2ª cuerda', 'Desde la 3ª cuerda'],
            correct: 0,
            explain: 'La 5ª cuerda al aire es la nota La (la fundamental del acorde).'
          }
        ]
      },
      {
        id: 'acordes-d-dm',
        title: 'Re mayor (D) y Re menor (Dm): La forma triangular',
        level: 1,
        duration: '15 min',
        chords: ['D', 'Dm'],
        summary: 'Los acordes más agudos y brillantes de los primeros trastes.',
        youtube: [
          { id: 'kdHMt6H4kDc', title: 'Como tocar acordes básicos fácil', author: 'Tus Clases De Guitarra' }
        ],
        body: `
### Re mayor (D)
Forma un triángulo en los primeros trastes:
* Dedo 1: 3ª cuerda, traste 2.
* Dedo 2: 1ª cuerda, traste 2.
* Dedo 3: 2ª cuerda, traste 3.
* Se rasguea únicamente desde la **4ª cuerda (Re)** hacia abajo. Las cuerdas 6 y 5 no deben sonar.

### Re menor (Dm)
* Dedo 1: 1ª cuerda, traste 1.
* Dedo 2: 3ª cuerda, traste 2.
* Dedo 3: 2ª cuerda, traste 3.
        `,
        tips: [
          'Para que no suene la 6ª y 5ª cuerda, usa el pulgar asomando por arriba del mástil tocando apenas la 6ª cuerda.',
          'Al pasar de Re a Re menor, el dedo 3 permanece en el traste 3 de la 2ª cuerda (dedo ancla).'
        ],
        quiz: [
          {
            q: '¿Qué cuerda al aire sirve como nota bajo para el acorde de Re mayor (D)?',
            options: ['La 4ª cuerda (Re)', 'La 6ª cuerda (Mi)', 'La 1ª cuerda', 'La 2ª cuerda'],
            correct: 0,
            explain: 'La 4ª cuerda es Re al aire, perfecta como fundamental de Re mayor.'
          }
        ]
      },
      {
        id: 'primer-rasgueo-ritmo',
        title: 'El primer rasgueo y ritmo 4/4 universal',
        level: 1,
        duration: '18 min',
        summary: 'Mueve la muñeca con soltura: negras, corcheas y el patrón ↓ ↓↑ ↑↓↑.',
        youtube: [
          { id: 'Z7ovFSSi6d0', title: 'Todos los rasgueos explicados', author: 'Clases Guitarra Online' },
          { id: 'l3YyTCqwIn0', title: 'Aprende los rasgueos más fáciles de guitarra', author: 'Luis Alonzo' },
          { id: 'Zoq1mJydw0M', title: 'Ritmos en guitarra: 7 patrones paso a paso', author: 'Clasesdeguitarra.com.co' }
        ],
        body: `
### 1. El movimiento nace de la muñeca, no del codo
Imagina que te sacudes unas gotas de agua de la mano. La muñeca debe estar completamente relajada y flexible. Si mueves el codo rígido, sonarás robótico y te cansarás rápido.

### 2. Patrón 1: Solo hacia abajo (4 negras)
Cuenta en voz alta: **1, 2, 3, 4**. En cada número das un golpe hacia abajo sobre el acorde de Mi menor.
\`\`\`
1   2   3   4
↓   ↓   ↓   ↓
\`\`\`

### 3. Patrón 2: El rasgueo pop universal (Island Strum / Folk)
El ritmo más famoso del mundo:
\`\`\`
1   &   2   &   3   &   4   &
↓       ↓   ↑       ↑   ↓   ↑
(Abajo - Abajo-Arriba - Arriba-Abajo-Arriba)
\`\`\`
* El truco de oro: tu mano derecha **NUNCA DEJA DE MOVERSE** arriba y abajo como un péndulo continuo. Simplemente en el tiempo 1& no tocas las cuerdas al subir, y en el tiempo 3 no las tocas al bajar.
        `,
        tips: [
          'Usa el metrónomo en 60 BPM para interiorizar el pulso.',
          'Prueba la herramienta de "Visualizador de Rasgueo" interactiva dentro de las canciones.'
        ],
        quiz: [
          {
            q: 'En el rasgueo rítmico, ¿de dónde debe provenir principalmente el movimiento?',
            options: [
              'De la muñeca flexible y relajada.',
              'Del hombro con fuerza.',
              'Del codo completamente rígido.',
              'De los dedos individuales apretando.'
            ],
            correct: 0,
            explain: 'La muñeca flexible permite un sonido parejo, dinámico y evita lesiones como la tendinitis.'
          }
        ]
      }
    ]
  },
  {
    id: 'nivel-2',
    number: 2,
    title: 'Nivel 2: Los 4 acordes mágicos y canciones reales',
    subtitle: 'Do mayor (C), Sol mayor (G) y la fórmula del pop.',
    description: 'Abre la puerta al 80% de las canciones populares aprendiendo Do mayor y Sol mayor, combinándolos con Mi menor y Re.',
    color: 'warning',
    lessons: [
      {
        id: 'acorde-do-mayor',
        title: 'Do mayor (C): El acorde en escalera',
        level: 2,
        duration: '15 min',
        chords: ['C', 'Cmaj7'],
        summary: 'Coloca la famosa escalera 3-2-1 y aprende a no mutear la 3ª cuerda al aire.',
        youtube: [
          { id: 'kdHMt6H4kDc', title: 'Aprende 8 acordes básicos', author: 'Tus Clases De Guitarra' },
          { id: '_SpRjyLo3Q0', title: '4 acordes fáciles para tocar miles de canciones', author: 'Karma Guitar' }
        ],
        body: `
### La postura de Do mayor (C)
* **Dedo 3 (Anular):** 5ª cuerda, traste 3.
* **Dedo 2 (Medio):** 4ª cuerda, traste 2.
* **Dedo 1 (Índice):** 2ª cuerda, traste 1.
* Cuerdas 3 y 1 suenan **al aire**.
* Se rasguea desde la **5ª cuerda**.

### El problema número 1 de Do mayor:
Muchos principiantes apagan la 3ª cuerda al aire porque el dedo 2 se acuesta sobre ella. La solución es arquear la muñeca ligeramente hacia adelante y pisar exactamente con la cúspide de la yema.
        `,
        tips: [
          'Si te cuesta, empieza con Do séptima mayor (Cmaj7): levantas el índice y solo usas dos dedos.',
          'El paso de La menor (Am) a Do mayor (C) es facilísimo: solo tienes que mover el dedo 3 de la 3ª cuerda a la 5ª.'
        ],
        quiz: [
          {
            q: '¿Qué dedo permanece en el mismo sitio al cambiar de La menor (Am) a Do mayor (C)?',
            options: [
              'Tanto el dedo 1 como el dedo 2 son dedos ancla y no se mueven.',
              'Todos los dedos deben levantarse al aire.',
              'Solo el dedo meñique.',
              'El dedo 3.'
            ],
            correct: 0,
            explain: 'Dedo 1 (traste 1 cuerda 2) y dedo 2 (traste 2 cuerda 4) se quedan quietos; solo mueves el dedo 3.'
          }
        ]
      },
      {
        id: 'acorde-sol-mayor',
        title: 'Sol mayor (G): El acorde más grande',
        level: 2,
        duration: '15 min',
        chords: ['G'],
        summary: 'Domina las 6 cuerdas y la variante moderna de 4 dedos usada en Wonderwall y pop acústico.',
        youtube: [
          { id: '_SpRjyLo3Q0', title: 'Sol mayor y los 4 acordes', author: 'Karma Guitar' },
          { id: 'IuGwwrFRL2Y', title: '5 canciones con 4 acordes fáciles', author: 'Tus Clases De Guitarra' }
        ],
        body: `
### Forma tradicional de Sol mayor:
* **Dedo 2 (Medio):** 6ª cuerda, traste 3.
* **Dedo 1 (Índice):** 5ª cuerda, traste 2.
* **Dedo 3 (Anular):** 1ª cuerda, traste 3.
* Suenan todas las 6 cuerdas.

### La variante "Pop / Rock" (Sol con 4 dedos):
* Dedo 2 en 6ª cuerda (traste 3).
* Dedo 1 en 5ª cuerda (traste 2).
* Dedo 3 en 2ª cuerda (traste 3).
* Dedo 4 en 1ª cuerda (traste 3).
* ¡Esta variante suena más llena y hace que cambiar a Do add9 o Re sea instantáneo!
        `,
        tips: [
          'Prueba la transición Sol → Do despacio, manteniendo el dedo 3 como guía visual.',
          'Usa el ejercicio del "Minuto de cambio" en la sección Herramientas para ganar velocidad.'
        ],
        quiz: [
          {
            q: '¿Cuántas cuerdas suenan al rasguear el acorde de Sol mayor?',
            options: ['Las 6 cuerdas', 'Solo 4 cuerdas', '3 cuerdas', '5 cuerdas'],
            correct: 0,
            explain: 'Sol mayor utiliza las 6 cuerdas completas de la guitarra.'
          }
        ]
      },
      {
        id: 'la-formula-4-acordes',
        title: 'La progresión I - V - vi - IV (El secreto del 90% del pop)',
        level: 2,
        duration: '20 min',
        chords: ['G', 'D', 'Em', 'C'],
        summary: 'Aprende cómo con G - D - Em - C puedes tocar cientos de canciones famosas.',
        youtube: [
          { id: 'ZoRlF1sZhHE', title: '33 canciones fáciles con solo 4 acordes', author: 'Karma Guitar' },
          { id: '_xPp1rpqOCA', title: '15 canciones con 4 acordes fáciles', author: 'ChachiGuitar' },
          { id: 'HmizMQrrGJQ', title: '4 acordes fáciles para miles de canciones', author: 'Lauren Bateman' }
        ],
        body: `
### El círculo de oro: Sol (G) → Re (D) → Mi menor (Em) → Do (C)
Esta secuencia de 4 acordes está detrás de canciones como:
* *Stand By Me*
* *Let It Be* / *Don't Stop Believin'*
* *With or Without You* (U2)
* *Someone Like You* (Adele)
* *Despacito* (versión acústica en tonalidad adaptada)

### Cómo practicar los cambios sin detener el ritmo:
1. **Regla de oro:** No pares la mano derecha aunque la mano izquierda aún no haya llegado.
2. Si cometes un error en un dedo, sigue rasgueando al tempo. Tu cerebro aprenderá a acelerar la mano izquierda para alcanzar el compás.
3. Practica en bucle de 4 compases (un compás por acorde).
        `,
        tips: [
          'Ve directo a la sección "Canciones" y prueba tocar "Stand By Me" o "Zombie" con el reproductor sincronizado.'
        ],
        quiz: [
          {
            q: '¿Cuál es la progresión de 4 acordes más común en el pop moderno en tonalidad de Sol?',
            options: ['G - D - Em - C', 'F - Bm - C# - D#', 'E - F - G - A', 'Am - Dm - Em - Fm'],
            correct: 0,
            explain: 'Sol (I) - Re (V) - Mi menor (vi) - Do (IV) es la progresión armónica reina.'
          }
        ]
      }
    ]
  },
  {
    id: 'nivel-3',
    number: 3,
    title: 'Nivel 3: Arpegios, fingerpicking y séptimas',
    subtitle: 'Toca sin púa, añade color bluesero y gana independencia en la mano derecha.',
    description: 'Deja de solo rasguear y aprende a puntear notas individuales, tocar arpegios con el pulgar y tres dedos, y dominar acordes de séptima dominante.',
    color: 'violet',
    lessons: [
      {
        id: 'tecnica-arpegios',
        title: 'Arpegios y técnica Fingerstyle (P-I-M-A)',
        level: 3,
        duration: '20 min',
        summary: 'Asigna cada dedo de tu mano derecha a una cuerda y crea texturas hermosas.',
        youtube: [
          { id: '333_udqdwD0', title: 'Fingerstyle para principiantes', author: 'Karma Guitar' },
          { id: 'PJrOzrkV1AI', title: 'Cómo tocar arpegios en guitarra: 5 ejercicios', author: 'Guzmán Lazo' },
          { id: 'ZG3WA6a0U1w', title: '8 arpegios fáciles para guitarra', author: 'Guitarra Sin Límites' }
        ],
        body: `
### 1. La fórmula P-I-M-A de la mano derecha
* **P (Pulgar):** Se encarga de las cuerdas bajas (6ª, 5ª o 4ª según la nota fundamental del acorde).
* **I (Índice):** Siempre se encarga de la **3ª cuerda**.
* **M (Medio):** Siempre se encarga de la **2ª cuerda**.
* **A (Anular):** Siempre se encarga de la **1ª cuerda**.

### 2. Patrón de arpegio universal:
Coloca el acorde de **Mi menor (Em)** y pulsa en este orden:
\`\`\`
1. Pulgar en la 6ª cuerda (Bajo)
2. Índice en la 3ª cuerda
3. Medio en la 2ª cuerda
4. Anular en la 1ª cuerda
5. Medio en la 2ª cuerda
6. Índice en la 3ª cuerda
\`\`\`
¡Escuchas ese sonido fluido y clásico? Eso es un arpegio de 6/8.
        `,
        tips: [
          'Mantén la muñeca derecha ligeramente curvada hacia afuera para que los dedos ataquen las cuerdas en ángulo de 45° a 60°.',
          'Practica sin mirar la mano derecha; deja que tus dedos "recuerden" dónde está cada cuerda.'
        ],
        quiz: [
          {
            q: 'En la nomenclatura clásica de la mano derecha (P-I-M-A), ¿qué dedo toca la 3ª cuerda?',
            options: ['El dedo Índice (I)', 'El pulgar (P)', 'El meñique', 'El anular (A)'],
            correct: 0,
            explain: 'El índice se ocupa de la 3ª cuerda, el medio de la 2ª y el anular de la 1ª.'
          }
        ]
      },
      {
        id: 'acordes-septima-blues',
        title: 'Acordes de séptima (E7, A7, D7, G7, B7) y el sonido Blues',
        level: 3,
        duration: '18 min',
        chords: ['E7', 'A7', 'D7', 'G7', 'B7'],
        summary: 'Aprende a añadir tensión armónica que pide resolución.',
        youtube: [
          { id: 'udgsLmqsjT0', title: 'Acordes mayores, menores y séptimas', author: 'Guitartutos' }
        ],
        body: `
### ¿Qué es un acorde de séptima dominante?
Es un acorde mayor al que se le añade una 7ª menor. Esta nota extra crea un intervalo de tritono que genera tensión y movimiento en la música.

* **Mi séptima (E7):** Mi mayor quitando el anular (dedo 3). ¡Solo usas 2 dedos!
* **La séptima (A7):** La mayor quitando el dedo medio de la 3ª cuerda.
* **Re séptima (D7):** Un triángulo invertido con respecto a Re mayor.
* **Si séptima (B7):** Requiere 4 dedos, esencial para blues en Mi y progresiones flamencas o acústicas.
        `,
        tips: [
          'Prueba la progresión clásica de blues de 12 compases: E7 → A7 → B7.'
        ],
        quiz: [
          {
            q: '¿Cómo se forma el acorde de Mi séptima (E7) a partir de Mi mayor (E)?',
            options: [
              'Simplemente quitando el dedo anular de la 4ª cuerda.',
              'Moviendo todos los dedos un traste adelante.',
              'Poniendo una cejilla completa.',
              'Añadiendo el dedo meñique en el traste 5.'
            ],
            correct: 0,
            explain: 'Quitar el anular deja la 4ª cuerda al aire (nota Re), que es la 7ª menor de Mi.'
          }
        ]
      }
    ]
  },
  {
    id: 'nivel-4',
    number: 4,
    title: 'Nivel 4: La cejilla, power chords y pentatónica',
    subtitle: 'Vence el acorde de Fa (F), domina el rock y empieza a improvisar tus primeros solos.',
    description: 'El salto de principiante a guitarrista completo: desbloquea todo el diapasón con cejillas móviles, acordes de quinta y la escala pentatónica de La menor.',
    color: 'success',
    lessons: [
      {
        id: 'dominar-cejilla-fa',
        title: 'Cómo dominar la cejilla y el temido Fa mayor (F)',
        level: 4,
        duration: '25 min',
        chords: ['F', 'Bm', 'Fmaj7'],
        summary: 'El secreto biomecánico para que la cejilla no te duela ni te frustre.',
        youtube: [
          { id: 'vD6RqfOA7ts', title: 'Truco para poner la cejilla y que suene bien (Fa fácil)', author: 'Guitarraviva' },
          { id: 'bFUnoP-G8MQ', title: 'Cómo dominar la cejilla en 3 pasos', author: 'ChachiGuitar' },
          { id: 'Ju9dXuUG-8g', title: 'Toca el Fa más fácil para principiantes', author: 'Franky Soto' }
        ],
        body: `
### ¿Por qué cuesta tanto el acorde de Fa?
Porque exige que tu dedo índice presione las 6 cuerdas a la vez (cejilla en traste 1) mientras los otros 3 dedos forman una figura de Mi mayor en los trastes 2 y 3.

### Los 4 secretos de biomecánica para que suene perfecto:
1. **Rola el dedo índice hacia su costado exterior:** La parte lateral del dedo (hacia el pulgar) es más ósea y firme. Si usas la parte plana y blanda de la yema, las cuerdas se hundirán en las ranuras de tus nudillos y se apagarán.
2. **Pégate a la barra del traste:** Coloca el índice a solo 1 o 2 milímetros de la barrita metálica.
3. **Usa el peso del brazo, no la fuerza del pulgar:** No hagas fuerza de pinza como si quisieras romper una nuez con el pulgar. En lugar de eso, jala suavemente con el codo hacia atrás, usando el peso del brazo entero.
4. **El puente de transición (Fa sin cejilla - Fmaj7):** Mientras tus músculos ganan fuerza, puedes tocar Fa séptima mayor (Fmaj7: xx3210) o Fa simplificado de 4 cuerdas (xx3211).
        `,
        tips: [
          'Practica la cejilla primero en el traste 5 o 7 donde las cuerdas son mucho más suaves, luego ve bajando al traste 1.',
          'Usa la "Cámara IA" para comprobar la alineación de tus dedos en el acorde de Fa.'
        ],
        quiz: [
          {
            q: '¿Qué parte del dedo índice debe presionar las cuerdas al hacer cejilla?',
            options: [
              'El borde lateral exterior (más óseo y plano).',
              'La parte blanda de la almohadilla del dedo.',
              'Solo la uña del dedo.',
              'La articulación del nudillo central.'
            ],
            correct: 0,
            explain: 'El costado del dedo es duro y uniforme, garantizando que todas las cuerdas suenen sin huecos.'
          }
        ]
      },
      {
        id: 'power-chords-rock',
        title: 'Power Chords (Acordes de quinta): La puerta al Rock y Metal',
        level: 4,
        duration: '18 min',
        chords: ['E5', 'A5', 'G5', 'C5', 'D5'],
        summary: 'Una sola postura de 2 dedos que puedes mover por todo el mástil.',
        youtube: [
          { id: 'I0ZX8SH8HC0', title: 'Powerchords: Todo lo que necesitas saber', author: 'Juan M. Valero' },
          { id: 'qXaTxb6YLp4', title: 'Tutorial power chords para principiantes', author: '1663 Metal' },
          { id: 'IUO4I6RNPy0', title: 'Cómo tocar acordes de quintas', author: 'Guitarra Sin Límites' }
        ],
        body: `
### La postura universal de quinta:
1. **Dedo 1 (Índice):** En la cuerda grave (6ª o 5ª cuerda), define la nota fundamental.
2. **Dedo 3 (Anular) o Dedo 4 (Meñique):** Dos trastes más adelante, en la siguiente cuerda más aguda.
3. *(Opcional)* Añade la octava con el meñique justo debajo del anular.

### ¡Es una forma móvil!
Si colocas la postura en el traste 3 de la 6ª cuerda, es **Sol 5 (G5)**.
Si la mueves al traste 5, es **La 5 (A5)**.
Si la mueves al traste 7, es **Si 5 (B5)**.
¡Con una sola postura puedes tocar Nirvana, Green Day, AC/DC y Ramones al instante!
        `,
        tips: [
          'Acuérdate de silenciar las cuerdas sobrantes rozándolas ligeramente con la palma o con el dedo índice.',
          'Prueba a tocar "Smells Like Teen Spirit" en la sección Canciones.'
        ],
        quiz: [
          {
            q: '¿Por qué los power chords son tan populares para empezar en el rock?',
            options: [
              'Tienen la misma forma geométrica y se pueden mover a cualquier traste del mástil.',
              'Requieren solfeo avanzado.',
              'Solo se pueden tocar en guitarra acústica.',
              'Utilizan los 5 dedos de la mano.'
            ],
            correct: 0,
            explain: 'Al no tener tercera, no son ni mayores ni menores, y la misma forma sirve para cualquier nota.'
          }
        ]
      },
      {
        id: 'escala-pentatonica-solos',
        title: 'La Escala Pentatónica menor: Tu primer solo de guitarra',
        level: 4,
        duration: '22 min',
        summary: 'El patrón 1 en La menor: las 5 notas mágicas que nunca suenan mal.',
        youtube: [
          { id: 'hulAD7T1RlQ', title: 'Escalas de guitarra: La pentatónica (patrón 1)', author: 'ChachiGuitar' },
          { id: '8_JrQFBL0KM', title: 'Cómo tocar con la escala pentatónica completa', author: 'Aitor Epas Guitar' },
          { id: 'DjCvCf0DLfY', title: 'Cómo tocar todas las escalas pentatónicas', author: 'Guitarraviva' }
        ],
        body: `
### El patrón 1 de la Pentatónica Menor de La (Am) en el traste 5
Coloca tus dedos en este orden (Cuerda 6 a Cuerda 1):

* **6ª cuerda:** Traste 5 (Dedo 1) — Traste 8 (Dedo 4)
* **5ª cuerda:** Traste 5 (Dedo 1) — Traste 7 (Dedo 3)
* **4ª cuerda:** Traste 5 (Dedo 1) — Traste 7 (Dedo 3)
* **3ª cuerda:** Traste 5 (Dedo 1) — Traste 7 (Dedo 3)
* **2ª cuerda:** Traste 5 (Dedo 1) — Traste 8 (Dedo 4)
* **1ª cuerda:** Traste 5 (Dedo 1) — Traste 8 (Dedo 4)

### Cómo empezar a improvisar:
1. Pon una pista de acompañamiento (*backing track*) de rock o blues en La menor en YouTube.
2. Toca cualquiera de estas notas en orden libre.
3. ¡Notarás que NINGUNA nota desafina! Acabas de entrar al mundo de los solos de guitarra.
        `,
        tips: [
          'Usa el dedo 1 para todas las notas del traste 5, dedo 3 para traste 7 y dedo 4 para traste 8.',
          'Añade técnicas de expresión como ligados (hammer-on y pull-off) o vibrato.'
        ],
        quiz: [
          {
            q: '¿Cuántas notas distintas componen una escala pentatónica en cada octava?',
            options: ['5 notas', '7 notas', '12 notas', '3 notas'],
            correct: 0,
            explain: '"Penta" significa 5; son las 5 notas esenciales que funcionan sin choques disonantes.'
          }
        ]
      }
    ]
  }
];

export const ALL_LESSONS = LEVELS.flatMap((l) => l.lessons);

export function getLesson(id) {
  return ALL_LESSONS.find((l) => l.id === id) || null;
}

export function getLevel(number) {
  return LEVELS.find((l) => l.number === number) || null;
}

export function getNextLesson(currentId) {
  const idx = ALL_LESSONS.findIndex((l) => l.id === currentId);
  return idx >= 0 && idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null;
}
