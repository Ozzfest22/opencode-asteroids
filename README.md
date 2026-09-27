# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `S`       | Abrir/cerrar el selector de skins (pausa el juego) |
| `←` `→`   | Elegir skin (dentro del selector) |
| `Espacio` / `Esc` | Confirmar skin y volver al juego |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |
| Estrella fugaz | 150 |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: la nave se mueve al doble de rápido durante 5 segundos (aparece periódicamente en el mapa)
- Power-up **Triple Shot**: la nave dispara 3 balas en paralelo durante 5 segundos (aparece periódicamente en el mapa, independiente de Velocidad)
- Power-up **Escudo**: burbuja violeta que protege la nave durante 6 segundos; cualquier asteroide o estrella fugaz que toque se vaporiza sin causar daño (sin puntos)
- Asteroide especial **estrella fugaz**: entra por un borde más rápido que los demás, cruza el mapa y desaparece a los 5 s; se destruye de un disparo (150 puntos) y mata a la nave si choca

## Skins

Cambia la apariencia de la nave con la tecla `S`: se abre un selector con vista previa de cada skin y el juego queda pausado. Cada skin define el color de la línea, el color de la llama del propulsor y su propia silueta (las colisiones siguen siendo idénticas en todas). Las skins incluidas son **CLÁSICA**, **FLECHA**, **DELTA** y **DIAMANTE**, y la elegida se guarda en `localStorage` para recordarla entre sesiones.
