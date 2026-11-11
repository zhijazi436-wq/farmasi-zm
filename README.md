# Zahra Beauty | Farmasi Catalog

A standalone static storefront for browsing the Farmasi product catalog and placing orders through WhatsApp.

## Live site

https://zahra-beauty-farmasi-catalog.vercel.app/

## Project structure

- `farmasi-site/index.html` - storefront entry point
- `farmasi-site/farmasi.css` - layout and styling
- `farmasi-site/farmasi.js` - catalog display, search, saved items, and shopping bag
- `farmasi-site/farmasi-products.js` - product catalog and price snapshot

## Deployments

The `main` branch is connected to the Vercel project `zahra-beauty-farmasi-catalog`. Its Vercel Root Directory is `farmasi-site`; pushes to `main` trigger production deployments automatically. This is a static site and does not require a build command or package installation.

To update the catalog, edit the files in `farmasi-site/` and push the changes to `main`. Preview the site locally with a static web server rooted at `farmasi-site/`.
