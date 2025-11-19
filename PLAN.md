# D3: Magnum Opus

## Game Design Vision

In this game, the player will gather literary components in the pursuit of developing their magnum opus.
Collect components by clicking on nearby cells. Craft by clicking a cell of the same type as the equipped component.
I hope that the player can craft their own narrative by exploring, and feel inspired to create as they like, in whichever medium they like.

## Technologies

- Game Source: TypeScript, HTML, CSS
- Build: Deno and Vite for building
- Automated Deployment: GitHub Actions + GitHub Pages

## Assignments

### D3.a Core Mechanics

- **Map**
  - Cells are visible to the edge of the screen
  - Player can only interact with nearby cells
  - Initial state of cells consistent across page loads
- **Inventory**
  - Player can only hold one item at a time
  - Picking up an item removes it from its cell
  - Display a held item's value, or show that hand is empty
- **Crafting**
  - Player can craft a new item by placing duplicate items together
  - Detect whether the player has the appropriate item in hand for crafting

#### D3.a Steps

- [x] clear main.ts
- [x] render map with leaflet
- [x] display player location
- [x] use loops to display cell grid
- [x] fade cells that are out of reach
- [x] spawn and display a letter
- [x] let player collect letter
- [x] let player place a letter in an empty cell
- [x] spawn a word
- [x] implement combination of letters to create word
- [x] implement win state upon making a word
- [x] refactor + cleanup

### D4.b Globe-spanning Gameplay

- **Map**
  - Anchor map at Null Island (0, 0)
  - Player can move around map and see cells as they go
  - Cells spawn/despawn as they move on/off the screen (allow for farming)
- **Crafting**
  - Progress crafting system to make multiple items of higher value
  - Require highest threshold of crafting to reach win state

#### D4.b Steps

- [x] simulate player movement with buttons
- [x] redraw cells after every move
- [x] spawn cells as they come into view
- [x] save cells that are in view
- [x] kill cells that are out of view
- [x] display cell coordinates relative to Null Island
- [x] implement win state upon crafting highest ranked item
- [ ] refactor + cleanup

### D4.c Object Persistence

- **Map**
  - Save memory by freeing cells which are out of view and unchanged

#### D4.c Steps

- [ ] save cells that have been modified
- [ ] free cells which are out of view
- [ ] free cells which have not been modified
- [ ] refactor + cleanup
