# Datacom Kudos

A responsive, accessible browser prototype for employee recognition. It includes a simulated authenticated user switcher, colleague selection, validated kudos creation, a public recent feed, and admin moderation controls.

## Run locally

Install dependencies and compile the typed source with `npm install` followed by `npm run build`. Then open `index.html` in a browser. The generated `app.js` is the browser bundle, while the application source is maintained in [app.ts](app.ts). Data is persisted in `localStorage`.

Choose **Vatsal Koriya (Admin)** to review moderation controls. Other users demonstrate the employee experience.

See [SPECIFICATION.md](SPECIFICATION.md) for the approved requirements, schema, API design, implementation plan, security considerations, and testing strategy.
