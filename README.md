# 🎸 Traste · Academia de Guitarra Interactiva con IA

Una aplicación web moderna e inmersiva diseñada para aprender a tocar guitarra desde cero, con tutoriales guiados en español, biblioteca interactiva de acordes, reproductor de canciones sincronizado y **detección de dedos con Inteligencia Artificial a través de tu cámara web**.

---

## 🚀 Características Principales

### 1. ◉ Cámara IA: Revisor de Dedos en Tiempo Real
- **Detección con MediaPipe HandLandmarker**: Rastrea 21 puntos articulares y las yemas de tus dedos (Índice, Medio, Anular, Meñique) frente a tu cámara web.
- **Diapasón virtual superpuesto**: Compara en milisegundos si estás pisando el traste y cuerda correctos para el acorde objetivo (Em, E, Am, A, D, Dm, C, G, F, Bm, etc.).
- **Diagnóstico guiado dedo a dedo**: Te indica exactamente:
  - *✓ En Traste 1, Cuerda 2 (¡Perfecto!)*
  - *⚠ Sube a la Cuerda 4, Traste 2*
- **Validación sostenida con celebración y audio**: Al sostener la postura correcta con más del 75% de precisión durante 1.2 segundos, la app rasguea el acorde con sonido real, reproduce un sonido de victoria, añade XP a tu perfil y marca el acorde como dominado.
- **Modo Simulación**: Permite probar y ver todo el funcionamiento del algoritmo incluso si no cuentas con una cámara web conectada.

### 2. ◈ Plan de Estudio Guiado (Niveles 0 al 4)
- **Nivel 0: Primeros pasos**: Anatomía de la guitarra, postura ergonómica, cómo afinar las 6 cuerdas y cómo leer diagramas de acordes y tablaturas.
- **Nivel 1: Primeros acordes y rasgueos**: Em, E, Am, A, D, Dm y el rasgueo universal 4/4 (Island strum / pop).
- **Nivel 2: Los 4 acordes mágicos y canciones**: Do mayor (C), Sol mayor (G) y la fórmula I-V-vi-IV que abre el 80% de las canciones del pop.
- **Nivel 3: Arpegios y séptimas**: Técnica fingerpicking P-I-M-A, acordes dominantes (E7, A7, D7, G7, B7) y el sonido blues.
- **Nivel 4: La cejilla, quintas y solos**: Biomecánica del temido acorde de Fa (F), Power Chords del rock y el Patrón 1 de la Escala Pentatónica menor.
- **Tutoriales de YouTube integrados**: Lecciones en video de profesores como David Calabrés, Christianvib, Clasesdeguitarra.com.co, Tus Clases De Guitarra y ChachiGuitar.
- **Quizzes interactivos**: Preguntas de autoevaluación con explicaciones inmediatas y recompensas de XP.

### 3. ▦ Diccionario Sonoro de Acordes
- Más de 25 acordes organizados por familias.
- Diagramas vectoriales SVG interactivos: haz clic en cualquier cuerda para escucharla vibrar individualmente.
- Modal con arpegios lentos cuerda por cuerda y desglose de notas (Fundamental, Tercera, Quinta).

### 4. ♫ Cancionero Play-Along Sincronizado
- Canciones icónicas: *Stand By Me*, *Knockin' on Heaven's Door*, *Zombie*, *De Música Ligera* (Soda Stereo), *La Bamba*, *Smells Like Teen Spirit* y *Riptide*.
- **Visualizador de rasgueo animado**: Muestra en tiempo real las flechas de rasgueo (↓ abajo, ↑ arriba, ✕ chasquido apagado) que botan al ritmo de la música.
- **Compases activos sincronizados**: Iluminación del acorde y cuenta de tiempos (1, 2, 3, 4).
- **Acompañamiento con sintetizador físico Karplus-Strong**: Emula el sonido de cuerdas de guitarra acústica pulsadas en tiempo real mediante la Web Audio API.

### 5. ⚙ Caja de Herramientas del Músico
- **Afinador de guitarra con micrófono**: Algoritmo de detección de tono por autocorrelación con aguja de cents (-50¢ a +50¢) y tonos de referencia sonoros para afinar de oído.
- **Metrónomo con Tap Tempo**: Ajuste de 40 a 240 BPM, compases 4/4, 3/4, 2/4 y 6/8.
- **Entrenador "Minuto de Cambio"**: Desafío de agilidad muscular de 60 segundos para practicar transiciones rápidas entre acordes.
- **Explorador del Diapasón**: Mástil interactivo de 15 trastes para tocar e inspeccionar cualquier nota.

---

## 🛠️ Ejecución Local

1. Instalar dependencias:
   \`\`\`bash
   npm install
   \`\`\`
2. Iniciar el servidor de desarrollo:
   \`\`\`bash
   npm run dev
   \`\`\`
3. Abre tu navegador en **http://localhost:5173/**.
