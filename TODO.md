- [ ] Inspect widget-related code paths (Electron main, preload IPC, renderer UI/settings, widget HTML/CSS)
- [ ] Remove widget UI/settings from src/index.html (Widgets section + widget suggestion popup)
- [ ] Remove widget suggestion scheduling and widget settings/state from src/renderer.js
- [ ] Remove widget APIs from src/preload.js (show/hide/search/collapse/move/widget state)
- [ ] Remove widget window creation/collapse/resize/IPC handlers from src/main.js, including tray menu entry and startup behavior
- [ ] Delete src/widget.html and src/widget.css
- [ ] Quick grep for remaining widget references and remove/adjust any leftover selectors/styles
- [ ] Run npm start / build to ensure no runtime or compile errors
- [ ] Mark completion in this file

