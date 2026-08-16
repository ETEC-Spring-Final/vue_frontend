# Vue 3 + Vite + Tailwind

A lightweight starter template using Vue 3, Vite, and Tailwind CSS.

## Requirements

- Node.js 18+ (or a version compatible with your Vite release)
- npm (or yarn, pnpm)

## Clone and install

```bash
git clone <YOUR_REPO_URL>
cd structure_project_front_vue3
npm install
```

## Run development server

```bash
npm run dev
```

## Build for production

```bash
npm run build
```

## Preview build

```bash
npm run preview
```

## Start Your Own Project

1. Remove the current Git history:
```bash
rm -rf .git
```
2. Initialize a new repository and push to your remote:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <YOUR_NEW_REPO_URL>
git push -u origin main
```

## Recommended (Better Way)

Use GitHub's "Use this template" feature to create a new repository from this project. This creates a clean repo without preserving this project's commit history.

## Project structure

```
public/
src/
	assets/
	components/
		base/
			BaseInput.vue
			BaseButton.vue
		home/
		preview/
			Preview.vue
	composables/
	layouts/
	pages/
		auth/
			Login.vue
			Register.vue
		dashboard/
			Dashboard.vue
		home/
			Home.vue
		preview/
		NotFound.vue
	modules/
	router/
		index.js
	services/
		api.js
	stores/
		auth.store.js
	App.vue
	main.js
	style.css
```

## Deployment note

For Vercel static deployments, add this rewrite to `vercel.json`:

```json
{
	"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Notes

- Tailwind is configured via Vite.
- Fonts are included via Google Fonts in `style.css`.
- The project uses Vue Router, composables, services, and stores directories.

## License

MIT

## Author

Kung Norasmey
