# gym-coach — offline-first PWA (vanilla JS + IndexedDB, no backend).
# Builds from the repo root; nginx serves all static files.
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80
